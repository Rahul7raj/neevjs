import React, { useState } from 'react'
import { useModel, NeevBoundary } from '@neevjs/client'
import { User } from '../../models/user'
import { UserTable } from './components/UserTable'
import { UserForm } from './components/UserForm'

function UsersContent(): React.ReactElement {
  const { remove } = useModel<User>('users', { suspense: true })
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)

  function handleEdit(user: User): void {
    setEditUser(user)
    setShowForm(true)
  }

  async function handleDelete(user: User): Promise<void> {
    if (!confirm(`Delete "${user.name}"?`)) return
    await remove(user.id)
  }

  function handleSuccess(): void {
    setShowForm(false)
    setEditUser(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Users</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
            Powered by <code>useModel('users')</code> — no fetch, no axios
          </p>
        </div>
        <button
          onClick={() => { setEditUser(null); setShowForm(!showForm) }}
          style={{
            padding: '8px 16px',
            background: '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && <UserForm editUser={editUser} onSuccess={handleSuccess} />}

      <UserTable onEdit={handleEdit} onDelete={(user) => void handleDelete(user)} />

      <p style={{ marginTop: 16, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
        Make sure the NeevJS server is running on port 3001
      </p>
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: '#6b7280', fontSize: 18, marginBottom: 16 }}>Loading Users...</h2>
      <div style={{ background: '#f3f4f6', height: 200, borderRadius: 8, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
    </div>
  )
}

export function UsersPage(): React.ReactElement {
  return (
    <NeevBoundary loadingFallback={<SkeletonLoader />}>
      <UsersContent />
    </NeevBoundary>
  )
}
