import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import eventsRoutes from './routes/events'
import weekplansRoutes from './routes/weekplans'
import groceryRoutes from './routes/grocery'
import recipesRoutes from './routes/recipes'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/weekplans', weekplansRoutes)
app.use('/api/grocery', groceryRoutes)
app.use('/api/recipes', recipesRoutes)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use(errorHandler)

export default app
