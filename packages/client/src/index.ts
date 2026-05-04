// Core
export { VERSION } from '@neevjs/shared'
export { createClient } from './core/createClient'
export { NeevProvider, NeevContext, useNeevClient } from './core/NeevProvider'
export { AuthClient } from './core/AuthClient'
export { SecureStore } from './core/SecureStore'

// Hooks
export { useModel } from './hooks/useModel'
export { useAuth } from './hooks/useAuth'
export { useSyncStatus } from './hooks/useSyncStatus'
export { useStore, getStore, setStore, clearPersistedStore } from './hooks/useStore'

// Components
export { Table } from './components/Table'
export { Form } from './components/Form'
export { Protected } from './components/Protected'
export { NeevBoundary } from './components/NeevBoundary'

// Plugins
export { AuthPlugin } from './plugins/AuthPlugin'
export { LoggerPlugin } from './plugins/LoggerPlugin'
export { CachePlugin, createCachePlugin } from './plugins/CachePlugin'
export { OfflinePlugin, createOfflinePlugin } from './plugins/OfflinePlugin'

// Types (re-exported from shared for convenience)
export type {
  ApiResponse,
  ApiMeta,
  Pagination,
  NeevRequest,
  RequestOptions,
  NeevPlugin,
  NeevClientConfig,
  NeevClientInterface,
  AuthUser,
  AuthLoginResponse,
  AuthInterface,
  ModelRecord,
  UseModelReturn,
  QueuedAction,
  SyncStatus,
} from '@neevjs/shared'
