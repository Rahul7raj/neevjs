import type { NeevClientInterface, NeevPlugin, NeevRequest, QueuedAction } from '@neevjs/shared'
import { syncState } from '../hooks/useSyncStatus'
import { mutateModel } from '../hooks/useModel'

const QUEUE_STORAGE_KEY = 'neev_offline_queue'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QueuedAction[]) : []
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedAction[]): void {
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  syncState.pendingCount = queue.length
  syncState.notify()
}

export function createOfflinePlugin(): NeevPlugin {
  let client: NeevClientInterface

  async function processQueue(): Promise<void> {
    if (!navigator.onLine) return
    const queue = loadQueue()
    if (queue.length === 0) return

    const remaining: QueuedAction[] = []
    let hasChanges = false
    const urlsToMutate = new Set<string>()

    for (const action of queue) {
      try {
        await client.request(action.url, action.options)
        hasChanges = true
        // Extract base model URL (e.g. "/users/123" -> "/users")
        const baseUrl = '/' + (action.url.split('/')[1] || '')
        urlsToMutate.add(baseUrl)
      } catch (err: any) {
        if (err.status && err.status >= 400 && err.status < 500) {
          // Terminal validation or client error (4xx). Discard action.
          syncState.errors.push(new Error(`Offline action on ${action.url} failed: ${err.message}`))
          hasChanges = true
          const baseUrl = '/' + (action.url.split('/')[1] || '')
          urlsToMutate.add(baseUrl)
        } else {
          // 5xx or network error, retry next time
          remaining.push({ ...action, retries: action.retries + 1 })
        }
      }
    }

    saveQueue(remaining)
    if (hasChanges) {
      urlsToMutate.forEach(url => mutateModel(url))
    }
  }

  window.addEventListener('online', () => {
    void processQueue()
  })

  return {
    name: 'offline',

    setup(c: NeevClientInterface): void {
      client = c
      if (navigator.onLine && loadQueue().length > 0) {
        setTimeout(() => void processQueue(), 500)
      }
    },

    onRequest(req: NeevRequest): NeevRequest {
      const method = (req.options.method ?? 'GET').toUpperCase()
      const isMutation = method !== 'GET'

      if (!navigator.onLine && isMutation) {
        // Queue the action for later
        const queue = loadQueue()
        const action: QueuedAction = {
          id: generateId(),
          url: req.url,
          options: req.options,
          timestamp: Date.now(),
          retries: 0,
        }
        queue.push(action)
        saveQueue(queue)

        // Throw a special offline error so useModel knows to handle it
        throw new Error('[NeevJS] Offline — action queued for sync when back online.')
      }

      return req
    },
  }
}

export const OfflinePlugin = createOfflinePlugin()
