import type {
  NeevClientConfig,
  NeevClientInterface,
  NeevPlugin,
  NeevRequest,
  RequestOptions,
} from '@neevjs/shared'
import { AuthClient } from './AuthClient'

export function createClient(config: NeevClientConfig = {}): NeevClientInterface {
  const plugins: NeevPlugin[] = []
  const baseURL = config.baseURL ?? ''

  async function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
    let req: NeevRequest = { url, options }

    // Run onRequest hooks — plugins (e.g. AuthPlugin, CachePlugin) can mutate the request
    for (const plugin of plugins) {
      if (plugin.onRequest) {
        req = await plugin.onRequest(req)
      }
    }

    // ─── Fix 1: Serve cached response if CachePlugin provided one ───────────
    // CachePlugin sets req._cachedResponse on a cache hit. If present, skip
    // the network fetch entirely and run it through the onResponse pipeline.
      if (req._cachedResponse instanceof Response) {
        let cachedRes = req._cachedResponse
        for (const plugin of plugins) {
          if (plugin.onResponse) {
            cachedRes = await plugin.onResponse(cachedRes, req)
          }
        }
        return cachedRes.json() as Promise<T>
      }

      // Build headers — AuthPlugin injects Authorization header via onRequest
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(req.options.headers ?? {}),
      }

      let response: Response

      try {
        const finalBaseURL = req.options.baseURL ?? baseURL
        response = await fetch(finalBaseURL + req.url, {
          method: req.options.method ?? 'GET',
          body: req.options.body,
          headers,
        })

        // Run onResponse hooks
        let finalResponse = response
        for (const plugin of plugins) {
          if (plugin.onResponse) {
            finalResponse = await plugin.onResponse(finalResponse, req)
          }
        }

        // ─── Fix 2: Auto-logout on 401 (token expired or invalid) ───────────
        // Instead of silently failing with 401 errors, log the user out so they
        // are redirected to the login page on the next Protected/auth check.
        if (finalResponse.status === 401) {
          client.auth?.logout()
          const error = new Error('Session expired. Please log in again.') as Error & { status: number }
          error.status = 401
          for (const plugin of plugins) {
            plugin.onError?.(error, req)
          }
          throw error
        }

        if (!finalResponse.ok) {
          const errorBody = await finalResponse.json().catch(() => ({ error: 'Unknown error' }))
          const error = new Error(
            typeof errorBody.error === 'string' ? errorBody.error : `HTTP ${finalResponse.status}`
          ) as Error & { status?: number }
          error.status = finalResponse.status
          throw error
        }

        return finalResponse.json() as Promise<T>
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        for (const plugin of plugins) {
          plugin.onError?.(error, req)
        }
        throw error
      }
  }

  function use(plugin: NeevPlugin): void {
    plugins.push(plugin)
    plugin.setup?.(client)
  }

  const client: NeevClientInterface = {
    request,
    use,
    auth: null as unknown as AuthClient,
  }

  // Auth is always available as a core feature
  client.auth = new AuthClient(client)

  return client
}
