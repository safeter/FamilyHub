import { Router } from 'express'
import {
  getWeekPlan,
  createWeekPlan,
  updateMeals,
  getGrocery,
  generateGrocery,
} from '../controllers/weekplansController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

router.get('/', getWeekPlan)
router.post('/', createWeekPlan)
router.put('/:id/meals', updateMeals)
router.get('/:id/grocery', getGrocery)
router.post('/:id/grocery/generate', generateGrocery)

export default router
