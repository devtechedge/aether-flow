# Security Assessment — AetherFlow

**Date:** 2026-08-21  
**Scope:** Auth, XSS, injection, CORS, secrets, third-party APIs  
**Context:** Public deploy is a **client-side flowchart IDE** (Vercel). Gemini and Google Workspace are **optional**. Unsigned graphs run in the visitor's browser with mock payloads.

---

## Executive summary

| Area | Risk | Notes |
|------|------|--------|
| Authentication | **Optional (accepted)** | Google sign-in is off unless Firebase env vars are set. Public demo is mock-mode. |
| Authorization | **N/A on Vercel** | No multi-tenant backend. Graphs live in `localStorage`. |
| XSS | **Low** | No `dangerouslySetInnerHTML`. Node labels and logs render as React text. |
| Code execution | **Accepted residual** | Logic nodes use `new Function` **in the visitor's browser** on graph JSON they control. |
| Injection (SQL) | **N/A** | No database. Persistence is `localStorage`. |
| Secrets in repo | **Hardened this pass** | Live Firebase applet config removed. `.env*` gitignored. |
| CORS | **N/A** | Same-origin Vite app + `/api/gemini/generate`. |
| Payments | **N/A** | No payments. |

**Overall (public Vercel demo):** Low residual risk — mock Workspace/Gemini, no backend secrets required, no auth boundary to break.

**Overall (if Gemini + Google Workspace keys are live):** Medium — the Gemini proxy must stay server-side; Google OAuth tokens stay in memory; logic-node `Function` is still not a sandbox.

---

## 1. Authentication & session

**Findings**
- Public demo does **not** require login.
- Optional Google popup (`src/lib/firebase.ts`) requests Gmail / Drive / Docs scopes only when `VITE_FIREBASE_*` is configured.
- Access tokens are held in a module-level variable. They are not written to `localStorage`.

**Verdict:** Do not claim Firebase Auth as a production identity layer. It is an optional Workspace connector.

---

## 2. Logic-node evaluation

**Findings**
- Decision nodes call `evaluateLogic` (`src/utils/logicEval.ts`), which wraps `new Function`.
- Expressions are capped at 240 characters.
- This is **not** a jail. It runs in the same origin as the IDE, with the graph the user just drew.

**Accepted for portfolio demo.** Not accepted as a multi-tenant hosted compiler for untrusted graphs.

---

## 3. XSS

- No `dangerouslySetInnerHTML`.
- Console logs, node labels, and commit messages render as React text → default escaping.
- Interpolated templates (`{{gmailOutput}}`) are written into mock payloads and Gemini prompts, not into HTML.

---

## 4. Gemini proxy

| Path | Auth | Notes |
|------|------|--------|
| `POST /api/gemini/generate` | None | Requires `GEMINI_API_KEY` in the server env. Prompt clipped to 8k chars. |
| Missing key | — | Returns **503**; the client falls back to a mock string. |

The public Vercel project may ship **without** `GEMINI_API_KEY`. That is the documented demo path.

Do not put the key in `VITE_*` — it would leak to the browser.

---

## 5. Google Workspace nodes

- Unauthenticated runs use **mock** inbox / Drive / Docs payloads. They cannot read a visitor's mail.
- Authenticated runs call Google APIs with the popup OAuth token. Scope list is in `src/lib/firebase.ts`.
- Full-mailbox `https://mail.google.com/` was dropped in this pass; remaining scopes are the minimum the nodes actually call.

---

## 6. Secrets & config

- `.gitignore` excludes `.env`, `.env.*`.
- `.env.example` has empty placeholders only.
- `firebase-applet-config.json` (AI Studio dump with a live web API key) **removed**.
- Graph snapshots persist to `localStorage` keys `aetherflow_*`. They never leave the browser on Vercel.

---

## 7. Dependency / supply chain

**This pass**
- Dropped unused `motion` (Framer) — never imported.
- No Prisma, NextAuth, z.ai SDK, or Testing Library tree.
- Quadtree / compile / interpolate helpers are unit-tested.

```bash
npm audit --omit=dev
```

Do **not** run `npm audit fix --force`.

---

## 8. Residual risk & acceptance

**Accepted for portfolio demo**
- No login on the public site.
- Mock Gemini / Workspace payloads.
- In-browser `Function` for logic nodes the user authors.
- Randomised telemetry meters (not real hardware counters).

**Not accepted if this becomes a hosted multi-user IDE**
- Unsigned `localStorage` graphs as the source of `Function` calls.
- A public Gemini proxy without auth, rate limits, and cost caps.
- Broad Google mail scopes.

---

## 9. How to re-test

```bash
npm install
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
```
