import { useState, useRef } from 'react'
import { format, addWeeks, subWeeks, startOfWeek, addDays, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useStore, Event } from '../store'
import { api } from '../api/client'
import EventForm from './EventForm'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

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
    if (Math.abs(dx) > 60) {
      loadWeek(dx < 0 ? weekOffset + 1 : weekOffset - 1)
    }
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-base border-b border-white/10">
        <button onClick={() => loadWeek(weekOffset - 1)} className="text-xl px-2">‹</button>
        <span className="font-semibold capitalize">
          {format(monday, 'MMMM yyyy', { locale: fr })}
        </span>
        <button onClick={() => loadWeek(weekOffset + 1)} className="text-xl px-2">›</button>
      </div>

      {/* Week grid */}
      <div
        className="flex-1 overflow-y-auto bottom-nav-pad"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="grid grid-cols-7 gap-px bg-white/5 sticky top-0 z-10">
          {DAYS.map((d, i) => (
            <div key={d} className={`bg-base text-center py-2 text-xs font-medium ${isToday(days[i]) ? 'text-primary' : 'text-white/50'}`}>
              <div>{d}</div>
              <div className={`text-base font-bold ${isToday(days[i]) ? 'text-primary' : ''}`}>
                {format(days[i], 'd')}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px">
          {days.map((day) => {
            const dayEvents = eventsForDay(day)
            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 p-1 ${isToday(day) ? 'bg-primary/5' : 'bg-base'}`}
              >
                {dayEvents.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => { setEditEvent(e); setShowForm(true) }}
                    className="w-full text-left mb-1 rounded px-1.5 py-1 text-xs leading-tight"
                    style={{ backgroundColor: e.owner.color + '33', borderLeft: `2px solid ${e.owner.color}` }}
                  >
                    <div className="font-medium truncate">
                      {typeIcon[e.type]} {e.title}
                    </div>
                    {e.isCritical && <div className="text-red-300 text-[10px]">⚠️ Critique</div>}
                    {e.helper && (
                      <div className="text-[10px]" style={{ color: e.helper.color }}>
                        🤝 {e.helper.name}
                      </div>
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
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full shadow-lg text-2xl z-40"
        style={{ paddingBottom: 0 }}
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
