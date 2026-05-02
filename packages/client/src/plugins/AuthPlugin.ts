import type { NeevPlugin, NeevRequest } from '@neevjs/shared'

export const AuthPlugin: NeevPlugin = {
  name: 'auth',

  onRequest(req: NeevRequest): NeevRequest {
    const token = localStorage.getItem('neev_token')

    return {
      ...req,
      options: {
        ...req.options,
        headers: {
          ...(req.options.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    }
  },
}
