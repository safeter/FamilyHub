import { Server, Socket } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('grocery:check', async ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      try {
        const item = await prisma.groceryItem.update({ where: { id: itemId }, data: { checked } })
        io.emit('grocery:item:checked', { itemId, checked, checkedBy: 'socket' })
        return item
      } catch {
        socket.emit('error', { message: 'Impossible de cocher cet article' })
      }
    })

    socket.on('grocery:add', async ({ groceryListId, name, quantity, category }: {
      groceryListId: string
      name: string
      quantity?: string
      category: string
    }) => {
      try {
        const item = await prisma.groceryItem.create({
          data: { name, quantity, category: category as never, addedManually: true, groceryListId },
        })
        io.emit('grocery:item:added', { item })
      } catch {
        socket.emit('error', { message: 'Impossible d\'ajouter cet article' })
      }
    })
  })
}
