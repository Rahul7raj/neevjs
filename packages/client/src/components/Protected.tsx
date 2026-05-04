import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export interface ProtectedProps {
  children: React.ReactNode
  /** Shown while auth state is being verified. Defaults to null (invisible). */
  loadingFallback?: React.ReactNode
  /** Shown when user is not authenticated or lacks the required role. */
  fallback?: React.ReactNode
  /** If provided, user must have this exact role string to access the content. */
  role?: string
}

export function Protected({ children, loadingFallback = null, fallback, role }: ProtectedProps): React.ReactElement {
  const { isAuthenticated, user } = useAuth()

  // ─── Fix 3: Eliminate auth flash ──────────────────────────────────────────
  // Check the token synchronously on first render. This prevents the empty
  // flash that occurs when `checking` starts as `true` and we render nothing.
  // The token check is synchronous (localStorage.getItem), so we know
  // immediately whether the user is logged in at all.
  const hasToken = isAuthenticated()

  // `checking` is only true when we need to do an async role check.
  // If there's no token at all, we already know the answer — no async needed.
  const [checking, setChecking] = useState<boolean>(hasToken && !!role)
  const [allowed, setAllowed] = useState<boolean>(hasToken && !role)

  useEffect(() => {
    // No token — immediately not allowed, no async work needed
    if (!hasToken) {
      setAllowed(false)
      setChecking(false)
      return
    }

    // No role restriction — already allowed synchronously above
    if (!role) {
      setAllowed(true)
      setChecking(false)
      return
    }

    // Role check requires fetching the user object (async)
    let cancelled = false
    async function checkRole(): Promise<void> {
      const u = await user()
      if (!cancelled) {
        setAllowed(u?.role === role)
        setChecking(false)
      }
    }
    void checkRole()

    return () => {
      cancelled = true
    }
  }, [hasToken, role, user])

  // Only show loadingFallback during the async role check, not for the simple
  // "is authenticated?" case which is resolved synchronously.
  if (checking) {
    return <>{loadingFallback}</>
  }

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
