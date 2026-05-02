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

    // Run onRequest hooks
    for (const plugin of plugins) {
      if (plugin.onRequest) {
        req = await plugin.onRequest(req)
      }
    }

    // Build headers — auth plugin injects Authorization header via onRequest
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(req.options.headers ?? {}),
    }

    let response: Response

    try {
      response = await fetch(baseURL + req.url, {
        method: req.options.method ?? 'GET',
        body: req.options.body,
        headers,
      })

      // Run onResponse hooks
      let finalResponse = response
      for (const plugin of plugins) {
        if (plugin.onResponse) {
          finalResponse = await plugin.onResponse(finalResponse)
        }
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
        plugin.onError?.(error)
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
    auth: null as unknown as AuthClient, // set below after client is defined
  }

  // Auth is always available as a core feature
  client.auth = new AuthClient(client)

  return client
}
