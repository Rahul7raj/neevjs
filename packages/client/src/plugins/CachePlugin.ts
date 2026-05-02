import type { NeevPlugin, NeevRequest } from '@neevjs/shared'

interface CacheEntry {
  data: unknown
  expiresAt: number
}

export interface CachePluginOptions {
  /** TTL in milliseconds. Default: 60_000 (1 minute) */
  ttl?: number
}

export function createCachePlugin(options: CachePluginOptions = {}): NeevPlugin {
  const ttl = options.ttl ?? 60_000
  const store = new Map<string, CacheEntry>()

  return {
    name: 'cache',

    onRequest(req: NeevRequest): NeevRequest {
      const method = (req.options.method ?? 'GET').toUpperCase()
      // Only cache GET requests
      if (method !== 'GET') return req

      const entry = store.get(req.url)
      if (entry && Date.now() < entry.expiresAt) {
        // Signal a cache hit via a custom flag — the response will be a synthetic Response
        const cached = new Response(JSON.stringify(entry.data), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Neev-Cache': 'HIT' },
        })
        // Attach cached response to the request object for onResponse to detect
        return { ...req, _cachedResponse: cached }
      }

      return req
    },

    async onResponse(res: Response): Promise<Response> {
      if (res.headers.get('X-Neev-Cache') === 'HIT') return res

      const url = res.url
      if (!url) return res

      try {
        const clone = res.clone()
        const data = await clone.json()
        store.set(url, { data, expiresAt: Date.now() + ttl })
      } catch {
        // Non-JSON responses are not cached
      }

      return res
    },

    onError(): void {
      // No action on error for cache plugin
    },
  }
}

// Default export for zero-config use
export const CachePlugin = createCachePlugin()
