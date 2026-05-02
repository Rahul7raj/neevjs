import type { NeevPlugin, NeevRequest } from '@neevjs/shared'

export const LoggerPlugin: NeevPlugin = {
  name: 'logger',

  onRequest(req: NeevRequest): NeevRequest {
    console.log(`[NeevJS] → ${req.options.method ?? 'GET'} ${req.url}`)
    return req
  },

  onResponse(res: Response): Response {
    console.log(`[NeevJS] ← ${res.status} ${res.url}`)
    return res
  },

  onError(err: Error): void {
    console.error('[NeevJS] ✗ Error:', err.message)
  },
}
