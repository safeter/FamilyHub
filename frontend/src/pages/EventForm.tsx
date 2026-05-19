import { useState } from 'react'
import { Event } from '../store'

interface FormData {
  title: string
  type: string
  startTime: string
  endTime: string
  isCritical: boolean
  helperNote: string
  helperId: string
}

interface Props {
  event?: Event | null
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
  onDelete?: () => void
}

const types = [
  { value: 'COURSE',      label: '📚 Cours' },
  { value: 'LATE_RETURN', label: '🌙 Rentrée tardive' },
  { value: 'OUTING',      label: '🎉 Sortie' },
  { value: 'CHILDCARE',   label: '👶 Garde' },
  { value: 'OTHER',       label: '📌 Autre' },
]

function toInput(iso?: string) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export default function EventForm({ event, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<FormData>({
    title: event?.title ?? '',
    type: event?.type ?? 'OTHER',
    startTime: toInput(event?.startTime),
    endTime: toInput(event?.endTime),
    isCritical: event?.isCritical ?? false,
    helperNote: event?.helperNote ?? '',
    helperId: event?.helperId ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-surface w-full rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{event ? 'Modifier' : 'Nouvel événement'}</h2>
          <button onClick={onClose} className="text-white/50 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 block mb-1">Titre</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="w-full bg-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              className="w-full bg-white/10 rounded-xl px-4 py-3 focus:outline-none"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Début</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                className="w-full bg-white/10 rounded-xl px-3 py-3 focus:outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Fin</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => set('endTime', e.target.value)}
                className="w-full bg-white/10 rounded-xl px-3 py-3 focus:outline-none text-sm"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isCritical}
              onChange={(e) => set('isCritical', e.target.checked)}
              className="w-5 h-5 rounded accent-red-500"
            />
            <span className="text-sm">⚠️ Jour critique</span>
          </label>

          <div>
            <label className="text-xs text-white/50 block mb-1">Note d'aide (ex: Maman arrive à 16h)</label>
            <input
              value={form.helperNote}
              onChange={(e) => set('helperNote', e.target.value)}
              className="w-full bg-white/10 rounded-xl px-4 py-3 focus:outline-none"
              placeholder="Optionnel"
            />
          </div>

          <div className="flex gap-3 pt-2">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex-1 py-3 rounded-xl border border-red-500/40 text-red-400 font-medium"
              >
                Supprimer
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
