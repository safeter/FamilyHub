import { Router } from 'express'
import {
  getEvents,
  getWeekEvents,
  getCriticalEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventsController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

router.get('/critical', getCriticalEvents)
router.get('/week', getWeekEvents)
router.get('/', getEvents)
router.post('/', createEvent)
router.put('/:id', updateEvent)
router.delete('/:id', deleteEvent)

export default router
