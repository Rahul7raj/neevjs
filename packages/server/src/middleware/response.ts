import type { Response } from 'express'
import type { ApiResponse, Pagination } from '@neevjs/shared'

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta: Record<string, unknown> = {},
  status = 200
): void {
  const body: ApiResponse<T> = { data, meta, error: null }
  res.status(status).json(body)
}

export function sendError(res: Response, message: string, status = 400): void {
  const body: ApiResponse<null> = { data: null, meta: {}, error: message }
  res.status(status).json(body)
}

export function paginateMeta(total: number, page: number, perPage: number): { pagination: Pagination } {
  return {
    pagination: {
      page,
      perPage,
      total,
      lastPage: Math.ceil(total / perPage),
    },
  }
}
