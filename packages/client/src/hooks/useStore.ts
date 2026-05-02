import { useCallback, useSyncExternalStore } from 'react'

// ─── Module-level store ───────────────────────────────────────────────────────
const stores = new Map<string, unknown>()
const listeners = new Map<string, Set<() => void>>()

function subscribe(key: string, callback: () => void): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key)!.add(callback)
  return () => {
    listeners.get(key)!.delete(callback)
  }
}

function emitChange(key: string): void {
  listeners.get(key)?.forEach((fn) => fn())
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
const PERSIST_PREFIX = 'neev_store_'
const SESSION_PREFIX = 'neev_session_'

interface StorageEntry<T> {
  value: T
  expiresAt?: number
}

type StorageBackend = 'localStorage' | 'sessionStorage'

function readFromStorage<T>(key: string, backend: StorageBackend, fallback: T): T {
  try {
    const prefix = backend === 'sessionStorage' ? SESSION_PREFIX : PERSIST_PREFIX
    const raw = window[backend].getItem(prefix + key)
    if (raw === null) return fallback

    const entry = JSON.parse(raw) as StorageEntry<T>

    // TTL check
    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      window[backend].removeItem(prefix + key)
      return fallback
    }

    return entry.value
  } catch {
    return fallback
  }
}

function writeToStorage<T>(key: string, value: T, backend: StorageBackend, ttl?: number): void {
  try {
    const prefix = backend === 'sessionStorage' ? SESSION_PREFIX : PERSIST_PREFIX
    const entry: StorageEntry<T> = {
      value,
      expiresAt: ttl !== undefined ? Date.now() + ttl : undefined,
    }
    window[backend].setItem(prefix + key, JSON.stringify(entry))
  } catch {
    // Silently ignore quota errors
  }
}

// ─── Options ──────────────────────────────────────────────────────────────────
export interface UseStoreOptions {
  /**
   * Persist value to localStorage. Survives page reloads and browser restarts.
   *
   * ⚠️ SECURITY: localStorage is readable by any JavaScript on the page.
   * Do NOT use for sensitive data (passwords, payment info, PII).
   * Use `{ session: true }` instead for semi-sensitive data.
   *
   * @default false
   */
  persist?: boolean

  /**
   * Store value in sessionStorage. Survives page refresh but is:
   * - Cleared when the browser tab closes
   * - NOT shared across tabs
   * - Safer than localStorage for semi-sensitive data (e.g. current user preferences)
   *
   * Cannot be combined with `persist: true`.
   *
   * @default false
   */
  session?: boolean

  /**
   * TTL (time-to-live) in milliseconds. After this duration, the stored value
   * expires and falls back to `initialValue`.
   * Only applies when `persist` or `session` is true.
   *
   * @example ttl: 7 * 24 * 60 * 60 * 1000  // 7 days
   */
  ttl?: number
}

// ─── Hook ────────────────────────────────────────────────────────────────────
/**
 * `useStore` — Global client-side state management for NeevJS.
 *
 * Built on React 18's `useSyncExternalStore` for concurrent-mode safety.
 *
 * Security levels:
 * - Default (in-memory only)  → Most secure. Lost on refresh.
 * - `{ session: true }`       → sessionStorage. Safe for semi-sensitive data.
 * - `{ persist: true }`       → localStorage. For non-sensitive preferences only.
 *
 * For truly sensitive data that must persist across sessions → store on the server.
 */
export function useStore<T>(
  key: string,
  initialValue: T,
  options: UseStoreOptions = {},
): [T, (updater: T | ((prev: T) => T)) => void] {
  const { persist = false, session = false, ttl } = options

  const backend: StorageBackend | null = persist
    ? 'localStorage'
    : session
    ? 'sessionStorage'
    : null

  // Initialize once per key
  if (!stores.has(key)) {
    const resolved = backend
      ? readFromStorage<T>(key, backend, initialValue)
      : initialValue
    stores.set(key, resolved)
  }

  const snapshot = useSyncExternalStore<T>(
    useCallback((callback) => subscribe(key, callback), [key]),
    useCallback(() => stores.get(key) as T, [key]),
    useCallback(() => initialValue, []), // eslint-disable-line react-hooks/exhaustive-deps
  )

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const current = stores.get(key) as T
      const next =
        typeof updater === 'function'
          ? (updater as (prev: T) => T)(current)
          : updater

      stores.set(key, next)

      if (backend) {
        writeToStorage(key, next, backend, ttl)
      }

      emitChange(key)
    },
    [key, backend, ttl],
  )

  return [snapshot, setValue]
}

// ─── Imperative API ───────────────────────────────────────────────────────────
export function getStore<T>(key: string): T | undefined {
  return stores.get(key) as T | undefined
}

export function setStore<T>(key: string, value: T): void {
  stores.set(key, value)
  emitChange(key)
}

export function clearPersistedStore(key: string): void {
  try {
    localStorage.removeItem(PERSIST_PREFIX + key)
    sessionStorage.removeItem(SESSION_PREFIX + key)
  } catch { /* ignore */ }
}
