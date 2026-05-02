import type { AuthInterface } from '@neevjs/shared'
import { useNeevClient } from '../core/NeevProvider'

export function useAuth(): AuthInterface {
  const client = useNeevClient()
  const auth = client.auth

  return {
    login: (email: string, password: string) => auth.login(email, password),
    register: (email: string, password: string, name?: string) =>
      auth.register(email, password, name),
    logout: () => auth.logout(),
    user: () => auth.user(),
    isAuthenticated: () => auth.isAuthenticated(),
  }
}
