import { useEffect, useState } from 'react'
import { useStore, Recipe, GroceryCategory } from '../store'
import { api } from '../api/client'

const CATEGORIES: GroceryCategory[] = [
  'PRODUCE', 'MEAT', 'DAIRY', 'BAKERY', 'FROZEN', 'PANTRY', 'OTHER',
]

const CAT_LABELS: Record<GroceryCategory, string> = {
  PRODUCE: 'Fruits & légumes',
  MEAT: 'Viandes & poissons',
  DAIRY: 'Produits laitiers',
  BAKERY: 'Boulangerie',
  FROZEN: 'Surgelés',
  PANTRY: 'Épicerie sèche',
  OTHER: 'Autre',
}

interface IngredientForm {
  name: string
  quantity: string
  category: GroceryCategory
}

interface RecipeForm {
  name: string
  description: string
  ingredients: IngredientForm[]
}

const emptyForm = (): RecipeForm => ({
  name: '',
  description: '',
  ingredients: [{ name: '', quantity: '', category: 'PANTRY' }],
})

export default function Recipes() {
  const { recipes, setRecipes } = useStore()
  const [editing, setEditing] = useState<Recipe | null | 'new'>(null)
  const [form, setForm] = useState<RecipeForm>(emptyForm())

  useEffect(() => {
    api.get<Recipe[]>('/recipes').then(setRecipes)
  }, [setRecipes])

  function openNew() {
    setForm(emptyForm())
    setEditing('new')
  }

  function openEdit(r: Recipe) {
    setForm({
      name: r.name,
      description: r.description ?? '',
      ingredients: r.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        category: i.category,
      })),
    })
    setEditing(r)
  }

  async function save() {
    if (editing === 'new') {
      const created = await api.post<Recipe>('/recipes', form)
      setRecipes([...recipes, created])
    } else if (editing) {
      const updated = await api.put<Recipe>(`/recipes/${editing.id}`, form)
      setRecipes(recipes.map((r) => (r.id === updated.id ? updated : r)))
    }
    setEditing(null)
  }

  async function remove(id: string) {
    await api.delete(`/recipes/${id}`)
    setRecipes(recipes.filter((r) => r.id !== id))
    setEditing(null)
  }

  function addIngredient() {
    setForm((f) => ({
      ...f,
      ingredients: [...f.ingredients, { name: '', quantity: '', category: 'PANTRY' }],
    }))
  }

  function updateIngredient(i: number, k: keyof IngredientForm, v: string) {
    setForm((f) => {
      const ings = [...f.ingredients]
      ings[i] = { ...ings[i], [k]: v }
      return { ...f, ingredients: ings }
    })
  }

  function removeIngredient(i: number) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-xl font-bold">Recettes</h1>
        <button
          onClick={openNew}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Nouvelle
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bottom-nav-pad p-4 space-y-3">
        {recipes.length === 0 && (
          <div className="text-center text-white/40 mt-16">
            <p className="text-4xl mb-3">📖</p>
            <p>Aucune recette</p>
          </div>
        )}
        {recipes.map((r) => (
          <button
            key={r.id}
            onClick={() => openEdit(r)}
            className="w-full text-left bg-surface rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="font-semibold">{r.name}</div>
            {r.description && (
              <div className="text-xs text-white/50 mt-0.5">{r.description}</div>
            )}
            <div className="text-xs text-white/30 mt-2">
              {r.ingredients.length} ingrédient{r.ingredients.length !== 1 ? 's' : ''}
            </div>
          </button>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setEditing(null)}>
          <div
            className="bg-surface w-full rounded-t-2xl p-5 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">{editing === 'new' ? 'Nouvelle recette' : 'Modifier'}</h2>
              <button onClick={() => setEditing(null)} className="text-white/50 text-2xl">×</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Nom de la recette"
              />
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-white/10 rounded-xl px-4 py-3 focus:outline-none"
                placeholder="Description (optionnel)"
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white/70">Ingrédients</span>
                  <button onClick={addIngredient} className="text-primary text-sm">+ Ajouter</button>
                </div>
                {form.ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={ing.name}
                      onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                      className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      placeholder="Ingrédient"
                    />
                    <input
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                      className="w-20 bg-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      placeholder="Qté"
                    />
                    <select
                      value={ing.category}
                      onChange={(e) => updateIngredient(i, 'category', e.target.value)}
                      className="bg-white/10 rounded-xl px-2 py-2 text-xs focus:outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{CAT_LABELS[c]}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeIngredient(i)}
                      className="text-red-400 px-2 min-h-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              {editing !== 'new' && (
                <button
                  onClick={() => remove((editing as Recipe).id)}
                  className="py-3 px-4 rounded-xl border border-red-500/40 text-red-400 text-sm"
                >
                  Supprimer
                </button>
              )}
              <button
                onClick={save}
                disabled={!form.name.trim()}
                className="flex-1 py-3 bg-primary rounded-xl font-semibold disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
