import { Router } from 'express'
import {
  checkItem,
  addItem,
  deleteItem,
  savePushSubscription,
} from '../controllers/groceryController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

router.patch('/items/:id/check', checkItem)
router.post('/items', addItem)
router.delete('/items/:id', deleteItem)
router.post('/push-subscription', savePushSubscription)

export default router
