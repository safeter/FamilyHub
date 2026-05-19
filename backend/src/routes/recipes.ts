import { Router } from 'express'
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../controllers/recipesController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

router.get('/', getRecipes)
router.post('/', createRecipe)
router.put('/:id', updateRecipe)
router.delete('/:id', deleteRecipe)

export default router
