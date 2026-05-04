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

  // ─── Fix 5: Track the registered listener so we can remove it ─────────────
  // Previously, every call to createOfflinePlugin() registered a new
  // window.addEventListener('online', ...) that was never removed, causing
  // the listener to accumulate on hot-reload or multiple instantiations.
  let onlineHandler: (() => void) | null = null

  async function processQueue(): Promise<void> {
    if (!navigator.onLine) return
    const queue = loadQueue()
    if (queue.length === 0) return

    // ─── Fix 4: Signal that syncing has started ────────────────────────────
    syncState.syncing = true
    syncState.notify()

    const remaining: QueuedAction[] = []
    let hasChanges = false
    const urlsToMutate = new Set<string>()

    for (const action of queue) {
      try {
        await client.request(action.url, action.options)
        hasChanges = true
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
          // 5xx or network error — retry next time
          remaining.push({ ...action, retries: action.retries + 1 })
        }
      }
    }

    saveQueue(remaining)

    // ─── Fix 4: Signal that syncing is done ───────────────────────────────
    // Only mark as done after the queue is fully processed — not on a
    // hardcoded timeout. This is accurate regardless of queue size.
    syncState.syncing = false
    syncState.notify()

    if (hasChanges) {
      urlsToMutate.forEach(url => mutateModel(url))
    }
  }

  return {
    name: 'offline',

    setup(c: NeevClientInterface): void {
      client = c

      // ─── Fix 5: Register a single, replaceable listener ─────────────────
      // Remove any previously registered listener before adding a new one.
      // This prevents accumulation on hot-reload or multiple client.use() calls.
      if (onlineHandler) {
        window.removeEventListener('online', onlineHandler)
      }
      onlineHandler = () => { void processQueue() }
      window.addEventListener('online', onlineHandler)

      // Process any queued actions from previous sessions on startup
      if (navigator.onLine && loadQueue().length > 0) {
        setTimeout(() => void processQueue(), 500)
      }
    },

    onRequest(req: NeevRequest): NeevRequest {
      const method = (req.options.method ?? 'GET').toUpperCase()
      const isMutation = method !== 'GET'

      if (!navigator.onLine && isMutation) {
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

        throw new Error('[NeevJS] Offline — action queued for sync when back online.')
      }

      return req
    },
  }
}

export const OfflinePlugin = createOfflinePlugin()
