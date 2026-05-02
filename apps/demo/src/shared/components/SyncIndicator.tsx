import React from 'react'
import { useSyncStatus } from '@neevjs/client'

export function SyncIndicator(): React.ReactElement {
  const { isOffline, pending, syncing, errors, clearErrors } = useSyncStatus()

  if (errors.length > 0) {
    return (
      <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600 }}>⚠️ {errors.length} Sync Error(s)</span>
        <button onClick={clearErrors} style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, padding: 0 }}>Dismiss</button>
      </div>
    )
  }

  if (syncing) return <span style={{ color: '#60a5fa', fontSize: 13, fontWeight: 500 }}>↻ Syncing...</span>
  if (isOffline) return <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 500 }}>● Offline ({pending} queued)</span>
  if (pending > 0) return <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 500 }}>● Pending ({pending})</span>
  
  return <span style={{ color: '#10b981', fontSize: 13, fontWeight: 500 }}>● Online</span>
}
