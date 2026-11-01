# Launch checklist

Everything here is either done in code (checked) or a step only the owner can take, such as creating accounts, setting secrets, or pointing DNS. Work top to bottom; each section assumes the one before it.

## 1. Accounts and services

- [ ] **Neon Postgres.** Create the production database and copy its pooled connection string into `DATABASE_URL`. Turn on point-in-time restore (the free tier keeps 24 hours; a paid plan keeps 7 days).
- [ ] **Vercel project.** Import the repo, set the production branch, and confirm preview deployments run for pull requests.
- [ ] **Domain.** Point `cityroots.ca` at Vercel and set `NEXT_PUBLIC_SITE_URL=https://cityroots.ca`. Share links, emails, OG images, and the sitemap all use it.
- [ ] **Resend.** Verify the sending domain (SPF and DKIM), then set `RESEND_API_KEY` and `EMAIL_FROM`. Sign-in depends on this. Leave `EMAIL_LOG_ONLY` and `EMAIL_OUTBOX_FILE` unset in production; env validation refuses the outbox file on production anyway.
- [ ] **Stripe, live mode.**
  - Create the product and both prices with the lookup keys `cityroots_pro_monthly` ($4.99 CAD) and `cityroots_pro_yearly` ($39 CAD). `scripts/stripe-setup.ts` does this in test mode; do the same by hand in live mode.
  - Configure the customer portal.
  - Add a webhook endpoint at `https://cityroots.ca/api/stripe/webhook` for `checkout.session.completed` and `customer.subscription.*`.
  - Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- [ ] **Plausible.** Add the site, then set `PLAUSIBLE_DOMAIN=cityroots.ca`. In Plausible, create these goals by name: Suggestion sent, Correction sent, Claim sent, Checkout started, Plan saved, Place saved, Partner contact. They are listed in `src/lib/analytics.ts`.
- [ ] **Slack (optional).** Set `SLACK_WEBHOOK_URL` so curators hear about new suggestions and claims.
- [ ] **Google sign-in (optional).** Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, or leave both unset for email-only sign-in.

## 2. Secrets and settings on Vercel

| Variable                                     | Production value                                          |
| -------------------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`                               | Neon pooled connection string                             |
| `AUTH_SECRET`                                | `openssl rand -base64 32`                                 |
| `NEXT_PUBLIC_SITE_URL`                       | `https://cityroots.ca`                                    |
| `RESEND_API_KEY`, `EMAIL_FROM`               | From Resend                                               |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Live keys                                                 |
| `PLAUSIBLE_DOMAIN`                           | `cityroots.ca`                                            |
| `ADMIN_EMAILS`                               | The founding admins, comma-separated                      |
| `FEATURE_PARTNERS`, `FEATURE_BUSINESS`       | `false` at launch; turn on together for build and runtime |
| `LOG_LEVEL`                                  | `info`                                                    |

Feature flags and `PLAUSIBLE_DOMAIN` are read at build time by static pages, so changing them needs a redeploy (see DECISIONS.md).

## 3. Data

- [ ] Run `npm run db:migrate` against Neon, then `npm run db:seed`. Seeding is idempotent. `npm run db:dry-run` should report the schema and migrations in sync.
- [ ] Sign in once as each founding admin, then promote curators with `npx tsx scripts/set-role.ts <email> curator`.
- [ ] Spot-check five places per city against their official websites (hours and prices change).
- [ ] Read all six guides on a phone and confirm each stop is still open and priced as written.

## 4. Quality gates (already in CI)

- [x] Format, lint, typecheck, unit tests (125), and the migration dry-run.
- [x] Copy and design rules on source and built pages: no em dashes, no banned phrases, no monospace, no `animate-ping`.
- [x] Playwright (77 tests): explorer with and without JavaScript, sign-in, collections, the planner, signed Stripe webhooks (idempotent and order-safe), admin review, claims, partner keys, the embed, guides, OG images, and axe WCAG 2.2 AA checks on every public page type.
- [x] Ranking integrity: tests fail if ranking reads payment, tier, partner, or claim state, or if claims and partner code write ranking inputs.
- [x] Lighthouse CI on 12 URLs (see "Performance" in DECISIONS.md for the current numbers and the open LCP question).

## 5. Launch day

- [ ] Deploy `main`, then open `/`, a city, a place, `/explore` with the map, `/guides`, and `/pricing` on a phone.
- [ ] Sign in with a real address and confirm the email arrives from the verified domain.
- [ ] Buy Pro with a real card, confirm the account page says Pro, then refund and cancel it in Stripe and confirm Pro ends.
- [ ] Submit a suggestion, publish it from `/admin`, and confirm the contributor email arrives.
- [ ] Paste a city, guide, and place link into a chat app and check the preview image.
- [ ] Submit `https://cityroots.ca/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- [ ] Confirm Plausible is counting visits and that no cookies are set (browser devtools, Application tab).

## 6. First week

- [ ] Check the review queue daily; the receipt email promises a reply.
- [ ] Watch the Vercel logs for `DataError` and webhook 500s. Stripe retries failed webhooks for three days.
- [ ] Review Plausible goals: which cities and guides get traffic, and where checkout starts but does not finish.

## Spec acceptance checklist

| Item                                                                        | Status                                                                                                   |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| No `animate-ping`, monospace, or em dash in user-facing text (CI)           | Done: `npm run check:copy`                                                                               |
| Every filter state is a shareable URL that renders without JS               | Done: explorer e2e runs with JavaScript off                                                              |
| Map keyboard navigable or with a tested alternative                         | Done: the results list is the tested keyboard and screen reader path; the map is labelled to point to it |
| Ranking has no payment or tier inputs (test exists)                         | Done: `tests/unit/ranking-integrity.test.ts`                                                             |
| Free listings first in default sort on every surface                        | Done: explorer, city picks, embed, partner API, planner. Search ranks by name match, free first on ties  |
| Stripe checkout and webhooks tested, idempotent on retry                    | Done for webhooks in CI; checkout itself needs a live test-mode run (step 5)                             |
| Lighthouse 90+ in all four categories on marketing pages; explorer a11y 95+ | Done: performance 90 to 97, accessibility, best practices, and SEO 100                                   |
| WCAG 2.2 AA on explorer, place, planner, and checkout                       | Done for our pages with axe; Stripe Checkout is Stripe's hosted page                                     |
| Seed reproduces the places across 9 cities with correct cost bands          | 400 places across 9 cities (the full working-tree set, chosen over the spec's 345; see DECISIONS.md)     |
| Real empty, error, and loading states everywhere                            | Empty and error states on every page; loading is handled without route skeletons (see DECISIONS.md)      |
| `DECISIONS.md` records every judgment call                                  | Done                                                                                                     |
