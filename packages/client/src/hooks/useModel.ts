import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiResponse, ModelRecord, UseModelReturn } from '@neevjs/shared'
import { useNeevClient } from '../core/NeevProvider'

// Module-level cache — shared across all useModel instances for the same key
const cache = new Map<string, ModelRecord[]>()

type Listener = () => void
const listeners = new Map<string, Set<Listener>>()

function emitChange(url: string, exclude?: Listener) {
  listeners.get(url)?.forEach((listener) => {
    if (listener !== exclude) listener()
  })
}

export function mutateModel(url: string) {
  cache.delete(url)
  emitChange(url)
}

const inFlightRequests = new Map<string, Promise<any>>()
const cacheTimestamps = new Map<string, number>()
const cacheError = new Map<string, Error>()
const STALE_TIME = 60 * 1000 // 60 seconds

export interface UseModelOptions {
  suspense?: boolean
  /**
   * Query parameters appended to the request URL.
   * The full URL (including params) is used as the cache key, so
   * useModel('users', { params: { page: 1 } }) and
   * useModel('users', { params: { page: 2 } }) cache independently.
   *
   * @example params: { page: 1, role: 'admin', search: 'rahul' }
   */
  params?: Record<string, string | number | boolean | undefined>
}

export function useModel<T extends ModelRecord>(name: string, options?: UseModelOptions): UseModelReturn<T> {
  const client = useNeevClient()

  // Build URL with optional query string
  const baseUrl = `/${name}`
  const url = options?.params
    ? `${baseUrl}?${new URLSearchParams(
        Object.entries(options.params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()}`
    : baseUrl

  const [data, setData] = useState<T[]>(() => (cache.get(url) as T[]) ?? [])
  const [loading, setLoading] = useState<boolean>(!cache.has(url))
  const [error, setError] = useState<Error | null>(null)

  // -- React Suspense (Render-Phase Fetching) --
  if (options?.suspense) {
    if (cacheError.has(url)) {
      throw cacheError.get(url)
    }

    const timestamp = cacheTimestamps.get(url)
    const isFresh = timestamp && (Date.now() - timestamp < STALE_TIME)

    if (!isFresh && !cache.has(url)) {
      // If offline and no cache, we can't fetch. Throw an error.
      if (!navigator.onLine) {
        throw new Error('[NeevJS] Offline: No cached data available for this model.')
      }

      let requestPromise = inFlightRequests.get(url)
      if (!requestPromise) {
        requestPromise = client.request<ApiResponse<T[]>>(url)
          .then((res) => {
            const rows = Array.isArray(res) ? res : (res.data ?? [])
            cache.set(url, rows)
            cacheTimestamps.set(url, Date.now())
            cacheError.delete(url)
          })
          .catch((err) => {
            // If we went offline during the fetch, and we somehow got cache now, ignore
            if (!navigator.onLine && cache.has(url)) return
            cacheError.set(url, err instanceof Error ? err : new Error(String(err)))
          })
          .finally(() => {
            if (inFlightRequests.get(url) === requestPromise) {
              inFlightRequests.delete(url)
            }
          })
        inFlightRequests.set(url, requestPromise)
      }
      throw requestPromise
    }
  }

  // Track mounted state to avoid state updates after unmount
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchData = useCallback(async (force = false): Promise<void> => {
    // 1. Early exit if offline and we have some cache to show
    if (!navigator.onLine && cache.has(url)) {
      if (mountedRef.current) {
        setData(cache.get(url) as T[])
        setError(null)
        setLoading(false)
      }
      return
    }

    // Check stale-time cache bypass
    if (!force && cache.has(url)) {
      const timestamp = cacheTimestamps.get(url)
      if (timestamp && Date.now() - timestamp < STALE_TIME) {
        if (mountedRef.current) {
          setData(cache.get(url) as T[])
          setError(null)
          setLoading(false)
        }
        return
      }
    }

    if (mountedRef.current) setLoading(true)

    // Deduplicate simultaneous requests
    let requestPromise = inFlightRequests.get(url)
    if (!requestPromise) {
      requestPromise = client.request<ApiResponse<T[]>>(url)
      inFlightRequests.set(url, requestPromise)
    }

    try {
      const res = await requestPromise
      const rows = Array.isArray(res) ? res : (res.data ?? [])
      cache.set(url, rows)
      cacheTimestamps.set(url, Date.now())
      cacheError.delete(url)
      if (mountedRef.current) {
        setData(rows as T[])
        setError(null)
      }
    } catch (err: any) {
      // Graceful offline fallback: if we have cache, don't show an error
      if (!navigator.onLine && cache.has(url)) {
        if (mountedRef.current) {
          setData(cache.get(url) as T[])
          setError(null)
        }
      } else if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      // Only delete if it's the exact same promise (prevents race conditions)
      if (inFlightRequests.get(url) === requestPromise) {
        inFlightRequests.delete(url)
      }
      if (mountedRef.current) setLoading(false)
    }
  }, [client, url])

  useEffect(() => {
    void fetchData(false)
  }, [fetchData])

  const handleRemoteChange = useCallback(() => {
    void fetchData(true)
  }, [fetchData])

  useEffect(() => {
    if (!listeners.has(url)) listeners.set(url, new Set())
    listeners.get(url)!.add(handleRemoteChange)
    return () => {
      listeners.get(url)?.delete(handleRemoteChange)
    }
  }, [url, handleRemoteChange])

  const create = useCallback(async (payload: Omit<T, 'id'>): Promise<void> => {
    try {
      await client.request(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      cache.delete(url)
      await fetchData(true)
      emitChange(url, handleRemoteChange)
    } catch (err: any) {
      if (err.message?.includes('[NeevJS] Offline')) {
        const newRecord = { ...payload, id: `temp_${Date.now()}` } as unknown as T
        const currentData = (cache.get(url) as T[]) ?? []
        const updatedData = [...currentData, newRecord]
        cache.set(url, updatedData)
        setData(updatedData)
        // Global sync: notify other components (like Dashboard)
        emitChange(url, handleRemoteChange)
      } else {
        throw err
      }
    }
  }, [client, url, fetchData, handleRemoteChange])

  const update = useCallback(async (id: number | string, payload: Partial<T>): Promise<void> => {
    try {
      await client.request(`${url}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      cache.delete(url)
      await fetchData(true)
      emitChange(url, handleRemoteChange)
    } catch (err: any) {
      if (err.message?.includes('[NeevJS] Offline')) {
        const currentData = (cache.get(url) as T[]) ?? []
        const updatedData = currentData.map(item => String(item.id) === String(id) ? { ...item, ...payload } : item)
        cache.set(url, updatedData)
        setData(updatedData)
        // Global sync: notify other components
        emitChange(url, handleRemoteChange)
      } else {
        throw err
      }
    }
  }, [client, url, fetchData, handleRemoteChange])

  const remove = useCallback(async (id: number | string): Promise<void> => {
    try {
      await client.request(`${url}/${id}`, {
        method: 'DELETE',
      })
      cache.delete(url)
      await fetchData(true)
      emitChange(url, handleRemoteChange)
    } catch (err: any) {
      if (err.message?.includes('[NeevJS] Offline')) {
        const currentData = (cache.get(url) as T[]) ?? []
        const filteredData = currentData.filter(item => String(item.id) !== String(id))
        cache.set(url, filteredData)
        setData(filteredData)
        // Global sync: notify other components
        emitChange(url, handleRemoteChange)
      } else {
        throw err
      }
    }
  }, [client, url, fetchData, handleRemoteChange])

  return { data, loading, error, create, update, remove, refresh: () => fetchData(true) }
}
