import type { Request, Response } from 'express'
import { db } from '../db'
import { generateToken } from '../middleware/jwt'
import { sendError, sendSuccess } from '../middleware/response'
import type { AuthUser, ModelRecord } from '@neevjs/shared'

interface AuthUserRecord extends ModelRecord {
  email: string
  password: string
  name?: string
  role?: string
}

export function login(req: Request, res: Response): void {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email || !password) {
    sendError(res, 'Email and password are required')
    return
  }

  const user = db.findBy('auth_users', 'email', email) as AuthUserRecord | undefined

  if (!user || user.password !== password) {
    sendError(res, 'Invalid credentials', 401)
    return
  }

  const { password: _pw, ...safeUser } = user
  const token = generateToken(safeUser as AuthUser)

  sendSuccess(res, { user: safeUser, token })
}

export function register(req: Request, res: Response): void {
  const { email, password, name } = req.body as {
    email?: string
    password?: string
    name?: string
  }

  if (!email || !password) {
    sendError(res, 'Email and password are required')
    return
  }

  const existing = db.findBy('auth_users', 'email', email)
  if (existing) {
    sendError(res, 'Email already registered', 409)
    return
  }

  const created = db.insert('auth_users', { email, password, name, role: 'user' }) as AuthUserRecord
  const { password: _pw, ...safeUser } = created
  const token = generateToken(safeUser as AuthUser)

  sendSuccess(res, { user: safeUser, token }, {}, 201)
}

export function me(req: Request, res: Response): void {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401)
    return
  }
  sendSuccess(res, req.user)
}

export function logout(_req: Request, res: Response): void {
  // JWT is stateless — client just drops the token
  sendSuccess(res, { message: 'Logged out successfully' })
}
