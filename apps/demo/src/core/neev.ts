import { createClient, AuthPlugin, LoggerPlugin, OfflinePlugin, CachePlugin } from '@neevjs/client'

export const client = createClient({
  baseURL: '/api',
})

client.use(AuthPlugin)
client.use(LoggerPlugin)
client.use(OfflinePlugin)
client.use(CachePlugin)

// Expose to window for Playwright tests
if (typeof window !== 'undefined') {
  (window as any).neevClient = client
}
