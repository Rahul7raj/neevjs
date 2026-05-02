import React from 'react'
import { useModel, NeevBoundary } from '@neevjs/client'
import { User } from '../../models/user'

function DashboardContent() {
  const { data } = useModel<User>('users', { suspense: true })

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Dashboard</h1>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: 16, color: '#374151' }}>Total Users in System</h3>
        <p style={{ fontSize: 48, fontWeight: 800, color: '#3b82f6', marginTop: 8 }}>{data.length}</p>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 12 }}>
          Navigating back to the Users tab will <strong>not</strong> trigger a network request. It is instantly served from the Stale-Time cache!
        </p>
      </div>
    </div>
  )
}

export function DashboardPage(): React.ReactElement {
  return (
    <NeevBoundary loadingFallback={<p>Loading dashboard metrics...</p>}>
      <DashboardContent />
    </NeevBoundary>
  )
}
