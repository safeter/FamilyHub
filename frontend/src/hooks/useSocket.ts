import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useStore } from '../store'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', { path: '/socket.io', transports: ['websocket'] })
  }
  return socket
}

export function useSocket() {
  const { updateGroceryItem, addGroceryItem, upsertEvent, setWeekPlan } = useStore()

  useEffect(() => {
    const s = getSocket()

    s.on('grocery:item:checked', ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      updateGroceryItem(itemId, checked)
    })

    s.on('grocery:item:added', ({ item }: { item: Parameters<typeof addGroceryItem>[0] }) => {
      addGroceryItem(item)
    })

    s.on('event:updated', ({ event }: { event: Parameters<typeof upsertEvent>[0] & { deleted?: boolean } }) => {
      if (event.deleted) {
        useStore.getState().removeEvent(event.id)
      } else {
        upsertEvent(event)
      }
    })

    s.on('mealplan:updated', ({ weekPlanId, meals }: { weekPlanId: string; meals: unknown[] }) => {
      const current = useStore.getState().weekPlan
      if (current?.id === weekPlanId) {
        setWeekPlan({ ...current, meals: meals as typeof current.meals })
      }
    })

    return () => {
      s.off('grocery:item:checked')
      s.off('grocery:item:added')
      s.off('event:updated')
      s.off('mealplan:updated')
    }
  }, [updateGroceryItem, addGroceryItem, upsertEvent, setWeekPlan])
}
