# AetherFlow

Local-first visual flowchart IDE. Drag nodes onto a custom pan/zoom canvas, compile the graph, and run a step simulator with time-travel snapshots.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://aetherflow-ide.vercel.app)
[![CI](https://github.com/devtechedge/aether-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/devtechedge/aether-flow/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19-0052CC?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Live Demo

**https://aetherflow-ide.vercel.app**

Do **not** use https://aether-flow.vercel.app — that hostname is paused and is not this project.

> **Status:** The live site is a **client-side demo**. Graphs persist in `localStorage`. Gmail / Drive / Docs nodes use mock payloads unless you sign in locally with Firebase env vars. Gemini calls hit `/api/gemini/generate` and fall back to a canned reply when `GEMINI_API_KEY` is unset.

This is the **only** public repo for the project.

---

## Screenshots

<p align="center">
  <img src="docs/social-preview.png" alt="AetherFlow" width="800">
</p>

| Canvas | Run |
|--------|-----|
| ![Default pipeline on the canvas](docs/screenshots/01-canvas-overview.png) | ![Compile & run with live console](docs/screenshots/02-pipeline-run.png) |

| Inspector | Version control |
|-----------|-----------------|
| ![Node inspector](docs/screenshots/03-inspector.png) | ![Local git ledger](docs/screenshots/04-version-control.png) |

---

## Features

- Custom SVG canvas (no React Flow / GoJS) with pan, wheel-zoom, 8px snap, and cubic-bezier links
- Quadtree viewport culling so off-screen cards skip DOM work
- Node palette: Start, End, Delay, Logic, Gmail, Drive, Docs, Gemini
- Graph compiler: start/end checks, dangling edges, self-loop reject
- Step simulator with VCR controls and snapshot scrubber
- Local branch / commit ledger on `localStorage` plus a visual added / modified / ghost-deleted overlay
- Optional Gemini proxy and Google Workspace nodes; public demo stays mock

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, TypeScript, Tailwind 4 |
| Canvas | SVG + DOM cards, quadtree cull |
| Persistence | `localStorage` (not IndexedDB) |
| Auth | Optional Firebase Google popup — mock mode by default |
| AI | Optional `POST /api/gemini/generate` (Gemini 2.5). Mock fallback on Vercel |
| Local server | Express + Vite middleware (`tsx server.ts`) |
| Hosting | Vercel (static Vite + serverless `/api`) |
| CI | GitHub Actions — Vitest, `tsc`, Playwright |

---

## Quick Start

```bash
git clone https://github.com/devtechedge/aether-flow.git
cd aether-flow
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:3000**. Gemini and Google sign-in are optional — the default pipeline runs on mock data.

```bash
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

---

## Security

Portfolio demo: **no login** on the public site. Logic nodes evaluate short expressions with `Function` in the visitor's own browser. The Gemini key, when present, stays on the server.

Details: **[SECURITY.md](SECURITY.md)**.

---

## License

MIT. See [LICENSE](LICENSE).
