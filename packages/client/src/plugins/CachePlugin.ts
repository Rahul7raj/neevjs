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
      
      // ─── Invalidation Logic ───────────────────────────────────────────────
      // If this is a mutation (POST, PUT, DELETE, PATCH), invalidate the
      // cache for this URL. This ensures that the next GET request will
      // fetch fresh data from the server.
      if (method !== 'GET') {
        store.delete(req.url)
        
        // Also try to invalidate the base collection URL.
        // e.g., POST /users/1 or PUT /users/1 should invalidate GET /users
        const parts = req.url.split('/')
        if (parts.length > 2) {
           const baseUrl = '/' + parts[1]
           store.delete(baseUrl)
        }
        
        return req
      }

      const entry = store.get(req.url)
      if (entry && Date.now() < entry.expiresAt) {
        // Signal a cache hit via a custom flag — the response will be a synthetic Response
        const cached = new Response(JSON.stringify(entry.data), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json', 
            'X-Neev-Cache': 'HIT' 
          },
        })
        // Attach cached response to the request object for createClient to detect
        return { ...req, _cachedResponse: cached }
      }

      return req
    },

    async onResponse(res: Response, req: NeevRequest): Promise<Response> {
      // Don't cache if it was already a cache hit or if the request failed
      if (res.headers.get('X-Neev-Cache') === 'HIT' || !res.ok) return res

      // Only cache GET requests
      const method = (req.options.method ?? 'GET').toUpperCase()
      if (method !== 'GET') return res
      
      try {
        const clone = res.clone()
        const data = await clone.json()
        // Use req.url as the key to ensure exact match with onRequest
        store.set(req.url, { data, expiresAt: Date.now() + ttl })
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
