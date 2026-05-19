import { Response } from 'express'
import { PrismaClient, GroceryCategory } from '@prisma/client'
import { AuthRequest } from '../middleware/auth'

const prisma = new PrismaClient()

const includeIngredients = {
  ingredients: { orderBy: { name: 'asc' as const } },
}

export async function getRecipes(_req: AuthRequest, res: Response) {
  const recipes = await prisma.recipe.findMany({
    include: includeIngredients,
    orderBy: { name: 'asc' },
  })
  res.json(recipes)
}

export async function createRecipe(req: AuthRequest, res: Response) {
  const { name, description, ingredients } = req.body
  const recipe = await prisma.recipe.create({
    data: {
      name,
      description,
      ingredients: {
        create: (ingredients ?? []).map((i: { name: string; quantity: string; category: string }) => ({
          name: i.name,
          quantity: i.quantity,
          category: i.category as GroceryCategory,
        })),
      },
    },
    include: includeIngredients,
  })
  res.status(201).json(recipe)
}

export async function updateRecipe(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { name, description, ingredients } = req.body

  // Replace ingredients entirely
  await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } })

  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      name,
      description,
      ingredients: {
        create: (ingredients ?? []).map((i: { name: string; quantity: string; category: string }) => ({
          name: i.name,
          quantity: i.quantity,
          category: i.category as GroceryCategory,
        })),
      },
    },
    include: includeIngredients,
  })
  res.json(recipe)
}

export async function deleteRecipe(req: AuthRequest, res: Response) {
  const { id } = req.params
  await prisma.recipe.delete({ where: { id } })
  res.json({ ok: true })
}
