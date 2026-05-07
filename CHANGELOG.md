# Changelog

All notable changes to the **NeevJS** framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-beta] - 2024-05-07

### Added
- **NeevJS CLI (`@neevjs/cli`)**: Introduced a brand new interactive command-line tool (`npx @neevjs/cli init`) to scaffold projects in seconds.
- **Project Modes**: Formalized support for three architecture modes during project initialization:
  - **Fullstack**: Scaffolds both a React client and a Node.js backend.
  - **API Mode**: Scaffolds the client to connect to an existing external API.
  - **Hybrid Mode**: Scaffolds a client configured for microservices/multi-backend setups.
- **Hybrid Mode Architecture**: The `useModel` hook now accepts a `baseURL` option (`useModel('model', { baseURL: '...' })`), allowing specific models to override the global client configuration and fetch from entirely different APIs.
- **Version Synchronization**: Added `scripts/sync-version.mjs` to automatically keep the framework version synchronized across all internal monorepo packages and documentation.
- **Community Guidelines**: Added a comprehensive "Contributing" section to the documentation.

### Changed
- **Documentation Overhaul**: The landing page and core documentation have been extensively rewritten to feature the new CLI and Project Modes.
- **Landing Page Aesthetics**: Added a premium, interactive 3D Vanta.js (DOTS) background to the documentation landing page.
- **Code Consistency**: Replaced hardcoded version strings in HTML documentation with automated `<!-- NEEV_VERSION -->` placeholders.

---

## [0.0.1] - Initial Release

### Added
- **Core Abstraction**: Introduced the `useModel()` hook as a complete replacement for `fetch`, `axios`, and global state management.
- **Offline-First Engine**: Implemented `localStorage` queuing and background auto-sync for offline mutations.
- **Optimistic UI**: Enabled instant UI updates for create, update, and delete actions.
- **Plugin System**: Released `AuthPlugin`, `LoggerPlugin`, `CachePlugin`, and `OfflinePlugin` to handle interceptors automatically.
- **Global State**: Introduced `useStore` and `SecureStore` for robust client-side state management.
- **Component Library**: Added declarative, schema-driven `<Table />` and `<Form />` components.
- **Backend Starter**: Released `@neevjs/server` to provide an instant Express backend matching the NeevJS API contract.
