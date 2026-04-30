# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local development
npm run dev          # Next.js dev server on :3000
npm run build        # Production build (also runs type-check)
npm run lint         # ESLint

# Database
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:push      # Push schema to DB without migrations (dev only)
npm run db:seed      # Seed demo data (runs prisma/seed.ts via tsx)

# Kubernetes deploy (local)
bash k3d-deploy.sh           # Full deploy to local k3d cluster
bash k3d-deploy.sh --reset   # Destroy and redeploy fresh (use after schema or seed changes)
```

**Type-check without building:**
```bash
npx tsc --noEmit
```

**After any schema change:** run `npm run db:generate` locally so the Prisma client types reflect the new schema before running `tsc --noEmit`.

**Redeploy rule:** the k3d cluster runs the production Docker image. Any change to app code, schema, or seed data requires `bash k3d-deploy.sh --reset` to be visible at http://localhost:3000. The `--reset` flag is needed because the migration Job is immutable once complete.

## Architecture

### Route groups and apps

The app has three distinct frontends, each isolated in a Next.js route group with its own layout:

| Route group | URL prefix | Audience | Layout |
|---|---|---|---|
| `(dashboard)` | `/dashboard`, `/jobs`, `/communications`, etc. | Internal staff | Sidebar + TopBar, dark theme |
| `(field)` | `/field`, `/field/job/[id]` | Field technicians (mobile) | No sidebar, touch-optimised, dark theme |
| `(portal)` | `/portal`, `/portal/thank-you` | Public customers | No sidebar, **explicit light-color classes** |

The root layout (`app/layout.tsx`) sets `<html className="dark">`, which activates Tailwind dark variants globally. The portal overrides this by using explicit color classes (`bg-white`, `text-slate-900`, etc.) instead of semantic tokens (`bg-background`, `text-foreground`). Do not use semantic color tokens in portal pages.

### Data pattern: static demo data vs. database

Most dashboard pages (`jobs/page.tsx`, `customers/page.tsx`, `team/page.tsx`, etc.) are **fully static** — they render hardcoded arrays defined at the top of the file. The database is only used by:

- API routes under `app/api/` (jobs CRUD, communications, inventory, invoices, scheduling, portal analysis)
- `prisma/seed.ts` (which populates the demo data the seed routes read)

When adding a new dashboard feature, decide upfront whether it needs live DB data (add an API route + `useEffect` fetch) or can remain static demo data (add to the hardcoded array in the page).

### AI integration

Two Claude API call patterns exist:

1. **`POST /api/jobs/[id]/assess`** — uses `claude-opus-4-6`, text-only, returns a structured JSON assessment (`Assessment` model) for an existing job. Called from the Jobs detail view.

2. **`POST /api/portal/analyze`** — uses `claude-haiku-4-5-20251001`, supports vision (up to 2 base64-encoded images from `FileReader`), returns `{ summary, estimatedRange, estimatedHours, urgency, nextSteps }`. Has a `FALLBACK` object used when `ANTHROPIC_API_KEY` is not set or the API call fails — the portal still works without the key.

Both routes expect JSON-only responses from the model (`system: 'Always respond with valid JSON only'`) and parse with `JSON.parse`. If parsing fails they return an error / fallback rather than crashing.

### Prisma / database

Single Prisma client instance exported from `lib/db.ts` using the `globalThis` singleton pattern (prevents multiple connections in Next.js hot-reload).

Schema is at `prisma/schema.prisma`. Key models: `User`, `Customer`, `Job`, `JobAssignment`, `JobLineItem`, `JobNote`, `Assessment`, `Communication`, `Schedule`, `InventoryItem`, `Invoice`, `InvoiceLineItem`, `Payment`, `CustomerInquiry`.

The `CustomerInquiry` model is the bridge between the public portal and the internal communications view — portal submissions land here, and `app/(dashboard)/communications/page.tsx` renders them as a `PORTAL_INBOUND` channel entry with its own detail panel.

The Dockerfile has a separate `migrator` target (`prisma db push --accept-data-loss && tsx prisma/seed.ts`) run as a Kubernetes Job before the app pod starts.

### Kubernetes (local)

Manifests in `manifests/tradebase/` are applied in order:
1. `00-namespace.yaml` — `tradebase` namespace
2. `01-postgres.yaml` — PVC + Deployment + Service for Postgres
3. `02-secret.yaml` — env vars for the app (DATABASE_URL, ANTHROPIC_API_KEY, etc.)
4. `03-migrate-job.yaml` — runs the `migrator` image once to push schema + seed
5. `04-app.yaml` — app Deployment + NodePort Service (port 30080 → host 3000)

The cluster is named `tradebase`. KUBECONFIG is written to `~/.config/k3d/kubeconfig-tradebase.yaml` by the deploy script.

### Field app state

The field app (`(field)` group) persists all state in `localStorage`:
- `field-tech-id` — which technician is logged in (set on login screen, cleared on logout)
- `field-job-<id>` — per-job state: `{ status, startTime, notes, parts }` where `status` is one of `not_started | en_route | on_site | in_progress | done`

Job and technician data is hardcoded in `app/(field)/field/page.tsx` (`ALL_JOBS`, `TECHS`, `JOBS_BY_TECH`). The field app has no API calls — it is entirely client-side.

## Environment variables

Copy `.env.example` to `.env`. Required for full functionality:

- `DATABASE_URL` — Postgres connection string
- `ANTHROPIC_API_KEY` — enables AI assessment and portal analysis (app works without it using fallbacks)

Optional integrations (SMS, maps, property records, file storage, email) are defined in `.env.example` but not wired up in the current codebase — the relevant API routes exist as stubs.
