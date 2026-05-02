import express, { Application } from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import { createModelRouter } from './routes/modelRouter'

const app: Application = express()
const PORT = process.env['PORT'] ?? 3001

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }))
app.use(express.json())

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok', framework: 'NeevJS Server v0.0.1' }, meta: {}, error: null })
})

// ─── Auth routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)

// ─── Auto-registered model routes ─────────────────────────────────────────────
// Add your models here. Set second arg to true to require authentication.
app.use('/api/users', createModelRouter('users', false))

// Example of a protected route:
// app.use('/api/orders', createModelRouter('orders', true))

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ data: null, meta: {}, error: 'Route not found' })
})

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 NeevJS Server running at http://localhost:${PORT}`)
  console.log(`   API: http://localhost:${PORT}/api`)
  console.log(`   Health: http://localhost:${PORT}/api/health\n`)
})

export default app
