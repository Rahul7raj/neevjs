import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from './jwt'

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    res.status(401).json({ data: null, meta: {}, error: 'Unauthorized — no token provided' })
    return
  }

  try {
    const decoded = verifyToken(token)
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }
    next()
  } catch {
    res.status(401).json({ data: null, meta: {}, error: 'Unauthorized — invalid or expired token' })
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ data: null, meta: {}, error: 'Forbidden — insufficient permissions' })
      return
    }
    next()
  }
}
