import { useNavigate } from 'react-router-dom'
import { format, isToday, isTomorrow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Event, Meal } from '../store'
import CriticalDayBadge from './CriticalDayBadge'

interface Props {
  date: Date
  events: Event[]
  dinner?: Meal | null
}

const typeIcon: Record<string, string> = {
  COURSE: '📚',
  LATE_RETURN: '🌙',
  OUTING: '🎉',
  CHILDCARE: '👶',
  OTHER: '📌',
}

export default function DayCard({ date, events, dinner }: Props) {
  const navigate = useNavigate()
  const isCritical = events.some((e) => e.isCritical)

  const label = isToday(date)
    ? "Aujourd'hui"
    : isTomorrow(date)
    ? 'Demain'
    : format(date, 'EEEE d MMMM', { locale: fr })

  return (
    <div
      className={`rounded-2xl p-4 cursor-pointer transition-transform active:scale-[0.98] ${
        isCritical ? 'bg-red-900/30 border border-red-500/30' : 'bg-surface border border-white/10'
      }`}
      onClick={() => navigate(`/calendar?date=${date.toISOString().slice(0, 10)}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold capitalize">{label}</h2>
        {isCritical && <CriticalDayBadge />}
        {!isCritical && (
          <span className="text-xs text-green-400">✅ Journée normale</span>
        )}
      </div>

      <div className="space-y-1.5">
        {events.map((e) => (
          <div key={e.id} className="flex items-start gap-2 text-sm">
            <span>{typeIcon[e.type] ?? '📌'}</span>
            <div>
              <span style={{ color: e.owner.color }} className="font-medium">
                {e.owner.name}
              </span>
              {' — '}
              {e.title}
              {e.helperNote && (
                <div className="text-white/60 text-xs mt-0.5">🤝 {e.helperNote}</div>
              )}
              {e.helper && (
                <div className="text-white/60 text-xs mt-0.5">
                  🤝{' '}
                  <span style={{ color: e.helper.color }}>{e.helper.name}</span> aide
                </div>
              )}
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <p className="text-sm text-white/40">Aucun événement</p>
        )}

        {dinner && (
          <div className="flex items-center gap-2 text-sm pt-1 border-t border-white/10 mt-2">
            <span>🍽️</span>
            <span className="text-white/70">
              Souper :{' '}
              <span className="text-white">{dinner.recipe?.name ?? dinner.customLabel ?? '—'}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
