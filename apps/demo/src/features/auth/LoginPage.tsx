import React, { useState } from 'react'
import { useAuth } from '@neevjs/client'
import type { AuthUser } from '@neevjs/client'

export function LoginPage(): React.ReactElement {
  const { login, logout, user, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('admin@neevjs.dev')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  async function handleLogin(): Promise<void> {
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      const u = await user()
      setCurrentUser(u)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout(): void {
    logout()
    setCurrentUser(null)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    marginTop: 4,
    display: 'block',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Auth Demo</h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
        Powered by <code>useAuth()</code> — JWT-based, token auto-injected in all requests
      </p>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 24,
        }}
      >
        {isAuthenticated() && currentUser ? (
          <div>
            <div
              style={{
                padding: 16,
                background: '#f0fdf4',
                borderRadius: 6,
                border: '1px solid #bbf7d0',
                marginBottom: 16,
              }}
            >
              <p style={{ fontWeight: 600, color: '#166534', marginBottom: 4 }}>✓ Logged in</p>
              <p style={{ fontSize: 13, color: '#166534' }}>
                {String(currentUser.name ?? currentUser.email)} — <strong>{String(currentUser.role ?? '')}</strong>
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '10px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 12 }}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 16 }}>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </label>

            {error && (
              <p
                style={{
                  marginBottom: 12,
                  padding: '8px 12px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                {error}
              </p>
            )}

            <button
              onClick={() => void handleLogin()}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                background: loading ? '#9ca3af' : '#111827',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p style={{ marginTop: 12, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
              Demo credentials: admin@neevjs.dev / admin123
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
