<div align="center">
  <img src="https://raw.githubusercontent.com/Rahul7raj/neevjs/main/docs/logo-inline.png" alt="NeevJS" height="80" />
  <br />
  <br />
  <a href="https://github.com/Rahul7raj/neevjs"><strong>GitHub Repository</strong></a> &nbsp;|&nbsp; <a href="https://Rahul7raj.github.io/neevjs"><strong>Documentation</strong></a>
</div>

<br />

# @neevjs/client

> NeevJS core React framework — plugin-driven, offline-first, built for business apps.

## Install

```bash
npm install @neevjs/client
```

## Usage

```tsx
import { createClient, NeevProvider, useModel, AuthPlugin } from '@neevjs/client'

const client = createClient({ baseURL: '/api' })
client.use(AuthPlugin)

function App() {
  return (
    <NeevProvider client={client}>
      <YourApp />
    </NeevProvider>
  )
}

function YourApp() {
  const { data, loading, create, remove } = useModel('users')
  // data, CRUD — all in one hook
}
```

## Docs

Full documentation at [Rahul7raj.github.io/neevjs](https://Rahul7raj.github.io/neevjs)

## License

MIT — Rahul Raj Kushwaha
