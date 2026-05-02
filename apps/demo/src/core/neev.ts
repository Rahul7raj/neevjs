import { createClient, AuthPlugin, LoggerPlugin, OfflinePlugin } from '@neevjs/client'

export const client = createClient({
  baseURL: '/api',
})

client.use(AuthPlugin)
client.use(LoggerPlugin)
client.use(OfflinePlugin)
