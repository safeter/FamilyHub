import { NavLink } from 'react-router-dom'
import { useStore } from '../store'

const tabs = [
  { to: '/',         icon: '🏠', label: 'Accueil' },
  { to: '/calendar', icon: '📅', label: 'Semaine' },
  { to: '/meals',    icon: '🍽️', label: 'Repas'   },
  { to: '/grocery',  icon: '🛒', label: 'Épicerie' },
  { to: '/recipes',  icon: '📖', label: 'Recettes' },
]

export default function BottomNav() {
  const criticalDays = useStore((s) => s.criticalDays)
  const today = new Date().toISOString().slice(0, 10)
  const hasCriticalSoon = criticalDays.some((d) => d >= today)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 flex z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
              isActive ? 'text-primary' : 'text-white/50 hover:text-white/80'
            }`
          }
        >
          <span className="text-xl relative">
            {tab.icon}
            {tab.to === '/' && hasCriticalSoon && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
