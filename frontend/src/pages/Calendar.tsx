import { useState, useRef } from 'react'
import { format, addWeeks, subWeeks, startOfWeek, addDays, isToday, isSameMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useStore, Event } from '../store'
import { api } from '../api/client'
import EventForm from './EventForm'

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const typeIcon: Record<string, string> = {
  COURSE: '📚',
  LATE_RETURN: '🌙',
  OUTING: '🎉',
  CHILDCARE: '👶',
  OTHER: '📌',
}

export default function Calendar() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState<Event | null>(null)
  const { weekEvents, setWeekEvents } = useStore()
  const touchStart = useRef<number | null>(null)

  const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const monday = weekOffset >= 0
    ? addWeeks(baseMonday, weekOffset)
    : subWeeks(baseMonday, -weekOffset)

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const sunday = days[6]

  async function loadWeek(offset: number) {
    const targetMonday = offset >= 0
      ? addWeeks(baseMonday, offset)
      : subWeeks(baseMonday, -offset)
    const events = await api.get<Event[]>(`/events/week?date=${targetMonday.toISOString()}`)
    setWeekEvents(events)
    setWeekOffset(offset)
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    if (Math.abs(dx) > 60) loadWeek(dx < 0 ? weekOffset + 1 : weekOffset - 1)
    touchStart.current = null
  }

  function eventsForDay(date: Date) {
    const iso = date.toISOString().slice(0, 10)
    return weekEvents.filter((e) => e.startTime.slice(0, 10) === iso)
  }

  async function handleDelete(id: string) {
    await api.delete(`/events/${id}`)
    setWeekEvents(weekEvents.filter((e) => e.id !== id))
  }

  const monthLabel = isSameMonth(monday, sunday)
    ? format(monday, 'MMMM yyyy', { locale: fr })
    : `${format(monday, 'MMM', { locale: fr })} – ${format(sunday, 'MMM yyyy', { locale: fr })}`

  const weekLabel = `${format(monday, 'd')} – ${format(sunday, 'd MMM', { locale: fr })}`

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={() => loadWeek(weekOffset - 1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-lg"
          >
            ‹
          </button>
          <div className="text-center">
            <div className="font-bold capitalize text-base">{monthLabel}</div>
            <div className="text-xs text-white/40">{weekLabel}</div>
          </div>
          <button
            onClick={() => loadWeek(weekOffset + 1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-lg"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mt-3">
          {DAYS_SHORT.map((d, i) => {
            const today = isToday(days[i])
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <span className={`text-[11px] font-medium ${today ? 'text-primary' : 'text-white/40'}`}>
                  {d}
                </span>
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  today
                    ? 'bg-primary text-white'
                    : 'text-white/80'
                }`}>
                  {format(days[i], 'd')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Events grid */}
      <div
        className="flex-1 overflow-y-auto bottom-nav-pad"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="grid grid-cols-7 gap-px bg-white/5 h-full">
          {days.map((day) => {
            const dayEvents = eventsForDay(day)
            const today = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={`min-h-32 p-1 ${today ? 'bg-primary/5' : 'bg-base'}`}
              >
                {dayEvents.length === 0 && (
                  <div className="h-full flex items-start justify-center pt-3">
                    <span className="text-white/10 text-lg">·</span>
                  </div>
                )}
                {dayEvents.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => { setEditEvent(e); setShowForm(true) }}
                    className="w-full text-left mb-1 rounded-lg px-1.5 py-1.5 text-xs leading-tight transition-opacity hover:opacity-80"
                    style={{ backgroundColor: e.owner.color + '30', borderLeft: `2px solid ${e.owner.color}` }}
                  >
                    <div className="font-semibold truncate text-white/90">
                      {typeIcon[e.type]} {e.title}
                    </div>
                    <div className="text-[10px] text-white/50 mt-0.5">
                      {format(new Date(e.startTime), 'HH:mm')}
                    </div>
                    {e.isCritical && (
                      <div className="text-red-300 text-[10px] mt-0.5">⚠️ Critique</div>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditEvent(null); setShowForm(true) }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full shadow-lg text-2xl z-40 flex items-center justify-center"
      >
        +
      </button>

      {showForm && (
        <EventForm
          event={editEvent}
          onClose={() => setShowForm(false)}
          onDelete={editEvent ? () => { handleDelete(editEvent.id); setShowForm(false) } : undefined}
          onSave={async (data) => {
            if (editEvent) {
              const updated = await api.put<Event>(`/events/${editEvent.id}`, data)
              setWeekEvents(weekEvents.map((e) => e.id === updated.id ? updated : e))
            } else {
              const created = await api.post<Event>('/events', data)
              setWeekEvents([...weekEvents, created])
            }
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}
