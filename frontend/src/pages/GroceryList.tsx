import { useEffect, useState } from 'react'
import { useStore, GroceryCategory, GroceryItem } from '../store'
import { api } from '../api/client'
import GroceryItemRow from '../components/GroceryItem'

const CATEGORY_LABELS: Record<GroceryCategory, string> = {
  PRODUCE: '🥦 Fruits & légumes',
  MEAT: '🥩 Viandes & poissons',
  DAIRY: '🧀 Produits laitiers',
  BAKERY: '🍞 Boulangerie',
  FROZEN: '🧊 Surgelés',
  PANTRY: '🥫 Épicerie sèche',
  OTHER: '📦 Autre',
}

const CATEGORY_ORDER: GroceryCategory[] = [
  'PRODUCE', 'MEAT', 'DAIRY', 'BAKERY', 'FROZEN', 'PANTRY', 'OTHER',
]

interface AddForm {
  name: string
  quantity: string
  category: GroceryCategory
}

export default function GroceryList() {
  const { groceryList, weekPlan, setGroceryList, addGroceryItem } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>({ name: '', quantity: '', category: 'PRODUCE' })

  useEffect(() => {
    async function load() {
      if (!weekPlan) return
      const list = await api.get<typeof groceryList>(`/weekplans/${weekPlan.id}/grocery`)
      if (list) setGroceryList(list)
    }
    load()
  }, [weekPlan, setGroceryList])

  const itemsByCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: (groceryList?.items ?? []).filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0)

  const uncheckedCount = groceryList?.items.filter((i) => !i.checked).length ?? 0

  async function addItem() {
    if (!form.name.trim() || !groceryList) return
    const item = await api.post<GroceryItem>('/grocery/items', {
      groceryListId: groceryList.id,
      name: form.name.trim(),
      quantity: form.quantity || undefined,
      category: form.category,
    })
    addGroceryItem(item)
    setForm({ name: '', quantity: '', category: 'PRODUCE' })
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Épicerie</h1>
          <p className="text-xs text-white/40 mt-0.5">
            {uncheckedCount} article{uncheckedCount !== 1 ? 's' : ''} restant{uncheckedCount !== 1 ? 's' : ''}
          </p>
        </div>
        {!navigator.onLine && (
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
            Hors ligne
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bottom-nav-pad px-2">
        {itemsByCategory.length === 0 ? (
          <div className="text-center text-white/40 mt-16">
            <p className="text-4xl mb-3">🛒</p>
            <p>Liste vide</p>
            <p className="text-xs mt-1">Génère la liste depuis les repas ou ajoute des articles</p>
          </div>
        ) : (
          itemsByCategory.map(({ category, items }) => (
            <div key={category} className="mt-4">
              <h3 className="text-xs font-semibold text-white/40 px-4 mb-1 uppercase tracking-wider">
                {CATEGORY_LABELS[category]}
              </h3>
              <div className="space-y-1">
                {items.map((item) => (
                  <GroceryItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full shadow-lg text-2xl z-40"
      >
        +
      </button>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowAdd(false)}>
          <div
            className="bg-surface w-full rounded-t-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold mb-4">Ajouter un article</h2>
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Nom de l'article"
                autoFocus
              />
              <input
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full bg-white/10 rounded-xl px-4 py-3 focus:outline-none"
                placeholder="Quantité (optionnel)"
              />
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as GroceryCategory }))}
                className="w-full bg-white/10 rounded-xl px-4 py-3 focus:outline-none"
              >
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
              <button
                onClick={addItem}
                className="w-full py-3 bg-primary rounded-xl font-semibold"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
