import React from 'react'
import { useStore, clearPersistedStore } from '@neevjs/client'

/**
 * StoreTestPage — a dedicated page in the demo app used exclusively by
 * Playwright tests to verify useStore (in-memory, session, persist, TTL)
 * and the Form field-level validation API.
 *
 * Not linked in the main nav — accessed directly via /store-test route
 * using the hash-based navigation workaround (query param ?page=store-test).
 */
export function StoreTestPage(): React.ReactElement {
  // In-memory store
  const [counter, setCounter] = useStore<number>('test-counter', 0)

  // Persist store (localStorage)
  const [theme, setTheme] = useStore<string>('test-theme', 'light', { persist: true })

  // Session store
  const [sessionVal, setSessionVal] = useStore<string>('test-session', '', { session: true })

  // TTL store — expires in 2 seconds for testing
  const [ttlVal, setTtlVal] = useStore<string>('test-ttl', 'fresh', {
    persist: true,
    ttl: 2000,
  })

  function resetAll() {
    setCounter(0)
    clearPersistedStore('test-theme')
    clearPersistedStore('test-ttl')
  }

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif', maxWidth: 600 }}>
      <h1 id="store-test-title" style={{ marginBottom: 24 }}>useStore Test Page</h1>

      {/* In-memory counter */}
      <section style={{ marginBottom: 32, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h2>In-Memory Store</h2>
        <p>Counter: <span id="counter-value">{counter}</span></p>
        <button id="increment-btn" onClick={() => setCounter(c => c + 1)}>Increment</button>
        &nbsp;
        <button id="reset-btn" onClick={() => setCounter(0)}>Reset</button>
      </section>

      {/* Persist store */}
      <section style={{ marginBottom: 32, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h2>Persist Store (localStorage)</h2>
        <p>Theme: <span id="theme-value">{theme}</span></p>
        <button id="set-dark-btn" onClick={() => setTheme('dark')}>Set Dark</button>
        &nbsp;
        <button id="set-light-btn" onClick={() => setTheme('light')}>Set Light</button>
        &nbsp;
        <button id="clear-theme-btn" onClick={() => { clearPersistedStore('test-theme'); setTheme('light') }}>Clear</button>
      </section>

      {/* Session store */}
      <section style={{ marginBottom: 32, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h2>Session Store (sessionStorage)</h2>
        <p>Value: <span id="session-value">{sessionVal || '(empty)'}</span></p>
        <input
          id="session-input"
          type="text"
          placeholder="Type something..."
          value={sessionVal}
          onChange={(e) => setSessionVal(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, marginRight: 8 }}
        />
        <button id="set-session-btn" onClick={() => setSessionVal('session-test-value')}>Set Test Value</button>
      </section>

      {/* TTL store */}
      <section style={{ marginBottom: 32, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h2>TTL Store (expires in 2s)</h2>
        <p>TTL value: <span id="ttl-value">{ttlVal}</span></p>
        <button id="set-ttl-btn" onClick={() => setTtlVal('set-at-' + Date.now())}>Set TTL Value</button>
      </section>

      <button id="reset-all-btn" onClick={resetAll} style={{ background: '#ef4444', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Reset All
      </button>
    </div>
  )
}
