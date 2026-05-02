import { Router } from 'express'
import { createModelController } from '../controllers/modelController'

export function createModelRouter(tableName: string, protected_ = false): Router {
  const router = Router()
  const ctrl = createModelController(tableName)

  // Lazy import to avoid circular dep — only import when protected routes needed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { authMiddleware } = protected_
    ? (require('../middleware/auth') as { authMiddleware: (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void })
    : { authMiddleware: null }

  const guard = protected_ && authMiddleware ? [authMiddleware] : []

  router.get('/', ...guard, ctrl.index)
  router.get('/:id', ...guard, ctrl.show)
  router.post('/', ...guard, ctrl.store)
  router.put('/:id', ...guard, ctrl.update)
  router.delete('/:id', ...guard, ctrl.destroy)

  return router
}
