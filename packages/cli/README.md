# @neevjs/cli

The official command-line interface for [NeevJS](https://github.com/rahul7raj/neevjs) — the plugin-driven, offline-first React framework for business applications.

## Quick Start

Scaffold a new NeevJS project in seconds:

```bash
npx @neevjs/cli init my-app
```

## Project Modes

The CLI provides an interactive prompt to choose your project architecture:

1. **Fullstack Mode (Default)**
   Scaffolds both a React client and a Node.js (`@neevjs/server`) backend. Perfect for starting a new full-stack application from scratch with unified types and shared models.

2. **API Mode**
   Scaffolds the React client only. Use this mode if you already have an existing backend (Laravel, Django, Go, etc.) and just want to use NeevJS for the frontend. You will be prompted to enter your API's base URL.

3. **Hybrid Mode**
   Scaffolds the React client with examples showing how to connect specific models to different backends simultaneously (e.g., overriding the `baseURL` for a legacy service).

## Commands

### `init [project-name]`
Initializes a new NeevJS project.
```bash
npx @neevjs/cli init my-dashboard
```

### `version`
Displays the current version of the NeevJS CLI.
```bash
npx @neevjs/cli version
```

## License

MIT License © 2024 Rahul Raj Kushwaha
