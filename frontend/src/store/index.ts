import { create } from 'zustand'

export interface User {
  id: string
  name: string
  email: string
  color: string
}

export interface Event {
  id: string
  title: string
  type: 'COURSE' | 'LATE_RETURN' | 'OUTING' | 'CHILDCARE' | 'OTHER'
  startTime: string
  endTime: string
  isCritical: boolean
  helperNote?: string
  ownerId: string
  owner: { id: string; name: string; color: string }
  helper?: { id: string; name: string; color: string } | null
  helperId?: string | null
}

export interface Ingredient {
  id: string
  name: string
  quantity: string
  category: GroceryCategory
}

export interface Recipe {
  id: string
  name: string
  description?: string
  ingredients: Ingredient[]
}

export interface Meal {
  id: string
  dayOfWeek: number
  slot: 'LUNCH' | 'DINNER'
  customLabel?: string
  recipeId?: string
  recipe?: Recipe | null
}

export interface WeekPlan {
  id: string
  weekStart: string
  meals: Meal[]
}

export type GroceryCategory =
  | 'PRODUCE' | 'MEAT' | 'DAIRY' | 'BAKERY' | 'FROZEN' | 'PANTRY' | 'OTHER'

export interface GroceryItem {
  id: string
  name: string
  quantity?: string
  category: GroceryCategory
  checked: boolean
  addedManually: boolean
  groceryListId: string
}

export interface GroceryList {
  id: string
  weekPlanId: string
  items: GroceryItem[]
}

interface AppState {
  user: User | null
  token: string | null
  weekEvents: Event[]
  weekPlan: WeekPlan | null
  groceryList: GroceryList | null
  recipes: Recipe[]
  criticalDays: string[]

  setAuth: (user: User, token: string) => void
  logout: () => void
  setWeekEvents: (events: Event[]) => void
  setWeekPlan: (plan: WeekPlan) => void
  setGroceryList: (list: GroceryList) => void
  setRecipes: (recipes: Recipe[]) => void
  setCriticalDays: (days: string[]) => void
  updateGroceryItem: (itemId: string, checked: boolean) => void
  addGroceryItem: (item: GroceryItem) => void
  upsertEvent: (event: Event) => void
  removeEvent: (id: string) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem('fh_token'),
  weekEvents: [],
  weekPlan: null,
  groceryList: null,
  recipes: [],
  criticalDays: [],

  setAuth: (user, token) => {
    localStorage.setItem('fh_token', token)
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('fh_token')
    set({ user: null, token: null })
  },

  setWeekEvents: (events) => set({ weekEvents: events }),
  setWeekPlan: (plan) => set({ weekPlan: plan }),
  setGroceryList: (list) => set({ groceryList: list }),
  setRecipes: (recipes) => set({ recipes }),
  setCriticalDays: (days) => set({ criticalDays: days }),

  updateGroceryItem: (itemId, checked) =>
    set((s) => ({
      groceryList: s.groceryList
        ? {
            ...s.groceryList,
            items: s.groceryList.items
              .map((i) => (i.id === itemId ? { ...i, checked } : i))
              .sort((a, b) => Number(a.checked) - Number(b.checked)),
          }
        : null,
    })),

  addGroceryItem: (item) =>
    set((s) => ({
      groceryList: s.groceryList
        ? { ...s.groceryList, items: [...s.groceryList.items, item] }
        : null,
    })),

  upsertEvent: (event) =>
    set((s) => {
      const idx = s.weekEvents.findIndex((e) => e.id === event.id)
      const events =
        idx >= 0
          ? s.weekEvents.map((e) => (e.id === event.id ? event : e))
          : [...s.weekEvents, event]
      return { weekEvents: events.sort((a, b) => a.startTime.localeCompare(b.startTime)) }
    }),

  removeEvent: (id) =>
    set((s) => ({ weekEvents: s.weekEvents.filter((e) => e.id !== id) })),
}))
