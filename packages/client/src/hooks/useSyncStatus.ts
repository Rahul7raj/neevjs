import { useEffect, useState } from 'react'
import type { SyncStatus } from '@neevjs/shared'

// Shared pending count — updated by OfflinePlugin
export const syncState = {
  pendingCount: 0,
  errors: [] as Error[],
  listeners: new Set<() => void>(),
  notify() {
    this.listeners.forEach((fn) => fn())
  },
}

export function useSyncStatus(): SyncStatus {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine)
  const [pending, setPending] = useState<number>(syncState.pendingCount)
  const [syncing, setSyncing] = useState<boolean>(false)
  const [errors, setErrors] = useState<Error[]>(syncState.errors)

  useEffect(() => {
    function onOnline() {
      setIsOffline(false)
      setSyncing(true)
      setTimeout(() => setSyncing(false), 2000)
    }
    function onOffline() {
      setIsOffline(true)
    }
    function onSyncUpdate() {
      setPending(syncState.pendingCount)
      setErrors([...syncState.errors])
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    syncState.listeners.add(onSyncUpdate)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      syncState.listeners.delete(onSyncUpdate)
    }
  }, [])

  function clearErrors() {
    syncState.errors = []
    syncState.notify()
  }

  return { isOffline, pending, syncing, errors, clearErrors }
}
