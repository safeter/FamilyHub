import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { setupSocketHandlers } from './socket/handlers'
import { setupCron } from './cron/morningNotification'
import authRoutes from './routes/auth'
import eventsRoutes from './routes/events'
import weekplansRoutes from './routes/weekplans'
import groceryRoutes from './routes/grocery'
import recipesRoutes from './routes/recipes'
import { errorHandler } from './middleware/errorHandler'

const app = express()
const httpServer = createServer(app)

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

setupSocketHandlers(io)
setupCron()

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`FamilyHub backend listening on :${PORT}`)
})
