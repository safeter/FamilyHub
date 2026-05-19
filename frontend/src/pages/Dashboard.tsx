import { useEffect } from 'react'
import { useStore } from '../store'
import { api } from '../api/client'
import DayCard from '../components/DayCard'
import { addDays, startOfDay } from 'date-fns'

export default function Dashboard() {
  const {
    weekEvents,
    weekPlan,
    criticalDays,
    setWeekEvents,
    setWeekPlan,
    setCriticalDays,
    user,
  } = useStore()

  useEffect(() => {
    async function load() {
      const [events, plan, critical] = await Promise.all([
        api.get<typeof weekEvents>('/events/week'),
        api.get<typeof weekPlan>('/weekplans'),
        api.get<{ criticalDays: string[] }>('/events/critical'),
      ])
      setWeekEvents(events)
      if (plan) setWeekPlan(plan)
      setCriticalDays(critical.criticalDays)
    }
    load()
  }, [setWeekEvents, setWeekPlan, setCriticalDays])

  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)

  function eventsForDay(date: Date) {
    const iso = date.toISOString().slice(0, 10)
    return weekEvents.filter((e) => e.startTime.slice(0, 10) === iso)
  }

  function dinnerForDay(date: Date) {
    const dow = date.getDay() === 0 ? 6 : date.getDay() - 1
    return weekPlan?.meals.find((m) => m.dayOfWeek === dow && m.slot === 'DINNER') ?? null
  }

  return (
    <div className="p-4 space-y-4 bottom-nav-pad">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold">Bonjour, {user?.name} 👋</h1>
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: user?.color }}
        >
          {user?.name[0]}
        </span>
      </div>

      <DayCard
        date={today}
        events={eventsForDay(today)}
        dinner={dinnerForDay(today)}
      />
      <DayCard
        date={tomorrow}
        events={eventsForDay(tomorrow)}
        dinner={dinnerForDay(tomorrow)}
      />

      {criticalDays.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-3">
          <p className="text-sm text-red-300 font-medium">⚠️ Jours critiques à venir</p>
          <p className="text-xs text-white/50 mt-1">
            {criticalDays.slice(0, 3).join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}
