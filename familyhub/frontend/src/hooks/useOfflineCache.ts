import { useEffect, useRef } from 'react'
import { api } from '../api/client'

interface QueuedAction {
  id: string
  path: string
  method: 'PATCH' | 'POST' | 'DELETE'
  body?: unknown
}

const QUEUE_KEY = 'fh_offline_queue'

function loadQueue(): QueuedAction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedAction[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueueOfflineAction(action: Omit<QueuedAction, 'id'>) {
  const queue = loadQueue()
  queue.push({ ...action, id: crypto.randomUUID() })
  saveQueue(queue)
}

export function useOfflineCache() {
  const flushing = useRef(false)

  useEffect(() => {
    async function flush() {
      if (flushing.current || !navigator.onLine) return
      const queue = loadQueue()
      if (queue.length === 0) return

      flushing.current = true
      const remaining: QueuedAction[] = []

      for (const action of queue) {
        try {
          if (action.method === 'PATCH') await api.patch(action.path, action.body)
          else if (action.method === 'POST') await api.post(action.path, action.body)
          else if (action.method === 'DELETE') await api.delete(action.path)
        } catch {
          remaining.push(action)
        }
      }

      saveQueue(remaining)
      flushing.current = false
    }

    window.addEventListener('online', flush)
    flush()

    return () => window.removeEventListener('online', flush)
  }, [])
}
