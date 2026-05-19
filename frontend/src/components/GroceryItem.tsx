import { GroceryItem as Item } from '../store'
import { api } from '../api/client'
import { useStore } from '../store'
import { enqueueOfflineAction } from '../hooks/useOfflineCache'

interface Props {
  item: Item
}

export default function GroceryItemRow({ item }: Props) {
  const updateGroceryItem = useStore((s) => s.updateGroceryItem)

  async function toggle() {
    const next = !item.checked
    updateGroceryItem(item.id, next)

    if (navigator.onLine) {
      try {
        await api.patch(`/grocery/items/${item.id}/check`, { checked: next })
      } catch {
        updateGroceryItem(item.id, !next)
      }
    } else {
      enqueueOfflineAction({
        path: `/grocery/items/${item.id}/check`,
        method: 'PATCH',
        body: { checked: next },
      })
    }
  }

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-colors text-left ${
        item.checked ? 'opacity-50' : 'bg-surface/60 hover:bg-surface'
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          item.checked ? 'bg-primary border-primary' : 'border-white/30'
        }`}
      >
        {item.checked && <span className="text-white text-xs">✓</span>}
      </span>
      <div className="flex-1 min-w-0">
        <span className={`block font-medium ${item.checked ? 'grocery-checked' : ''}`}>
          {item.name}
        </span>
        {item.quantity && (
          <span className="text-xs text-white/50">{item.quantity}</span>
        )}
      </div>
    </button>
  )
}
