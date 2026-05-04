import type {
  ApiResponse,
  AuthInterface,
  AuthLoginResponse,
  AuthUser,
  NeevClientInterface,
} from '@neevjs/shared'

const USER_CACHE_KEY = 'neev_user'

export class AuthClient implements AuthInterface {
  private client: NeevClientInterface
  private userData: AuthUser | null = null

  constructor(client: NeevClientInterface) {
    this.client = client
    // Fix 8: Restore cached user from sessionStorage on page reload.
    // sessionStorage is cleared when the tab closes, which is the correct
    // lifetime for a user session object.
    try {
      const cached = sessionStorage.getItem(USER_CACHE_KEY)
      if (cached) this.userData = JSON.parse(cached) as AuthUser
    } catch { /* ignore */ }
  }

  async login(email: string, password: string): Promise<void> {
    const res = await this.client.request<ApiResponse<AuthLoginResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('neev_token', res.data.token)
    this.userData = res.data.user
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(this.userData))
  }

  async register(email: string, password: string, name?: string): Promise<void> {
    const res = await this.client.request<ApiResponse<AuthLoginResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
    localStorage.setItem('neev_token', res.data.token)
    this.userData = res.data.user
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(this.userData))
  }

  logout(): void {
    localStorage.removeItem('neev_token')
    sessionStorage.removeItem(USER_CACHE_KEY)
    this.userData = null
  }

  async user(): Promise<AuthUser | null> {
    if (!this.isAuthenticated()) return null
    if (this.userData) return this.userData
    // Only hits /auth/me if there's a token but no cached user object
    const res = await this.client.request<ApiResponse<AuthUser>>('/auth/me')
    this.userData = res.data
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(this.userData))
    return this.userData
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('neev_token')
  }

  getToken(): string | null {
    return localStorage.getItem('neev_token')
  }
}
