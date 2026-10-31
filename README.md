# CityRoots

Free and low-cost things to do across the GTA and Waterloo Region. Every listing shows what it costs, free things come first, and nobody pays for placement.

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Drizzle ORM on Postgres, and Auth.js. See `DECISIONS.md` for the reasoning behind every judgment call.

## Run it locally

```bash
npm install
cp .env.example .env.local      # then set AUTH_SECRET (command is in the file)
npm run db:migrate              # creates an embedded Postgres in .data/pglite
npm run db:seed                 # 9 cities, 10 categories, 400 places, 31 events
npm run dev
```

You don't need Docker or a database server: with `DATABASE_URL` unset, the app uses PGlite. Magic sign-in links are printed to the dev server log.

To reset the local database, run `npm run db:reset`. It refuses to run when `DATABASE_URL` is set.

## Scripts

| Command                               | What it does                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run lint` / `typecheck` / `test` | ESLint, TypeScript, and Vitest unit tests                                                                    |
| `npm run test:e2e`                    | Playwright tests, with axe accessibility checks, against a production build                                  |
| `npm run check:copy`                  | Hard copy rules: no em dash, ping indicators, monospace, emoji, or banned phrases. Checks the built HTML too |
| `npm run db:generate`                 | New migration from `src/lib/db/schema.ts`                                                                    |
| `npm run db:dry-run`                  | Applies every migration to a throwaway database and checks for schema drift                                  |
| `npm run db:backfill`                 | Re-parses every place's hours text into a weekly schedule, after changes to the hours parser                 |
| `npx tsx scripts/photos.ts <dir>`     | Resizes photography into `public/` and rebuilds the blur and credit manifest                                 |

## Layout

```
src/app/(site)       marketing and guide pages (floating header)
src/app/(app)        explorer, place pages, account (left rail)
src/components/ui    design system primitives, with no data or app logic
src/components/features, layout
src/lib/data         every database query lives here
src/lib/domain       business rules: cost bands, ranking, URL state, copy
drizzle/             migrations
scripts/             seed, migrate, photo pipeline, copy check
tests/unit, tests/e2e
```

## Deploying

Set `DATABASE_URL` (Neon or Supabase), `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, and `RESEND_API_KEY`. Run `npm run db:migrate && npm run db:seed` against that database once, then deploy. Google sign-in is enabled when `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are both set. Set `SLACK_WEBHOOK_URL` to get a message for each new suggestion; without it, suggestions are logged.

Payments need `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Create the Pro product and prices once with `STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts` (test mode; set up live prices with the same lookup keys by hand), then point a Stripe webhook at `/api/stripe/webhook` for `checkout.session.completed` and `customer.subscription.*`. Locally, `stripe listen --forward-to localhost:3000/api/stripe/webhook` prints the webhook secret. Without the keys, the pricing page explains that payments are off.

Staff: set `ADMIN_EMAILS` to bootstrap admins, then promote curators with `npx tsx scripts/set-role.ts <email> curator`. The review queue is at `/admin`. Partners and business claims stay off until `FEATURE_PARTNERS=true` and `FEATURE_BUSINESS=true` are set for both the build and the runtime; partner keys are issued at `/admin/partners`.

Map tiles come from OpenFreeMap and need no key. `npm run build` copies MapLibre's worker into `public/maplibre/` first.

## Data and photo licenses

Listings: CC BY 4.0. City photographs come from Wikimedia Commons under their own licenses, credited on each image and listed in `scripts/seed-data/photo-credits.json`.
