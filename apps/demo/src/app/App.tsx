import React, { useState } from 'react'
import { NeevProvider } from '@neevjs/client'
import { client } from '../core/neev'
import { UsersPage } from '../features/users/UsersPage'
import { LoginPage } from '../features/auth/LoginPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { NavBtn } from '../shared/components/NavBtn'
import { SyncIndicator } from '../shared/components/SyncIndicator'

export default function App(): React.ReactElement {
  const [page, setPage] = useState<'users' | 'login' | 'dashboard'>('dashboard')

  return (
    <NeevProvider client={client}>
      <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
        {/* Nav */}
        <nav
          style={{
            background: '#111827',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
          }}
        >
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>
            ⚡ NeevJS Demo
          </span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <SyncIndicator />
            <div style={{ display: 'flex', gap: 8 }}>
            <NavBtn active={page === 'dashboard'} onClick={() => setPage('dashboard')}>
              Dashboard
            </NavBtn>
            <NavBtn active={page === 'users'} onClick={() => setPage('users')}>
              Users
            </NavBtn>
            <NavBtn active={page === 'login'} onClick={() => setPage('login')}>
              Auth Demo
            </NavBtn>
            </div>
          </div>
        </nav>

        {/* Page */}
        <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
          {page === 'dashboard' && <DashboardPage />}
          {page === 'users' && <UsersPage />}
          {page === 'login' && <LoginPage />}
        </main>
      </div>
    </NeevProvider>
  )
}
