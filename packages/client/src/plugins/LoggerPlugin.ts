import { VERSION } from '@neevjs/shared'
import type { NeevPlugin, NeevRequest } from '@neevjs/shared'

export const LoggerPlugin: NeevPlugin = {
  name: 'logger',

  onRequest(req: NeevRequest): NeevRequest {
    console.log(`[NeevJS v${VERSION}] → ${req.options.method ?? 'GET'} ${req.url}`)
    return req
  },

  onResponse(res: Response, req: NeevRequest): Response {
    console.log(`[NeevJS v${VERSION}] ← ${res.status} ${req.options.method ?? 'GET'} ${req.url}`)
    return res
  },

  onError(err: Error, req?: NeevRequest): void {
    console.error(`[NeevJS v${VERSION}] ✗ Error on ${req?.url ?? 'unknown'}:`, err.message)
  },
}
