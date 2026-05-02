import jwt from 'jsonwebtoken'
import type { AuthUser } from '@neevjs/shared'

const SECRET = process.env['JWT_SECRET'] ?? 'neevjs-secret-change-in-production'
const EXPIRES_IN = '7d'

export interface JwtPayload {
  id: number | string
  email: string
  role?: string
}

export function generateToken(user: AuthUser): string {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: typeof user.role === 'string' ? user.role : undefined,
  }
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload
}
