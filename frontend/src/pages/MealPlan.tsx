import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, Meal, Recipe, WeekPlan } from '../store'
import { api } from '../api/client'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const SLOTS: Array<{ key: 'LUNCH' | 'DINNER'; label: string }> = [
  { key: 'LUNCH', label: 'Déjeuner' },
  { key: 'DINNER', label: 'Souper' },
]

interface MealModal {
  dayOfWeek: number
  slot: 'LUNCH' | 'DINNER'
  current?: Meal | null
}

export default function MealPlan() {
  const { weekPlan, setWeekPlan, recipes, setRecipes } = useStore()
  const [modal, setModal] = useState<MealModal | null>(null)
  const [generating, setGenerating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const [plan, recs] = await Promise.all([
        api.get<WeekPlan>('/weekplans'),
        api.get<Recipe[]>('/recipes'),
      ])
      if (plan) setWeekPlan(plan)
      setRecipes(recs)
    }
    load()
  }, [setWeekPlan, setRecipes])

  function getMeal(day: number, slot: 'LUNCH' | 'DINNER') {
    return weekPlan?.meals.find((m) => m.dayOfWeek === day && m.slot === slot)
  }

  async function saveMeal(day: number, slot: 'LUNCH' | 'DINNER', recipeId?: string, label?: string) {
    if (!weekPlan) return
    const meals = DAYS.flatMap((_, i) =>
      SLOTS.map((s) => {
        const existing = getMeal(i, s.key)
        if (i === day && s.key === slot) {
          return { dayOfWeek: i, slot: s.key, recipeId: recipeId || undefined, customLabel: label || undefined }
        }
        return existing
          ? { dayOfWeek: existing.dayOfWeek, slot: existing.slot, recipeId: existing.recipeId ?? undefined, customLabel: existing.customLabel ?? undefined }
          : null
      })
    ).filter(Boolean)

    const updated = await api.put<WeekPlan>(`/weekplans/${weekPlan.id}/meals`, { meals })
    setWeekPlan(updated)
    setModal(null)
  }

  async function generateGrocery() {
    if (!weekPlan) return
    setGenerating(true)
    try {
      await api.post(`/weekplans/${weekPlan.id}/grocery/generate`, {})
      navigate('/grocery')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-bold">Repas de la semaine</h1>
      </div>

      <div className="flex-1 overflow-auto bottom-nav-pad p-2">
        <div className="grid grid-cols-8 gap-1 text-xs min-w-0">
          {/* Header row */}
          <div className="bg-transparent" />
          {DAYS.map((d) => (
            <div key={d} className="text-center text-white/50 py-2 font-medium">{d}</div>
          ))}

          {/* Meal rows */}
          {SLOTS.map((slot) => (
            <>
              <div key={slot.key} className="flex items-center justify-end pr-1 text-white/40 text-[10px]">
                {slot.label}
              </div>
              {DAYS.map((_, dayIdx) => {
                const meal = getMeal(dayIdx, slot.key)
                const label = meal?.recipe?.name ?? meal?.customLabel
                return (
                  <button
                    key={`${slot.key}-${dayIdx}`}
                    onClick={() => setModal({ dayOfWeek: dayIdx, slot: slot.key, current: meal })}
                    className={`rounded-lg p-1 text-center text-[10px] leading-tight min-h-12 transition-colors ${
                      label
                        ? 'bg-primary/20 text-white border border-primary/30'
                        : 'bg-surface/40 text-white/20 border border-white/5'
                    }`}
                  >
                    {label ? (
                      <span className="line-clamp-2">{label}</span>
                    ) : (
                      <span>+</span>
                    )}
                  </button>
                )
              })}
            </>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={generateGrocery}
          disabled={generating}
          className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold disabled:opacity-50 transition-colors"
        >
          {generating ? 'Génération…' : '🛒 Générer la liste d\'épicerie'}
        </button>
      </div>

      {modal && (
        <MealModal
          modal={modal}
          recipes={recipes}
          onClose={() => setModal(null)}
          onSave={saveMeal}
        />
      )}
    </div>
  )
}

function MealModal({
  modal,
  recipes,
  onClose,
  onSave,
}: {
  modal: MealModal
  recipes: Recipe[]
  onClose: () => void
  onSave: (day: number, slot: 'LUNCH' | 'DINNER', recipeId?: string, label?: string) => void
}) {
  const [tab, setTab] = useState<'recipe' | 'custom'>('recipe')
  const [selected, setSelected] = useState(modal.current?.recipeId ?? '')
  const [label, setLabel] = useState(modal.current?.customLabel ?? '')

  function submit() {
    if (tab === 'recipe' && selected) {
      onSave(modal.dayOfWeek, modal.slot, selected)
    } else if (tab === 'custom' && label.trim()) {
      onSave(modal.dayOfWeek, modal.slot, undefined, label.trim())
    }
  }

  function clear() {
    onSave(modal.dayOfWeek, modal.slot, undefined, undefined)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-surface w-full rounded-t-2xl p-5 max-h-[75vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">
            {DAYS[modal.dayOfWeek]} — {modal.slot === 'LUNCH' ? 'Déjeuner' : 'Souper'}
          </h2>
          <button onClick={onClose} className="text-white/50 text-2xl">×</button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('recipe')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'recipe' ? 'bg-primary text-white' : 'bg-white/10'}`}
          >
            📖 Recette
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'custom' ? 'bg-primary text-white' : 'bg-white/10'}`}
          >
            ✏️ Libre
          </button>
        </div>

        {tab === 'recipe' ? (
          <div className="flex-1 overflow-y-auto space-y-2">
            {recipes.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`w-full text-left p-3 rounded-xl transition-colors ${
                  selected === r.id ? 'bg-primary/20 border border-primary/50' : 'bg-white/5'
                }`}
              >
                <div className="font-medium">{r.name}</div>
                {r.description && (
                  <div className="text-xs text-white/50 mt-0.5">{r.description}</div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="bg-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Ex: Salade, Pizza maison…"
            autoFocus
          />
        )}

        <div className="flex gap-2 mt-4">
          {modal.current && (
            <button onClick={clear} className="py-3 px-4 rounded-xl border border-white/20 text-white/60 text-sm">
              Vider
            </button>
          )}
          <button
            onClick={submit}
            className="flex-1 py-3 bg-primary rounded-xl font-semibold"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}
