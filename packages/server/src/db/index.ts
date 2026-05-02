import type { ModelRecord } from '@neevjs/shared'

// Simple in-memory store — replace with PostgreSQL/SQLite in production
class InMemoryDB {
  private store = new Map<string, ModelRecord[]>()
  private counters = new Map<string, number>()

  private nextId(table: string): number {
    const current = this.counters.get(table) ?? 0
    const next = current + 1
    this.counters.set(table, next)
    return next
  }

  seed(table: string, rows: ModelRecord[]): void {
    this.store.set(table, rows)
    const maxId = rows.reduce((m, r) => Math.max(m, Number(r.id ?? 0)), 0)
    this.counters.set(table, maxId)
  }

  findAll(table: string): ModelRecord[] {
    return this.store.get(table) ?? []
  }

  findById(table: string, id: number | string): ModelRecord | undefined {
    return (this.store.get(table) ?? []).find((r) => String(r.id) === String(id))
  }

  findBy(table: string, key: string, value: unknown): ModelRecord | undefined {
    return (this.store.get(table) ?? []).find((r) => r[key] === value)
  }

  insert(table: string, data: Omit<ModelRecord, 'id'>): ModelRecord {
    const rows = this.store.get(table) ?? []
    const record: ModelRecord = { id: this.nextId(table), ...data }
    rows.push(record)
    this.store.set(table, rows)
    return record
  }

  update(table: string, id: number | string, data: Partial<ModelRecord>): ModelRecord | null {
    const rows = this.store.get(table) ?? []
    const index = rows.findIndex((r) => String(r.id) === String(id))
    if (index === -1) return null
    rows[index] = { ...rows[index], ...data }
    this.store.set(table, rows)
    return rows[index]
  }

  delete(table: string, id: number | string): boolean {
    const rows = this.store.get(table) ?? []
    const index = rows.findIndex((r) => String(r.id) === String(id))
    if (index === -1) return false
    rows.splice(index, 1)
    this.store.set(table, rows)
    return true
  }
}

export const db = new InMemoryDB()

// Seed default tables
db.seed('users', [
  { id: 1, name: 'Rahul Kushwaha', email: 'rahul@example.com', role: 'admin' },
  { id: 2, name: 'Priya Sharma', email: 'priya@example.com', role: 'user' },
])

db.seed('auth_users', [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@neevjs.dev',
    // In production use bcrypt — for demo plain text
    password: 'admin123',
    role: 'admin',
  },
])
