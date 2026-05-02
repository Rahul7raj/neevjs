import { Router } from 'express'
import { login, register, me, logout } from '../controllers/authController'
import { authMiddleware } from '../middleware/auth'

const router: Router = Router()

router.post('/login', login)
router.post('/register', register)
router.get('/me', authMiddleware, me)
router.post('/logout', authMiddleware, logout)

export default router
