# Decisions

Every judgment call made during the rebuild, with the reason. Newest phase at the bottom of each section. Spec references are to the CityRoots Rebuild Specification.

## Process

**Rebuilt in place on the `rebuild` branch.** The old site stays on `main` and in git history. Only data was ported: the nine city JSON files moved to `scripts/seed-data/cities/`. No old code was carried over.

**One phase at a time, with a review after each.** The spec is five phases. Phase 1 delivered the foundation plus a server-rendered baseline of the explorer and place pages, so that nothing on the site links to a page that does not exist yet. Phase 2 delivered the explorer (map, client filters, command palette), the submit flow, hours parsing, and the event calendar.

## Stack

**Next.js 16, not 15.** The spec says 15+. 16.4 was current and already in use. Notable differences honoured: async `params`/`searchParams`, `proxy.ts` replaces `middleware.ts` (not needed yet), top-level `typedRoutes`, and `images.qualities` must list every quality used.

**`typedRoutes: true`.** Every `<Link>` and `redirect()` is checked at compile time against real routes. This is the first line of defence for "no dead links".

**TypeScript 6 strict, plus `noUncheckedIndexedAccess`.** ESLint bans `any`, non-null assertions, `console`, and empty `catch` blocks. The logger and CLI scripts are the only places allowed to write to the console.

**`nuqs` for URL state.** One set of parsers (`src/lib/domain/explore-params.ts`) runs on the server for the first render and on the client for updates. Multi-value filters are comma lists (`cost=free,low`). Map bounds are `bbox=west,south,east,north`; invalid boxes are dropped, not errors.

## Data

**PGlite locally, any Postgres in production.** No Docker or Postgres was available, and no credentials. `src/lib/db/create.ts` uses embedded Postgres (PGlite, real Postgres compiled to WASM) when `DATABASE_URL` is unset, and `node-postgres` when it is set (Neon, Supabase, or any Postgres). The same migrations run on both, including enums, the generated `tsvector`, and the GIN index. On Vercel, `DATABASE_URL` is required: env validation fails the boot without it.

**Builds use one worker when on PGlite.** PGlite is single-process, so `next.config.ts` sets `experimental.cpus: 1` only when `DATABASE_URL` is unset. Production builds against Neon use the normal worker count.

**401 source places became 400.** The working tree had 56 new Richmond Hill places (you chose to include them). Markham listed `markham-unionville-festival` twice. The seed keeps the most recently verified record and logs the merge. Final counts: 205 Free, 144 Low cost, 41 Moderate, 10 Varies. The seed checks these counts against the database after every run and fails on a mismatch.

**Deterministic ids.** Place, city, and category ids are UUID v5 hashes of stable keys (`place/<city>/<legacy-id>`). Re-seeding upserts by id, so it never duplicates rows or breaks `/places/[id]` links, and it never wipes community data that references places.

**Category slugs shortened to the spec's.** `arts-crafts`, `food-culture`, and `cafes-spaces` became `arts`, `food`, and `cafes`, matching the spec's accent list and its example URL (`cat=cafes`). The legacy mapping lives in `LEGACY_CATEGORY_MAP`.

**Schema additions beyond the spec's list.**

- `places.kind` (place, event, program, resource): needed for the type filter. The spec lists the filter but not the column.
- `places.highlights`, `tags`, `curator_note`, `season_note`, `seasonal`, `phone`, `last_verified_at`: carried from the legacy data, all shown on the place page.
- `cities.region`, `tagline`, `curator_note`; `categories.short_name`, `position`.
- Auth.js tables (`accounts`, `sessions`, `verification_tokens`) and `users.email_verified`/`image`, required by the Drizzle adapter.
- `submissions.contact_email` and `submissions.place_id` (for corrections); `partner_keys.key_prefix` and `last_used_at`.

**Foreign-key rules.** Places restrict deleting their city or category (no silent mass deletes). User-owned rows (collections, claims, subscriptions, sessions) cascade with the user. Authorship references (`submitted_by`, `claimed_by`, `reviewer_id`, `tips.user_id`) are set to null so content outlives accounts.

**Map index.** A plain B-tree on `(lat, lng)` serves bounding-box queries at this scale (400 rows). PostGIS was not added; revisit past roughly 50k places.

**Hours: a strict parser, and text as the fallback.** `hours` is JSON shaped `{ text, weekly? }`. `parseWeeklyHours()` only fills `weekly` when the text is an unambiguous weekly schedule ("Tue to Sat 11am to 5pm; closed Sun to Mon"). It refuses anything seasonal, month-specific, weather-dependent, "varies", "check website", or parenthetical. 143 of the 274 places with hours parse; the rest keep showing their text and get no "Open now" badge. A wrong "Open now" sends someone to a locked door, so a missing badge is the better failure. The seed parses on insert, and `npm run db:backfill` re-derives existing rows after parser changes.

**"Open now" is computed in the browser, in America/Toronto time.** Computing it on the server would freeze it into cached HTML. The badge renders after hydration and refreshes every minute.

**Events have a date precision.** The legacy data has 52 recurring events and festivals but no exact dates. `events.date_precision` is `day` or `month`. The seed derives the next occurrence only when a season note names a month ("Saturdays May through October", "Annual event in June"), giving 31 calendar events. An explicit day ("July 1st") gives day precision. Vague notes ("summer weekends") produce no event rather than an invented date, and those listings stay in the explorer under Events.

Month-precision events always display as "Usually in June" or "Usually May to October", never as a specific date. The calendar's first group is "In season now", not "On now", because a month-precision event cannot promise it is running today.

## Copy

**Legacy copy is cleaned at seed time, not hand-edited.** `cleanCopy()` in `src/lib/domain/copy.ts` turns a paired em dash aside into commas and a single em dash into a colon ("summer weekends: food trucks, local vendors"). It also replaces "hidden gem" with "local favorite", and "unlock", "elevate", and "seamless" with plain words. The same function will clean community submissions in Phase 2. 797 em dashes were removed.

**Card hooks are the first sentence of the description.** The legacy data has no one-line summary field.

**Community text goes through the same cleaner.** Submitted names, descriptions, and corrections pass through `cleanCopy()` during validation, so an em dash or "hidden gem" in a suggestion never reaches a curator's queue in a form that would fail the copy check later.

**The copy check scans source and built output.** `npm run check:copy` covers em dashes (including the `&mdash;` entities), `animate-ping` and `animate-pulse`, monospace fonts, emoji, TODO comments, lorem ipsum, and the banned phrases. It found real problems on its first run (em dashes in neighborhood names, "unlock" in a description), and both were fixed at the source.

**Typical spend estimates.** The home page's sample day shows an estimated total. Bands have no prices, so `TYPICAL_SPEND` (Free $0, Low cost $10, Moderate $30, Varies $15) is used, and the UI always labels the result "Estimated".

## Design

**Contrast on glass.** The spec's `--color-text-muted: #6B675F` and `--color-free: #1E7A46` measure 2.8:1 and 2.7:1 on 72% white glass over a black photo, failing WCAG AA. Changes:

- Muted text is `#5F5B54`, and free green is `#176B3C` (light) / `#6FD39A` (dark).
- Glass that carries text over photography uses `glass-strong` (88% light, 86% dark). On that surface, every text token passes 4.5:1 against a pure black or pure white photo (worst case).
- The 72% `glass` is used only over the paper background or color fields.

**Hero text sits on a scrim, not glass.** Headline text on photos sits over a black gradient of at least 60% where the text is, which keeps white text at 7:1 or higher over any photo.

**Dark mode follows the OS.** There is no toggle yet, since the spec does not ask for one. In dark mode, active controls invert (light pill, dark text) rather than staying matte black on a near-black background, where the active state would disappear.

**Theme tokens are always emitted (`@theme static`).** Category accents are referenced from inline styles, which Tailwind cannot see, so without `static` it dropped them.

**Fraunces uses `display: optional`.** As `swap`, the display serif re-painted the headline late and set LCP. As `optional`, a slow first visit keeps the fallback serif for that page view. The optical-size axis was dropped too (67 KB to 37 KB).

**Hero photos are served at quality 60.** They sit under a dark scrim, and the saving goes straight to LCP. Everything else uses 75.

**No route `loading.tsx` files.** A route-level `loading.tsx` wraps the page in Suspense. The real content then ships inside `<div hidden>`, and an inline script reveals it. That broke the no-JS requirement (the explorer showed only a skeleton without JavaScript) and caused a 0.18 CLS as the footer jumped. Server-rendered pages now arrive complete. Pending states for in-app navigation will come from client components (`useLinkStatus`) in Phase 2, when the explorer gets optimistic filtering.

**Photography is from Wikimedia Commons.** It is licensed CC BY, CC BY-SA, or public domain, and every photo shows a linked credit (artist and license) where it appears. The sources and licenses are in `scripts/seed-data/photo-credits.json`. `scripts/photos.ts` resizes the originals to 2400px and generates the blur placeholders into `src/content/photos.json`. The home hero is Lake Wilcox at sunset (Richmond Hill), the golden-hour shot the spec asks for. Individual place photos are not sourced yet; place pages use a category-tinted color field instead.

**Data license: CC BY 4.0.** It is simple and allows commercial reuse with attribution, which suits partners. ODbL's share-alike would have discouraged municipal and campus reuse.

## Home page

**No numbers strip, and no three-card feature rows.** The spec's live counter strip (cities, places, free share) was removed at the owner's request, as was the three icon-card layout under "Nobody pays for placement". Those three points are now a plain single-column list. The hero still names the city count.

## Navigation

**Route crossfade uses React view transitions.** The app template wraps pages in `<ViewTransition enter exit default="none">`, so the crossfade runs only on navigation. The Phase 1 version faded every page in from transparent with a CSS animation, including the first load. Removing that cut about 100 ms of TBT and 350 ms of LCP on Explore. The earlier transform-based fade also made the template the containing block for `position: fixed` children, which broke the full-screen map on phones. `default="none"` keeps filter updates from crossfading the whole page.

**Two shells.** Marketing and guide pages (home, city, about, sign in) use a floating glass header. App pages (explore, places, account) use the persistent left rail on desktop. Both use a bottom tab bar on mobile.

**Only shipped routes appear in navigation.** The footer's partner link (spec section 4) is left out until `/partners` exists in Phase 4.

**The Day Planner teaser shows what the planner would build.** The home page and the planner intro run the real assembly for the coming Saturday in Newmarket on a $25 budget, so the preview is never a mock-up.

**Navigation per surface.** The phone tab bar holds five items: Explore, Events, Planner, Saved, Account. The logo goes home. The marketing header drops Home and Saved; the desktop rail shows everything.

**The header shows a static "Account" link, not session state.** Reading the session in the shared layout would make every marketing page dynamic, and cost LCP. `/account` redirects signed-out visitors to sign in and back.

## Auth

**Database sessions, not JWT.** The cookie is an opaque random token, HTTP-only, Secure in production, and SameSite=Lax. The session and the user's role are read from Postgres on each request, so a revoked role takes effect immediately. A signed or encrypted JWT would keep stale roles until expiry.

**Magic links without an email provider.**

- With `RESEND_API_KEY` set, links are sent through Resend.
- In development without a key, the link is written to the server log.
- In production without a key, email sign-in is hidden.
- `EMAIL_LOG_ONLY=true` logs links in production builds, for CI and previews only. Env validation refuses to boot with it on Vercel production.

**Email sign-in redirects in the server action.** Auth.js's own redirect points at `/api/auth/verify-request`, and the router's soft navigation stopped there. The action passes `redirect: false` and then redirects to `/signin/check-email` itself.

**Post-sign-in redirects are same-site only.** `safeRedirectPath()` rejects absolute URLs, `//host`, and `/\host`.

**Google sign-in appears only when both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set.** Setting just one fails validation.

## Explorer

**Every filter is a real link.** Chips, sort, and the list/map switch render as `<a href>` with the full URL, so the explorer works without JavaScript. With JavaScript, clicks are intercepted and update the URL through `nuqs` in a React transition. Controls change at once, while results dim (`aria-busy`) until the server responds. There are no skeletons or spinners in the explorer.

**Infinite scroll keeps its button.** "Show 24 more" is a GET form. With JavaScript, an IntersectionObserver also submits it 600px before the end of the list. Pages are cumulative (`page=3` renders results 1 to 72), so a shared or reloaded link shows the same list.

**List view is the default; the map loads on request.** MapLibre is about 280 KB gzip, plus a 145 KB worker. Both load only when `view=map` (the library through `next/dynamic`), keeping the explorer's first load at about 177 KB of script against its 300 KB budget.

**MapLibre with OpenFreeMap tiles.** MapLibre is open source with no billing dependency (spec section 2 allowed it). OpenFreeMap serves vector tiles with no API key or account, using its Positron style in light mode and Dark in dark mode. Swapping to a paid provider later only means changing the URLs in `src/lib/map/config.ts`.

**MapLibre's worker is copied into `public/`.** MapLibre 6 finds its worker through `import.meta.url`, which the bundler cannot follow. `scripts/copy-map-worker.mjs` runs before `dev` and `build` and copies it to `/maplibre/maplibre-gl-worker-<version>.mjs`. The versioned name makes it safe to cache forever. The copy is gitignored.

**Pins are map layers, and the list is the accessible path.** Clustering and pins are drawn by MapLibre, which has no per-pin DOM. Every pin's place is also in the results list next to the map, and a "Skip the map, go to results" link comes first. Selecting a pin opens a glass card and moves focus to its "View details" link; Escape closes it.

**Map bounds only change the URL when the person moves the map.** The initial fit to results does not write `bbox`. Panning or zooming does, and limits results to that area ("114 results in this map area"), with a "Show results everywhere" button to undo it. Places without coordinates (18 of 133 in Newmarket, mostly city-wide services) appear in the list but not on the map; the overlay says how many are on the map.

**On phones the results are a bottom sheet over a full-screen map.** It snaps between peek, half, and full. Selecting a pin drops it to peek so the card and the pin stay visible. The map's initial fit is padded by the sheet height so pins do not start out hidden under it.

## Search

**The command palette scores in TypeScript.** `/api/search` loads published places and live cities, and scores them with `fuzzyScore()`, which accepts exact words, prefixes, substrings, one typo ("libray", "musuem"), and in-word abbreviations. Name matches count double, and free listings win ties. At 400 rows this takes a few milliseconds. Switch to `pg_trgm` past a few thousand rows.

**One palette, many triggers.** The dialog is mounted once in the root layout. The rail, header, and mobile header render `PaletteTrigger` links to `/explore`, which open the palette with JavaScript and still go somewhere useful without it. It is a native `<dialog>` (focus trap, Escape, and inert background for free) with the ARIA combobox pattern. The last five picks are kept in `localStorage`; nothing about searches is sent anywhere else.

## Submissions

**No account needed to suggest a place or a correction.** Email is optional and used only to say the suggestion was reviewed. It is stored in `submissions.contact_email`, separate from the payload, so it can be purged without touching the suggestion.

**Spam defences are a honeypot and a rate limit.** A visually hidden `company` field must stay empty, and each client can send 5 submissions per hour. There is no CAPTCHA. Revisit if the review queue fills with spam.

**Everything slow happens after the response.** The action validates, stores the submission as `pending`, and redirects to `/submit/thanks` (post, redirect, get). The reviewer notification (Slack webhook when `SLACK_WEBHOOK_URL` is set, otherwise the server log) and the optional receipt email run in `after()`. Their failures are logged and never shown to the person.

**Corrections start from the listing.** Every place page has "Suggest a correction", which opens the form with the place filled in. `/submit?type=correction` without a place asks the person to open the listing first, rather than offering a place picker that could pick the wrong branch.

**Reviewing is database-only until Phase 4.** Submissions land in the queue and notify reviewers, but approving one currently means editing the database. The review screen is part of the admin work in Phase 4.

## Rate limiting

**A sliding window stored in Postgres.** The `rate_limits` table keeps a count per key and fixed window, and the limit uses the weighted sum of the current and previous windows. This needs no Redis and works across serverless instances. Limits: 5 submissions per hour, 60 palette searches per minute. Old windows are deleted on about 2% of calls.

**The client key is a keyed hash of the IP.** It is `sha256(AUTH_SECRET:ip)`, taken from `x-forwarded-for`, which Vercel sets. Raw IPs are never stored.

**The limiter fails open.** If the rate limit query fails, the request goes through and the error is logged. A database hiccup should not block every visitor's search, and the submit form still has its honeypot.

## Collections

**Free members keep up to 3 collections; Pro has no limit.** The spec makes "unlimited collections" a Pro feature, so free needs some limit. Three covers "this weekend", "with the kids", and "someday" without nagging. Every collection holds up to 200 places for everyone. Nothing is deleted when Pro ends: existing collections stay readable and editable, and only new ones are blocked.

**Saving works without JavaScript.** The bookmark on every card is a link to `/collections/save?place=`, a server-rendered form. With JavaScript it opens a dialog instead. The dialog's code loads on the first save only (`next/dynamic` in a host mounted once in the root layout), so pages that never save ship about 1 KB for it.

**The bookmark does not show saved state on first render.** Place, city, and home pages are statically generated, and reading the session would make them dynamic. The icon fills in once the member saves in the dialog.

**Collections are private until shared.** "Share with a link" makes `/collections/[id]` readable by anyone with the URL. Shared collections are `noindex`.

**Reordering uses Move up and Move down buttons, not drag and drop.** They work with a keyboard and a screen reader, and need no JavaScript (each is a form). The same pattern is used in the plan editor.

## Day Planner

**Assembly is a pure function** (`src/lib/domain/planner.ts`, unit tested). Five slots, each with allowed categories: morning coffee, something free, lunch, an afternoon stop, and the evening.

- Candidates come in ranked order (free first, then community signals), so the planner inherits ranking integrity.
- Interests move matching places to the front of a slot; they never add places a slot would not allow.
- A place with a reliable weekly schedule must be open at the slot time on that weekday. Places without one are allowed, and the plan says "Check the hours before you go".
- Events are only used when a known run covers the day.
- Each slot keeps money back for the cheapest option in the slots after it, so an early splurge never leaves the evening empty. A slot that cannot fit is left out and named.
- "Shuffle the plan" rotates through the top three choices in each slot (`seed` in the URL).

**Costs are estimates per person.** The first dollar amount in a listing's price note wins, unless the note is about memberships or passes; otherwise the band's typical spend (low $10, moderate $30, varies $15). Every estimate is labelled "About", and saved plans recompute costs on the server, never trusting the browser.

**The stepper shows all four steps at once.** Each step is a numbered card in one GET form. Hiding steps until hydration would shift the layout and break without JavaScript; one page of four short questions is quick either way.

**Saved plans live in a `plans` table** (not in the spec's data model). The share link uses a random 11-character id, not the row id. Shared plans are public, server-rendered with Open Graph tags for link previews, and `noindex`, because they are personal. They are not blocked in robots.txt, because some link-preview bots honour it.

**Plan times follow position.** Reordering moves a stop to that position's time (9:30am, 11am, 1pm, 3pm, 6:30pm); the stop keeps its label.

## Payments

**Stripe Checkout and the customer portal, no custom card forms.** Prices are found by lookup key (`cityroots_pro_monthly`, `cityroots_pro_yearly`), so no price ids live in env. `scripts/stripe-setup.ts` creates the product, both prices, and a portal configuration in test mode.

**Pro is decided on the server, every request.** `getMembership()` reads the `subscriptions` row. Active, trialing, and past due count as Pro (past due keeps Pro while Stripe retries the card). If webhooks ever stop, Pro still ends three days after the paid period.

**Webhooks are idempotent and order-safe.**

- The signature is checked against the raw body before anything else.
- Payloads are parsed with Zod.
- Each event id is inserted into `stripe_events` in the same transaction as its effects. A retry after success is a no-op; a failure rolls back both and returns 500 so Stripe retries.
- Each subscription row stores the creation time of the last event applied, and older events never overwrite newer state.
- The member id travels in `subscription_data.metadata.userId` and in `client_reference_id`, so subscription events can be matched even if they arrive before `checkout.session.completed`.

**Returning from checkout syncs immediately.** `/api/stripe/checkout-return` retrieves the session and applies it, so Pro is on when the member lands, even if the webhook is late. If that fails, the account page says the webhook will finish the job.

**Without Stripe keys, nothing breaks.** The pricing page says payments are not switched on, and checkout cannot be started. Both keys or neither, enforced by env validation.

**The browser tests sign in for real and send signed webhooks.** `EMAIL_OUTBOX_FILE` makes log-only email also append to a file, which the tests read for the magic link (refused on Vercel production). The tests sign their own Stripe events with a local test secret. Checkout itself is not exercised in CI, because it needs a live test-mode account; run `stripe listen` against a test key to try it end to end.

## Ranking

**Free first means different things per sort.**

- Relevance (the default) puts every free listing ahead of every paid one, then orders by score.
- Cost uses the full band order (free, low, moderate, varies).
- Newest is chronological, because a user who picks "newest" asked for chronology.

**The signals are curator pick, tips, saves, recency of verification, and text match.** Curator picks are editorial, not paid. `tests/unit/ranking-integrity.test.ts` asserts the signal type's exact keys. It also fails if `ranking.ts`, or the explorer's signal construction, mentions payment, subscription, tier, partner, claim, sponsorship, or promotion.

**Ranking runs in TypeScript after a SQL filter.** At 400 rows, this keeps one tested implementation. Move scoring into SQL once a city passes about 5k listings.

## Performance (current state)

Lighthouse, mobile, simulated slow 4G, median of 3 runs, after Phase 3:

| Page    | Perf | A11y | Best practices | SEO | LCP    | TBT    | CLS | Script |
| ------- | ---- | ---- | -------------- | --- | ------ | ------ | --- | ------ |
| Home    | 96   | 100  | 100            | 100 | 2.56 s | 84 ms  | 0   | 162 KB |
| City    | 98   | 100  | 100            | 100 | 2.26 s | 81 ms  | 0   | 162 KB |
| About   | 95   | 100  | 100            | 100 | 2.75 s | 159 ms | 0   | 162 KB |
| Explore | 89   | 100  | 100            | 100 | 2.99 s | 256 ms | 0   | 178 KB |
| Events  | 88   | 100  | 100            | 100 | 3.04 s | 287 ms | 0   | 166 KB |
| Submit  | 96   | 100  | 100            | 100 | 2.77 s | 87 ms  | 0   | 166 KB |
| Pricing | 94   | 100  | 100            | 100 | 2.78 s | 168 ms | 0   | 162 KB |
| Planner | 94   | 100  | 100            | 100 | 2.78 s | 145 ms | 0   | 170 KB |

Phase 3 added about 2 KB to every page (the save button and the dialog host; the dialog itself loads on first use). Explore and Events measured 224 and 240 ms of TBT after Phase 2 and 256 and 287 ms in this run, inside this machine's noise but over budget either way.

The LCP budget (2.0 s) is still not met, so the Lighthouse CI step fails. TBT on the app pages sits around the 200 ms budget and crosses it in some runs. Both budgets stay enforced rather than loosened, and the work is scheduled for Phase 5. Candidates: smaller mobile hero crops, fewer backdrop-filter surfaces on long pages, and the app shell's base JavaScript.

On this machine (WSL), run-to-run noise is about 100 ms of TBT and 500 ms of LCP, so compare medians, not single runs. Phase 2 changes that moved the numbers:

- The command palette is in the root layout: about 4 KB on every page.
- The first-load fade on app pages was removed (see Navigation), which cut about 100 ms of TBT and 350 ms of LCP on Explore.
- Correction labels moved out of the Zod schema module, which took the submit page from 196 KB to 164 KB.
- Month sections on the events page use `content-visibility: auto`.

`/events` and `/submit` were added to the Lighthouse URLs and to the same budgets as the marketing pages.

**Lighthouse runs on Linux Chromium.** Under WSL, Lighthouse otherwise launches Windows Chrome and fails. Point `CHROME_PATH` at Playwright's Chromium. CI on Ubuntu needs nothing extra.

## Deferred, by phase

- **Phase 2 (delivered):** map, command palette, optimistic filters, submit flow, hours parsing and "Open now", event calendar, rate limiting. The review screen for the moderation queue moves to Phase 4 with the rest of admin.
- **Phase 3 (delivered):** collections, Day Planner, shareable plans, Stripe subscription with webhooks and the customer portal, `/pricing`. Still to come for Pro: event reminders, the "new near you" digest, and saved collections in the command palette.
- **Phase 4:** partners, embed, business claims, admin.
- **Phase 5:** guides, OG images per city and place, analytics, Lighthouse budgets.

The schema for all of them already exists.
