import { useEffect, useState } from 'react'
import type { SyncStatus } from '@neevjs/shared'

// Shared sync state — updated directly by OfflinePlugin
// Fix 4: `syncing` is now driven by OfflinePlugin.processQueue() start/end,
// not by a hardcoded 2-second timeout.
export const syncState = {
  pendingCount: 0,
  syncing: false,
  errors: [] as Error[],
  listeners: new Set<() => void>(),
  notify() {
    this.listeners.forEach((fn) => fn())
  },
}

export function useSyncStatus(): SyncStatus {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine)
  const [pending, setPending] = useState<number>(syncState.pendingCount)
  const [syncing, setSyncing] = useState<boolean>(syncState.syncing)
  const [errors, setErrors] = useState<Error[]>(syncState.errors)

  useEffect(() => {
    function onOnline() {
      setIsOffline(false)
      // Note: syncing will be set to true by OfflinePlugin.processQueue()
      // via syncState.notify() — we no longer use a hardcoded timeout here.
    }
    function onOffline() {
      setIsOffline(true)
    }
    function onSyncUpdate() {
      setPending(syncState.pendingCount)
      setSyncing(syncState.syncing)
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
