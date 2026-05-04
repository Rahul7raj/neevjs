// ─── API Contract ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T
  meta: ApiMeta
  error: string | null
}

export interface ApiMeta {
  pagination?: Pagination
  total?: number
  [key: string]: unknown
}

export interface Pagination {
  page: number
  perPage: number
  total: number
  lastPage: number
}

// ─── Plugin System ────────────────────────────────────────────────────────────

export interface NeevRequest {
  url: string
  options: RequestOptions
  [key: string]: unknown
}

export interface RequestOptions {
  method?: string
  body?: string
  headers?: Record<string, string>
  [key: string]: unknown
}

export interface NeevPlugin {
  name: string
  setup?: (client: NeevClientInterface) => void
  onRequest?: (req: NeevRequest) => NeevRequest | Promise<NeevRequest>
  onResponse?: (res: Response, req: NeevRequest) => Response | Promise<Response>
  onError?: (err: Error, req?: NeevRequest) => void
}

// ─── Client ───────────────────────────────────────────────────────────────────

export interface NeevClientConfig {
  baseURL?: string
}

export interface NeevClientInterface {
  request: <T = unknown>(url: string, options?: RequestOptions) => Promise<T>
  use: (plugin: NeevPlugin) => void
  auth: AuthInterface
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number | string
  email: string
  name?: string
  role?: string
  [key: string]: unknown
}

export interface AuthLoginResponse {
  user: AuthUser
  token: string
}

export interface AuthInterface {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  user: () => Promise<AuthUser | null>
  isAuthenticated: () => boolean
}

// ─── useModel ─────────────────────────────────────────────────────────────────

export interface ModelRecord {
  id?: number | string
  [key: string]: unknown
}

export interface UseModelReturn<T extends ModelRecord> {
  data: T[]
  loading: boolean
  error: Error | null
  create: (payload: Omit<T, 'id'>) => Promise<void>
  update: (id: number | string, payload: Partial<T>) => Promise<void>
  remove: (id: number | string) => Promise<void>
  refresh: () => Promise<void>
}

// ─── Sync / Offline ───────────────────────────────────────────────────────────

export interface QueuedAction {
  id: string
  url: string
  options: RequestOptions
  timestamp: number
  retries: number
}

export interface SyncStatus {
  isOffline: boolean
  pending: number
  syncing: boolean
  errors: Error[]
  clearErrors: () => void
}
