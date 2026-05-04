<div align="center">
  <img src="https://raw.githubusercontent.com/Rahul7raj/neevjs/main/docs/logo-inline.png" alt="NeevJS" height="80" />
  <br /><br />
  <a href="https://github.com/Rahul7raj/neevjs"><strong>GitHub</strong></a> &nbsp;|&nbsp;
  <a href="https://Rahul7raj.github.io/neevjs"><strong>Documentation</strong></a>
  <br />
  <code style="font-size: 12px; color: #7E38FF;">v0.1.0-beta</code>
</div>

<br />

# ⚡ NeevJS

> **"Build business apps, not frontend chaos."**

NeevJS ("नींव" = Foundation) is a **plugin-driven, offline-first React framework** for real-world business applications — CRMs, dashboards, POS systems, and internal tools.

---

## Table of Contents

1. [Why NeevJS?](#why-neevjs)
2. [Features at a Glance](#features-at-a-glance)
3. [Installation](#installation)
4. [Project Setup](#project-setup)
5. [The `useModel` Hook](#the-usemodel-hook)
6. [Declarative Components](#declarative-components)
   - [`<Table />`](#table-)
   - [`<Form />`](#form-)
   - [`<NeevBoundary />`](#neevboundary-)
   - [`<Protected />`](#protected-)
7. [Authentication](#authentication)
8. [Plugins](#plugins)
9. [Offline Sync Engine](#offline-sync-engine)
10. [Feature-Driven Architecture](#feature-driven-architecture)
11. [API Contract](#api-contract)
12. [Packages](#packages)
13. [Running Locally](#running-locally)
14. [Contributing](#contributing)

---

## Why NeevJS?

Most React frameworks are built for landing pages. NeevJS is built for **CRUD-heavy business apps** — the kind with dozens of tables, forms, and real-time requirements.

**Before NeevJS** — a typical data-fetching component:
```tsx
// 40+ lines just to show a list
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  fetch('/api/users')
    .then(r => r.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false))
}, [])
```

**After NeevJS** — the same result in 1 line:
```tsx
const { data, loading, create, update, remove } = useModel<User>('users')
```

And it also gives you: **caching**, **deduplication**, **offline sync**, **optimistic UI**, and **global reactivity** — for free.

---

## Features at a Glance

| Feature | Description |
|---------|-------------|
| `useModel()` | Fetch, cache, create, update, delete — one hook |
| Offline-First | Queues mutations in `localStorage`, auto-syncs on reconnect |
| Optimistic UI | UI updates instantly — even before the server responds |
| React 19 Compiler | No `useMemo`/`useCallback` needed — ever |
| `<Table />` | Auto-renders data tables with actions, custom columns |
| `<Form />` | Schema-driven forms with validation and offline support |
| `<NeevBoundary />` | Handles loading + error states via React Suspense |
| `<Protected />` | Role-based route/component protection |
| `useAuth()` | Login, register, logout, token management |
| `useSyncStatus()` | Real-time offline/sync/error status |
| Plugin System | Extensible architecture (Auth, Logger, Cache, Offline) |

---

## Installation

```bash
npm install @neevjs/client
# or
pnpm add @neevjs/client
```

---

## Project Setup

### Step 1 — Configure the Client

Create `src/core/neev.ts` and initialize the client with your plugins:

```ts
import {
  createClient,
  AuthPlugin,
  LoggerPlugin,
  OfflinePlugin,
} from '@neevjs/client'

export const client = createClient({
  baseURL: '/api', // Your backend URL prefix
})

// Plugins run in registration order
client.use(AuthPlugin)    // Injects JWT Bearer token into every request
client.use(LoggerPlugin)  // Logs all requests and responses to the console
client.use(OfflinePlugin) // Queues mutations when offline, syncs on reconnect
```

### Step 2 — Wrap Your App with `<NeevProvider />`

```tsx
// src/app/App.tsx
import React from 'react'
import { NeevProvider } from '@neevjs/client'
import { client } from '../core/neev'
import { HomePage } from '../features/home/HomePage'

export default function App() {
  return (
    <NeevProvider client={client}>
      <HomePage />
    </NeevProvider>
  )
}
```

### Step 3 — Define Your Models

Create shared TypeScript interfaces in `src/models/`:

```ts
// src/models/user.ts
import type { ModelRecord } from '@neevjs/client'

export interface User extends ModelRecord {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'manager'
}
```

> **Why extend `ModelRecord`?** It guarantees your type has an `id` field, which NeevJS needs to correctly identify records for update and delete operations.

---

## The `useModel` Hook

This is the heart of NeevJS. It replaces `useEffect`, `fetch`, `useState(loading)`, and manual cache management.

### Basic Usage

```tsx
import { useModel } from '@neevjs/client'
import { User } from '../models/user'

function UserList() {
  const { data, loading, error, create, update, remove } = useModel<User>('users')

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}
```

| `refresh` | `() => Promise<void>` | Forces a fresh fetch from the server |
| `mutate` | `(data) => void` | Manually update local data (optimistic/external) |

### Query Parameters
Pass the `params` option to `useModel` to handle filtering, sorting, or pagination. Each unique combination of params maintains its own isolated cache.
```tsx
const { data } = useModel<User>('users', {
  params: { role: 'admin', page: 1 }
})
// Fetches from /api/users?role=admin&page=1
```

### With React Suspense

Pass `{ suspense: true }` to use React 19's Suspense-based data fetching. This eliminates all `if (loading)` checks — simply wrap the component in a `<NeevBoundary />`.

```tsx
function UsersContent() {
  // This will "suspend" the component until data is ready
  const { data, remove } = useModel<User>('users', { suspense: true })

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => remove(user.id)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}

// Wrap with NeevBoundary to handle loading + errors
export function UsersPage() {
  return (
    <NeevBoundary loadingFallback={<p>Loading users...</p>}>
      <UsersContent />
    </NeevBoundary>
  )
}
```

### How Caching & Deduplication Work

```
Component A calls useModel('users')  ──┐
Component B calls useModel('users')  ──┼──► Only 1 API call made
Component C calls useModel('users')  ──┘    All share the same cached data

After 60 seconds (stale time expires):
Next render triggers a background refetch automatically.
```

- **Stale Time**: 60 seconds. Data is served from memory cache; no new network request is made.
- **Deduplication**: If 3 components mount at the same time and all call `useModel('users')`, only **one** `GET /users` request is made.
- **Pub/Sub Reactivity**: When you call `create()` in one component, **every** component using `useModel('users')` across your entire app re-renders with the updated data automatically.

---

## Declarative Components

### `<Table />`

Renders a fully-featured data table connected to a NeevJS model.

```tsx
import { Table } from '@neevjs/client'
import { User } from '../models/user'

<Table<User>
  model="users"
  columns={[
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email Address' },
    {
      key: 'role',
      label: 'Role',
      // Custom render function for any column
      render: (val) => (
        <span style={{ background: val === 'admin' ? '#fef3c7' : '#dbeafe' }}>
          {String(val)}
        </span>
      ),
    },
  ]}
  onEdit={(user) => handleEdit(user)}
  onDelete={(user) => handleDelete(user)}
  emptyMessage="No users found. Add one to get started!"
/>
```

**All `<Table />` Props:**

| Prop | Type | Description |
|------|------|-------------|
| `model` | `string` | The model name (maps to `GET /model`) |
| `columns` | `TableColumn[]` | Column definitions. **Auto-detected** from data if omitted. |
| `onEdit` | `(row: T) => void` | Callback when the Edit button is clicked |
| `onDelete` | `(row: T) => void` | Callback when the Delete button is clicked |
| `emptyMessage` | `string` | Message shown when there is no data |
| `classNames` | `TableClassNames` | Override CSS class names for any element |
| `styles` | `TableStyles` | Override inline styles for any element |
| `unstyled` | `boolean` | Strip all default styles (for full custom styling) |

> **Tip:** Omit the `columns` prop to auto-generate columns from your data's keys. Great for rapid prototyping.

---

### `<Form />`

A schema-driven form that handles creating and editing records, with built-in validation, submission, error display, and offline queuing.

**Creating a new record:**
```tsx
import { Form } from '@neevjs/client'
import { User } from '../models/user'

<Form<User>
  model="users"
  fields={[
    { name: 'name', label: 'Full Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
    },
  ]}
  onSuccess={() => console.log('User created!')}
/>
```

**Field-level validation:**
Provide a `validate` function to any field definition. If it returns a string, that string is shown as a per-field error message.
```tsx
fields={[
  { 
    name: 'email', 
    label: 'Email', 
    validate: (val) => !val.includes('@') ? 'Invalid email format' : null 
  }
]}
```

**Editing an existing record:**
```tsx
<Form<User>
  model="users"
  editId={user.id}          // When set, Form calls PUT instead of POST
  initialValues={user}      // Pre-fills the form with existing data
  submitLabel="Update User"
  onSuccess={() => setEditing(false)}
/>
```

**Transforming the payload before submission:**
```tsx
<Form<User>
  model="users"
  // Intercept and modify data before it's sent to the server
  transformPayload={(payload) => ({
    ...payload,
    name: payload.name?.trim().toUpperCase(),
    createdAt: new Date().toISOString(),
  })}
  fields={[...]}
/>
```

**Custom submission logic (`onSubmitOverride`):**
```tsx
<Form<User>
  model="users"
  // Completely bypass the default create/update logic
  onSubmitOverride={async (payload) => {
    await myCustomApiCall(payload)
    await sendWelcomeEmail(payload.email)
  }}
  fields={[...]}
/>
```

**All Form Field Types:**

| `type` value | Renders |
|---|---|
| `'text'` (default) | `<input type="text" />` |
| `'email'` | `<input type="email" />` |
| `'password'` | `<input type="password" />` |
| `'number'` | `<input type="number" />` |
| `'textarea'` | `<textarea />` |
| `'select'` | `<select>` with `options` array |

**All `<Form />` Props:**

| Prop | Type | Description |
|------|------|-------------|
| `model` | `string` | Model name for POST/PUT requests |
| `fields` | `FormField[]` | Schema-driven field definitions |
| `editId` | `number \| string` | If set, form sends `PUT /model/:id` |
| `initialValues` | `Partial<T>` | Pre-fills fields for edit mode |
| `onSuccess` | `() => void` | Called after successful submission |
| `onError` | `(err: Error) => void` | Called when submission fails |
| `submitLabel` | `string` | Text on the submit button |
| `transformPayload` | `(payload) => payload` | Modify data before sending |
| `onSubmitOverride` | `(payload) => Promise<void>` | Replace default submit logic |
| `children` | `ReactNode` | Add custom JSX fields inside the form |
| `classNames` | `FormClassNames` | Override CSS class names |
| `styles` | `FormStyles` | Override inline styles |
| `unstyled` | `boolean` | Strip all default styles |
| `fieldErrors` | `Record<string, string>` | External/server-side field-level errors to display |

---

### `<NeevBoundary />`

Replaces all `if (loading)` and `if (error)` checks when using `{ suspense: true }` mode.

```tsx
import { NeevBoundary } from '@neevjs/client'

<NeevBoundary
  loadingFallback={<SkeletonLoader />}
  errorFallback={(error, reset) => (
    <div>
      <p>Something went wrong: {error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <UsersContent />
</NeevBoundary>
```

| Prop | Type | Description |
|------|------|-------------|
| `loadingFallback` | `ReactNode` | Shown while data is loading |
| `errorFallback` | `(error, reset) => ReactNode` | Shown when an error occurs; `reset()` retries |

---

### `<Protected />`

Wraps any component or route and checks if the user is authenticated (and optionally has a specific role).

```tsx
import { Protected } from '@neevjs/client'

// Only authenticated users can see this
<Protected fallback={<p>Please log in.</p>}>
  <AdminDashboard />
</Protected>

// Only users with role === 'admin' can see this
<Protected role="admin" fallback={<p>Access Denied.</p>}>
  <UserManagement />
</Protected>
```

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Content to show if allowed |
| `fallback` | `ReactNode` | Content to show if denied (default: "not authorized" message) |
| `role` | `string` | Required role. Checks `user.role === role`. |

> **Flash-Free Auth**: The `<Protected />` component performs a synchronous token check on mount. This eliminates the visual "empty content" flash commonly seen in other frameworks while waiting for the auth status to resolve.

---

## Authentication

NeevJS has a built-in, JWT-based auth system. The `AuthPlugin` automatically injects `Authorization: Bearer <token>` into every request.

### Login & Register

```tsx
import { useAuth } from '@neevjs/client'

function LoginForm() {
  const { login, register, logout, user, isAuthenticated } = useAuth()

  async function handleLogin() {
    await login('user@example.com', 'password123')
    // Token is automatically stored in localStorage
    // All future API calls are now authenticated
  }

  async function handleRegister() {
    await register('new@example.com', 'password', 'Rahul')
  }

  return (
    <div>
      {isAuthenticated() ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}
```

### `useAuth()` Returns

| Method | Description |
|--------|-------------|
| `login(email, password)` | Authenticates the user; stores JWT in `localStorage` |
| `register(email, password, name?)` | Registers and logs in; stores JWT |
| `logout()` | Removes the token from `localStorage` |
| `user()` | Returns the current `AuthUser` object (cached in `sessionStorage`) |
| `isAuthenticated()` | Returns `true` if a JWT token exists in storage |

> **Performance:** `AuthClient` caches the user object in `sessionStorage`. On page refreshes, the user is restored instantly without hitting the `/auth/me` network endpoint.

### Required Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | `{ email, password }` → `{ data: { token, user } }` |
| `/auth/register` | POST | `{ email, password, name? }` → `{ data: { token, user } }` |
| `/auth/me` | GET | Returns current user (`Authorization: Bearer <token>` required) |

---

## Plugins

Plugins hook into the request lifecycle. Register them with `client.use()`.

```
Incoming Request
      │
      ▼
 onRequest hooks  (modify/intercept before sending)
      │
      ▼
   fetch()        (actual network call)
      │
      ▼
 onResponse hooks (modify/inspect the response)
      │
      ▼
   onError hooks  (handle failures)
```

### `AuthPlugin`
Automatically injects the stored JWT token as a `Bearer` header on every outgoing request. Zero configuration needed.
```ts
client.use(AuthPlugin)
```

### `LoggerPlugin`
Logs all request URLs, methods, and responses to the browser console. Essential for development.
```ts
client.use(LoggerPlugin)
// Console output:
// [NeevJS] → GET /users
// [NeevJS] ← 200 /users
```

### `CachePlugin`
Caches `GET` responses in-memory for a configurable TTL.
```ts
import { createCachePlugin } from '@neevjs/client'

// Default: 60 second TTL
client.use(CachePlugin)

// Custom TTL (e.g. 5 minutes)
client.use(createCachePlugin({ ttl: 5 * 60 * 1000 }))
```

> **Note:** `useModel` has its own built-in 60-second stale-time cache. `CachePlugin` is an additional HTTP-level cache for other raw `client.request()` calls.
> **Auto-Invalidation:** `CachePlugin` automatically clears the cache for a resource when it detects a mutation (POST/PUT/DELETE) on that same resource path.

### `OfflinePlugin`
The most powerful plugin. Intercepts all mutation requests (`POST`, `PUT`, `DELETE`) when offline and queues them persistently in `localStorage`.
```ts
client.use(OfflinePlugin)
```
See the full [Offline Sync Engine](#offline-sync-engine) section below.

### Writing Your Own Plugin

```ts
import type { NeevPlugin } from '@neevjs/client'

const MyAnalyticsPlugin: NeevPlugin = {
  name: 'analytics',

  onRequest(req) {
    console.log('Tracking request to:', req.url)
    return req // must return the request
  },

  async onResponse(res) {
    return res // must return the response
  },

  onError(err) {
    reportToSentry(err)
  },
}

client.use(MyAnalyticsPlugin)
```

### Global Store (`useStore`)
NeevJS includes a powerful, reactive global state manager that can replace Redux or Zustand for 90% of use cases. It supports persistence, session-only storage, and TTL (Time-to-Live).

```tsx
import { useStore } from '@neevjs/client'

function ThemeSwitcher() {
  // Persistence (localStorage), Session-only, or TTL
  const [theme, setTheme] = useStore('theme', 'light', { 
    persist: true,     // Saves to localStorage
    ttl: 3600 * 1000   // Expires in 1 hour
  })

  return <button onClick={() => setTheme('dark')}>Set Dark</button>
}
```

| Tier | Option | Storage | Lifetime |
|---|---|---|---|
| **In-Memory** | Default | React Context | Lost on reload |
| **Persist** | `persist: true` | `localStorage` | Indefinite |
| **Session** | `session: true` | `sessionStorage` | Tab lifetime |
| **TTL** | `ttl: number` | `localStorage` | Auto-expires after ms |

---

## Offline Sync Engine

NeevJS is built **Offline-First**. When a user performs an action (create, update, delete) without internet access, the framework handles everything automatically.

### How It Works

```
User clicks "Save" while OFFLINE
            │
            ▼
  OfflinePlugin intercepts the request
            │
            ▼
  Action saved to localStorage queue  ──► UI updates instantly (Optimistic UI)
            │
     [Internet restored]
            │
            ▼
  Queue is replayed in the background
            │
       ┌────┴────┐
    Success    Failure (4xx)
       │           │
  Record saved   Action discarded +
  Temp ID        Error added to
  replaced       useSyncStatus
```

### Optimistic UI

When offline, NeevJS adds the record to the local cache immediately with a temporary `temp_<timestamp>` ID. The user sees their data right away, without waiting for the server.

When reconnected, the real server response replaces the temporary record.

### `useSyncStatus()` Hook

Display real-time connectivity and sync feedback anywhere in your app:

```tsx
import { useSyncStatus } from '@neevjs/client'

function SyncIndicator() {
  const { isOffline, pending, syncing, errors, clearErrors } = useSyncStatus()

  if (errors.length > 0) {
    return (
      <div style={{ color: 'red' }}>
        ⚠️ {errors.length} action(s) failed to sync.
        <button onClick={clearErrors}>Dismiss</button>
      </div>
    )
  }
  if (syncing)  return <span>↻ Syncing {pending} actions...</span>
  if (isOffline) return <span>● Offline — {pending} queued</span>

  return <span>● Online</span>
}
```

| Return Value | Type | Description |
|---|---|---|
| `isOffline` | `boolean` | `true` when `navigator.onLine` is `false` |
| `pending` | `number` | Number of actions waiting in the queue |
| `syncing` | `boolean` | `true` while background sync is in progress |
| `errors` | `Error[]` | Permanent failures (e.g., server returned 4xx) |
| `clearErrors` | `() => void` | Clears the error list |

### Error Handling: Transient vs. Terminal

| Error Type | Status Code | Behavior |
|---|---|---|
| **Transient** (network/server error) | 5xx or no response | Action stays in queue, retried next time |
| **Terminal** (validation/not found) | 4xx | Action is **discarded**, added to `errors` in `useSyncStatus` |

---

## Feature-Driven Architecture

NeevJS recommends organizing your project by **business feature**, not by technical role. This keeps every feature self-contained and prevents "Massive Component Syndrome" (1000-line files).

### Recommended Folder Structure

```
src/
├── app/                        ← Global app shell
│   ├── App.tsx                 ← Layout, routing, providers
│   └── main.tsx                ← React DOM entry point
│
├── core/                       ← Framework configuration
│   └── neev.ts                 ← createClient + plugin registry
│
├── models/                     ← Shared domain types (used across features)
│   ├── user.ts
│   ├── product.ts
│   └── order.ts
│
├── shared/                     ← Reusable UI components
│   └── components/
│       ├── SyncIndicator.tsx
│       └── NavBtn.tsx
│
└── features/                   ← One folder per business domain
    ├── users/
    │   ├── components/         ← Feature-specific sub-components
    │   │   ├── UserTable.tsx   ← Only the table view
    │   │   └── UserForm.tsx    ← Only the form
    │   └── UsersPage.tsx       ← The "Orchestrator" — wires it all together
    │
    ├── dashboard/
    │   └── DashboardPage.tsx
    │
    └── auth/
        └── LoginPage.tsx
```

### The Orchestrator Pattern

Keep the "Page" file as a **thin orchestrator** — it only manages UI state (toggling modals, passing handlers). The actual UI is extracted into atomic sub-components.

```tsx
// features/users/UsersPage.tsx  (The Orchestrator — thin and clean)
import React, { useState } from 'react'
import { NeevBoundary, useModel } from '@neevjs/client'
import { User } from '../../models/user'
import { UserTable } from './components/UserTable'
import { UserForm } from './components/UserForm'

function UsersContent() {
  const { remove } = useModel<User>('users', { suspense: true })
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)

  return (
    <div>
      <button onClick={() => setShowForm(!showForm)}>+ Add User</button>
      {showForm && (
        <UserForm
          editUser={editUser}
          onSuccess={() => { setShowForm(false); setEditUser(null) }}
        />
      )}
      <UserTable
        onEdit={(user) => { setEditUser(user); setShowForm(true) }}
        onDelete={(user) => remove(user.id)}
      />
    </div>
  )
}

export function UsersPage() {
  return (
    <NeevBoundary loadingFallback={<p>Loading...</p>}>
      <UsersContent />
    </NeevBoundary>
  )
}
```

---

## API Contract

Every backend endpoint that works with NeevJS must follow this response structure:

```json
{
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 100,
      "lastPage": 5
    }
  },
  "error": null
}
```

### Required REST Endpoints

For a model named `users`, NeevJS expects:

| Method | Endpoint | Action |
|--------|----------|--------|
| `GET` | `/api/users` | Fetch all records |
| `POST` | `/api/users` | Create a record |
| `PUT` | `/api/users/:id` | Update a record |
| `DELETE` | `/api/users/:id` | Delete a record |

---

## Packages

| Package | Description |
|---------|-------------|
| `@neevjs/client` | Core React framework (hooks, components, plugins) |
| `@neevjs/server` | Optional Node.js/Express backend starter |
| `@neevjs/shared` | Shared TypeScript interfaces used by both packages |

---

## Running Locally

```bash
# 1. Install dependencies
npm install -g pnpm
pnpm install

# 2. Start the backend (runs on port 3001)
pnpm dev:server

# 3. Start the demo app (runs on port 5173)
pnpm dev
```

---

## Contributing

Contributions are highly welcome!

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/MyFeature`
3. Commit your changes: `git commit -m 'feat: add MyFeature'`
4. Push to the branch: `git push origin feature/MyFeature`
5. Open a Pull Request.

Please ensure your code adheres to the existing style and all tests pass.

---

## Creator

Built by [**Rahul Raj Kushwaha** (Rahul K Raj)](https://www.linkedin.com/in/rahul-k-raj/)

---

## License

MIT
