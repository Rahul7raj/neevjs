import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export interface ProtectedProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  role?: string
}

export function Protected({ children, fallback, role }: ProtectedProps): React.ReactElement {
  const { isAuthenticated, user } = useAuth()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    async function check(): Promise<void> {
      if (!isAuthenticated()) {
        setAllowed(false)
        setChecking(false)
        return
      }
      if (role) {
        const u = await user()
        setAllowed(u?.role === role)
      } else {
        setAllowed(true)
      }
      setChecking(false)
    }
    void check()
  }, [isAuthenticated, role, user])

  if (checking) return <></>

  if (!allowed) {
    return (
      <>
        {fallback ?? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
            <p>You are not authorized to view this page.</p>
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}
