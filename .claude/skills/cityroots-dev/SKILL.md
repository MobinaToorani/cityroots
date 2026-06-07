---
name: cityroots-dev
description: Continue production development of the CityRoots community lifestyle guide. Use this skill to add features, fix issues, verify the app, or pick up where the last session left off. Knows the full tech stack, design constraints, and data model.
---

You are continuing production development of **CityRoots** — a community lifestyle guide web app at `/home/mobina/development/github.com/MobinaToorani/cityroots`.

## Stack (non-negotiable)

- **Next.js 16.x App Router** — `generateStaticParams` for city pages, `Suspense` required around `useSearchParams`
- **Tailwind v4** — `@import "tailwindcss"` + `@theme {}` in `app/globals.css`; **no `tailwind.config.ts`**; `@theme inline` means CSS vars may not emit to `:root` — use hex values for SVG `fill` and Leaflet
- **shadcn/ui (Base UI version)** — `Button` from `@base-ui/react/button`; **no `asChild` prop**; use `buttonVariants()` directly on `Link`/`a`
- **Vaul Drawer** for place detail — always include `DrawerDescription` for accessibility
- **Base UI Sheet** for mobile nav — always include `SheetTitle` + `SheetDescription className="sr-only"`
- **Fuse.js** fuzzy search, threshold 0.4, keys: `name/description/tags/highlights/neighborhood/why`
- **react-leaflet + OpenStreetMap** — lazy-loaded via `dynamic(() => import(...), { ssr: false })`
- **react-hook-form + zod** for the submit form

## Color system

`CATEGORY_COLORS` (hex) in `data/categories.ts` — use these for SVG `fill` attributes and Leaflet `pathOptions.fillColor`. The CSS custom property variants (`CATEGORY_CSS_VARS` / `var(--color-category-*)`) only resolve in CSS `style` props, not SVG presentation attributes.

```ts
// Always import hex colors for map/SVG work:
import { CATEGORY_COLORS } from "@/data/categories";
```

## Server vs. client components

Pages that export `metadata` must be server components. Extract interactive parts into client child components (e.g. `ExploreClient`, `SubmitForm`, `CityGuideClient`). Never co-locate `"use client"` and `export const metadata` in the same file.

## Filter count pattern

`CityGuideClient` computes counts for each filter dimension by applying all *other* active filters first (e.g. `costCounts` respects active category/type/search but not the active cost). This gives accurate "what you'd get if you click this" counts. Maintain this pattern when adding new filter dimensions.

## URL filter sync

Filter state is synced to URL via `useSearchParams` / `router.replace` with an `isFirstRender` ref to avoid pushing on mount. Filters are bookmarkable.

## Data model

All places are in `data/cities/<city-id>.json`. Each place has:
`id, name, type (place|event|program|resource), category, tags, cost (free|low|moderate|varies), costNote?, address, neighborhood, lat?, lng?, website?, phone?, hours?, description, highlights[], why?, isRecommended?, isFree?, seasonal?, seasonNote?, lastVerified?`

City JSON has: `id, cityName, province, tagline, heroDescription, places[]`

## Design principles

- Functional over promotional — no landing-page aesthetics
- Restraint over decoration — no em dashes in UI copy, no scale animations, no card side borders
- Premium feel without gimmicks — zinc palette, Inter, careful spacing
- Human-first — surface free options, show verified dates, avoid dark patterns

## Dev workflow

Start the dev server:
```bash
npm run dev -- --port 3099
```

If another instance is already running (`next dev` detects it and refuses to start), ask the user to run `! kill <pid>` where the PID is shown in Next.js's error output or via `ps aux | grep next`.

Check a route:
```bash
curl -s -o /dev/null -w "%{http_code}" --max-time 20 http://localhost:3099/
```

TypeScript check:
```bash
npx tsc --noEmit
```

Production build:
```bash
npm run build
```

## Current state (as of 2026-06-06)

- **Cities**: Richmond Hill (26 places), Newmarket (25 places), Markham (23 places), Vaughan (20 places) — all fully built out and statically generated
- **Coming soon in Explore**: Barrie, Oakville, Toronto, Hamilton
- **All routes functional**: `/`, `/richmond-hill`, `/newmarket`, `/markham`, `/vaughan`, `/explore`, `/submit`, `/about`
- **Features complete**: category/cost/type filters with dynamic counts + `aria-pressed`, fuzzy search with `/` shortcut, grid/list/map views, WellbeingWheel SVG, WeeklySchedule planner, Leaflet map, detail drawers, OG images (root + per-city), JSON-LD, error boundary, loading skeletons, sitemap, robots.txt, active nav highlighting, title template, metadataBase
- **UI details**: category top bar (3px color bar) on grid cards, short category labels in filter pills, color dots on cost filter, mobile filter collapse (cost+type hidden behind a Filters button on mobile), chip-style stats in city header, improved footer with copyright year

## What to work on next

When asked to "continue" or "keep going":
1. First verify build is clean: `npm run build` (should be zero errors)
2. Pick the highest-value item from this list in order:
   - Add a 5th city (Barrie or Oakville)
   - Add more places to any city under 25 places
   - `WeeklySchedule` mobile UX — currently desktop-focused, accordion layout on mobile would help
   - Character counters on submit form textareas
   - `data-track` attributes on key interactions (filter clicks, place opens) for future analytics
   - Keyboard navigation audit: Tab through filters, Enter to open drawer, Escape to close
   - Improve the WellbeingWheel tooltip/hover labels on desktop

Always prefer working items over planning items. Ship something real each session.
