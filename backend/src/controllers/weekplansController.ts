import { Response } from 'express'
import { PrismaClient, GroceryCategory } from '@prisma/client'
import { AuthRequest } from '../middleware/auth'
import { io } from '../index'

const prisma = new PrismaClient()

const includeMeals = {
  meals: {
    include: { recipe: { include: { ingredients: true } } },
    orderBy: [{ dayOfWeek: 'asc' as const }, { slot: 'asc' as const }],
  },
}

export async function getWeekPlan(req: AuthRequest, res: Response) {
  const date = req.query.date ? new Date(req.query.date as string) : new Date()
  const weekStart = startOfWeek(date)

  let plan = await prisma.weekPlan.findUnique({
    where: { weekStart },
    include: includeMeals,
  })

  if (!plan) {
    plan = await prisma.weekPlan.create({
      data: { weekStart, createdById: req.userId! },
      include: includeMeals,
    })
  }

  res.json(plan)
}

export async function createWeekPlan(req: AuthRequest, res: Response) {
  const { weekStart } = req.body
  const plan = await prisma.weekPlan.upsert({
    where: { weekStart: new Date(weekStart) },
    update: { createdById: req.userId! },
    create: { weekStart: new Date(weekStart), createdById: req.userId! },
    include: includeMeals,
  })
  res.status(201).json(plan)
}

export async function updateMeals(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { meals } = req.body as {
    meals: Array<{
      dayOfWeek: number
      slot: 'LUNCH' | 'DINNER'
      recipeId?: string
      customLabel?: string
    }>
  }

  await prisma.meal.deleteMany({ where: { weekPlanId: id } })

  await prisma.meal.createMany({
    data: meals.map(m => ({ ...m, weekPlanId: id })),
  })

  const updated = await prisma.weekPlan.findUnique({
    where: { id },
    include: includeMeals,
  })

  io.emit('mealplan:updated', { weekPlanId: id, meals: updated?.meals })
  res.json(updated)
}

export async function getGrocery(req: AuthRequest, res: Response) {
  const { id } = req.params
  const list = await prisma.groceryList.findUnique({
    where: { weekPlanId: id },
    include: {
      items: { orderBy: [{ checked: 'asc' }, { category: 'asc' }, { name: 'asc' }] },
    },
  })
  res.json(list ?? { weekPlanId: id, items: [] })
}

export async function generateGrocery(req: AuthRequest, res: Response) {
  const { id } = req.params

  const plan = await prisma.weekPlan.findUnique({
    where: { id },
    include: {
      meals: { include: { recipe: { include: { ingredients: true } } } },
      groceryList: { include: { items: true } },
    },
  })

  if (!plan) {
    res.status(404).json({ error: 'Plan introuvable' })
    return
  }

  // Collect ingredients from all recipes
  const ingredientMap = new Map<string, { name: string; quantity: string; category: GroceryCategory }>()

  for (const meal of plan.meals) {
    if (!meal.recipe) continue
    for (const ing of meal.recipe.ingredients) {
      const key = ing.name.toLowerCase()
      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, { name: ing.name, quantity: ing.quantity, category: ing.category })
      }
    }
  }

  // Keep manually added items, replace auto-generated ones
  const manualItems = plan.groceryList?.items.filter(i => i.addedManually) ?? []

  if (plan.groceryList) {
    await prisma.groceryItem.deleteMany({
      where: { groceryListId: plan.groceryList.id, addedManually: false },
    })
  }

  const list = await prisma.groceryList.upsert({
    where: { weekPlanId: id },
    update: {},
    create: { weekPlanId: id },
    include: { items: true },
  })

  const newItems = Array.from(ingredientMap.values()).filter(
    ing => !manualItems.some(m => m.name.toLowerCase() === ing.name.toLowerCase())
  )

  if (newItems.length > 0) {
    await prisma.groceryItem.createMany({
      data: newItems.map(i => ({ ...i, groceryListId: list.id })),
    })
  }

  const finalList = await prisma.groceryList.findUnique({
    where: { weekPlanId: id },
    include: {
      items: { orderBy: [{ checked: 'asc' }, { category: 'asc' }, { name: 'asc' }] },
    },
  })

  res.json(finalList)
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
