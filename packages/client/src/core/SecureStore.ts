/**
 * SecureStore — AES-256-GCM encrypted client-side storage for NeevJS.
 *
 * ## Security model
 * - Data is encrypted with AES-256-GCM before being written to localStorage.
 * - The encryption key is generated fresh every session and lives ONLY in memory.
 * - On page refresh the key is gone, so the encrypted ciphertext in localStorage
 *   is permanently unreadable — it is automatically discarded.
 * - This means SecureStore does NOT persist across page refreshes by design.
 *   If you need truly sensitive data to survive refreshes, store it on the server.
 *
 * ## Threat model
 * ✅ Protects against: physical access to device / localStorage dump
 * ✅ Protects against: another browser tab/window reading the storage
 * ❌ Does NOT protect against: XSS (attacker JS runs in your origin and can
 *    call SecureStore.get() directly — same as any in-memory value)
 *
 * ## When to use
 * - Temporary sensitive values during a session (payment amount, masked card, OTP state)
 * - Values that must not appear in plaintext in DevTools Application → Storage
 *
 * ## API
 * ```ts
 * await SecureStore.set('pending_payment', { amount: 4999, currency: 'INR' })
 * const payment = await SecureStore.get<Payment>('pending_payment')
 * SecureStore.remove('pending_payment')
 * SecureStore.clear()  // remove all SecureStore entries
 * ```
 */

const SECURE_PREFIX = 'neev_secure_'

// ─── Session-bound encryption key ─────────────────────────────────────────────
// Generated once per page load. Never serialized. Gone on refresh.
let _encryptionKey: CryptoKey | null = null

async function getEncryptionKey(): Promise<CryptoKey> {
  if (_encryptionKey) return _encryptionKey

  if (!window.crypto?.subtle) {
    throw new Error(
      '[NeevJS] SecureStore requires Web Crypto API (available in HTTPS or localhost contexts only).'
    )
  }

  _encryptionKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable — the raw key bytes can NEVER be exported
    ['encrypt', 'decrypt'],
  )

  return _encryptionKey
}

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────
async function encrypt(data: unknown): Promise<string> {
  const key = await getEncryptionKey()
  const iv = window.crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for AES-GCM
  const encoded = new TextEncoder().encode(JSON.stringify(data))

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  )

  // Combine IV + ciphertext into a single base64 string
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)

  return btoa(String.fromCharCode(...combined))
}

async function decrypt<T>(encoded: string): Promise<T> {
  const key = await getEncryptionKey()
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))

  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )

  return JSON.parse(new TextDecoder().decode(decrypted)) as T
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const SecureStore = {
  /**
   * Encrypt and store a value in localStorage.
   * The value cannot be read without the in-memory session key.
   */
  async set<T>(key: string, value: T): Promise<void> {
    const ciphertext = await encrypt(value)
    localStorage.setItem(SECURE_PREFIX + key, ciphertext)
  },

  /**
   * Retrieve and decrypt a value.
   * Returns null if the key doesn't exist or cannot be decrypted
   * (e.g. after a page refresh when the key is gone).
   */
  async get<T>(key: string): Promise<T | null> {
    const stored = localStorage.getItem(SECURE_PREFIX + key)
    if (!stored) return null

    try {
      return await decrypt<T>(stored)
    } catch {
      // Decryption failed (key mismatch after refresh) — clean up stale ciphertext
      localStorage.removeItem(SECURE_PREFIX + key)
      return null
    }
  },

  /**
   * Remove a specific key from SecureStore.
   */
  remove(key: string): void {
    localStorage.removeItem(SECURE_PREFIX + key)
  },

  /**
   * Remove ALL SecureStore entries from localStorage.
   * Call this on logout to clean up all session-bound encrypted data.
   */
  clear(): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(SECURE_PREFIX)) keysToRemove.push(k)
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  },
}
