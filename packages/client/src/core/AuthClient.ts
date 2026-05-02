import type {
  ApiResponse,
  AuthInterface,
  AuthLoginResponse,
  AuthUser,
  NeevClientInterface,
} from '@neevjs/shared'

export class AuthClient implements AuthInterface {
  private client: NeevClientInterface
  private userData: AuthUser | null = null

  constructor(client: NeevClientInterface) {
    this.client = client
  }

  async login(email: string, password: string): Promise<void> {
    const res = await this.client.request<ApiResponse<AuthLoginResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('neev_token', res.data.token)
    this.userData = res.data.user
  }

  async register(email: string, password: string, name?: string): Promise<void> {
    const res = await this.client.request<ApiResponse<AuthLoginResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
    localStorage.setItem('neev_token', res.data.token)
    this.userData = res.data.user
  }

  logout(): void {
    localStorage.removeItem('neev_token')
    this.userData = null
  }

  async user(): Promise<AuthUser | null> {
    if (!this.isAuthenticated()) return null
    if (this.userData) return this.userData
    const res = await this.client.request<ApiResponse<AuthUser>>('/auth/me')
    this.userData = res.data
    return this.userData
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('neev_token')
  }

  getToken(): string | null {
    return localStorage.getItem('neev_token')
  }
}
