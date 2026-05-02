import type { Request, Response } from 'express'
import { db } from '../db'
import { sendError, sendSuccess, paginateMeta } from '../middleware/response'
import type { ModelRecord } from '@neevjs/shared'

export function createModelController(tableName: string) {
  return {
    index(req: Request, res: Response): void {
      const all = db.findAll(tableName)
      const page = parseInt(String(req.query['page'] ?? '1'), 10)
      const perPage = parseInt(String(req.query['perPage'] ?? '20'), 10)
      const start = (page - 1) * perPage
      const paginated = all.slice(start, start + perPage)
      sendSuccess(res, paginated, paginateMeta(all.length, page, perPage))
    },

    show(req: Request, res: Response): void {
      const record = db.findById(tableName, req.params['id'] ?? '')
      if (!record) {
        sendError(res, `${tableName} not found`, 404)
        return
      }
      sendSuccess(res, record)
    },

    store(req: Request, res: Response): void {
      const body = req.body as Omit<ModelRecord, 'id'>
      const record = db.insert(tableName, body)
      sendSuccess(res, record, {}, 201)
    },

    update(req: Request, res: Response): void {
      const record = db.update(tableName, req.params['id'] ?? '', req.body as Partial<ModelRecord>)
      if (!record) {
        sendError(res, `${tableName} not found`, 404)
        return
      }
      sendSuccess(res, record)
    },

    destroy(req: Request, res: Response): void {
      const deleted = db.delete(tableName, req.params['id'] ?? '')
      if (!deleted) {
        sendError(res, `${tableName} not found`, 404)
        return
      }
      sendSuccess(res, { message: `${tableName} deleted` })
    },
  }
}
