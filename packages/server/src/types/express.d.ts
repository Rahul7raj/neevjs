import type { AuthUser } from '@neevjs/shared'

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export {}
