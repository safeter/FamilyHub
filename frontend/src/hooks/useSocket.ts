import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { api } from '../api/client'

export function usePolling() {
  const token = useStore((s) => s.token)
  const setWeekEvents = useStore((s) => s.setWeekEvents)
  const weekPlan = useStore((s) => s.weekPlan)
  const setGroceryList = useStore((s) => s.setGroceryList)
  const weekPlanRef = useRef(weekPlan)
  weekPlanRef.current = weekPlan

  useEffect(() => {
    if (!token) return

    const poll = async () => {
      try {
        const events = await api.get<Parameters<typeof setWeekEvents>[0]>('/events/week')
        setWeekEvents(events)

        const plan = weekPlanRef.current
        if (plan?.id) {
          const list = await api.get<Parameters<typeof setGroceryList>[0]>(`/weekplans/${plan.id}/grocery`)
          if (list) setGroceryList(list)
        }
      } catch {
        // ignore polling errors silently
      }
    }

    const id = setInterval(poll, 10000)
    return () => clearInterval(id)
  }, [token, setWeekEvents, setGroceryList])
}
