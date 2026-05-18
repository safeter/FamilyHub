import { Response } from 'express'
import { PrismaClient, GroceryCategory } from '@prisma/client'
import { AuthRequest } from '../middleware/auth'
import { io } from '../index'

const prisma = new PrismaClient()

export async function checkItem(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { checked } = req.body

  const item = await prisma.groceryItem.update({
    where: { id },
    data: { checked },
  })

  io.emit('grocery:item:checked', { itemId: id, checked, checkedBy: req.userName })
  res.json(item)
}

export async function addItem(req: AuthRequest, res: Response) {
  const { groceryListId, name, quantity, category } = req.body

  if (!groceryListId) {
    res.status(400).json({ error: 'groceryListId requis' })
    return
  }

  const item = await prisma.groceryItem.create({
    data: {
      name,
      quantity,
      category: category as GroceryCategory,
      addedManually: true,
      groceryListId,
    },
  })

  io.emit('grocery:item:added', { item })
  res.status(201).json(item)
}

export async function deleteItem(req: AuthRequest, res: Response) {
  const { id } = req.params
  await prisma.groceryItem.delete({ where: { id } })
  res.json({ ok: true })
}

export async function savePushSubscription(req: AuthRequest, res: Response) {
  const { subscription } = req.body
  await prisma.user.update({
    where: { id: req.userId },
    data: { pushSubscription: JSON.stringify(subscription) },
  })
  res.json({ ok: true })
}
