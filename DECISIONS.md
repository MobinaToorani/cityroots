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

**No numbers strip, and no three-card feature rows.** The spec's live counter strip (cities, places, free share) was removed at the owner's request, as was the three icon-card layout under "Nobody pays for placement".

**The home page shows the product instead of describing it (November 2026).** The hero is one sentence you can change ("Show me free things to do in Toronto this weekend"), a plain GET form to `/go`, so it works without JavaScript. Below it: what is on this week, moods, cities, and a real sample plan. The "how we make money" section moved to About, with one line in the footer.

## Navigation

**Route crossfade uses React view transitions.** The app template wraps pages in `<ViewTransition enter exit default="none">`, so the crossfade runs only on navigation. The Phase 1 version faded every page in from transparent with a CSS animation, including the first load. Removing that cut about 100 ms of TBT and 350 ms of LCP on Explore. The earlier transform-based fade also made the template the containing block for `position: fixed` children, which broke the full-screen map on phones. `default="none"` keeps filter updates from crossfading the whole page.

**One shell (November 2026).** Every page has the same solid sticky header: logo, city picker, search, and Explore, Events, Plan a day, Saved, Account. Phones get the same five as a tab bar. The earlier pair of a floating header and a left rail made the same site feel like two products, with two searches. The chosen city is remembered in the browser and carried by the nav links.

**Only shipped routes appear in navigation.** The footer's partner link (spec section 4) is left out until `/partners` exists in Phase 4.

**The Day Planner teaser shows what the planner would build.** The home page runs the real assembly for the coming Saturday in Toronto on a $25 budget, so the preview is never a mock-up.

**The header shows a static "Account" link, not session state.** Reading the session in the shared layout would make every marketing page dynamic, and cost LCP. `/account` redirects signed-out visitors to sign in and back.

**Guides live in the footer and on city pages.** They are content, not one of the things the site does.

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

**Saving takes one tap and no account (November 2026).** The heart stores the place in this browser and shows it on `/saved`. Asking for an email before someone has saved anything lost the moment. "Keep on all my devices" signs them in and moves the list into a collection. The heart needs JavaScript.

**Collections are the sorting tool.** "Add to a collection" on a place page opens the dialog, and is a link to `/collections/save?place=`, a server-rendered form, without JavaScript. The dialog's code loads on first use only.

**Collections are private until shared.** "Share with a link" makes `/collections/[id]` readable by anyone with the URL. Shared collections are `noindex`.

**Reordering uses Move up and Move down buttons, not drag and drop.** They work with a keyboard and a screen reader, and need no JavaScript (each is a form). The same pattern is used in the plan editor.

## Day Planner

**Assembly is a pure function** (`src/lib/domain/planner.ts`, unit tested). Five slots, each with allowed categories: morning coffee, something free, lunch, an afternoon stop, and the evening.

- Candidates come in ranked order (free first, then community signals), so the planner inherits ranking integrity.
- Interests move matching places to the front of a slot; they never add places a slot would not allow.
- A place with a reliable weekly schedule must be open at the slot time on that weekday. Places without one are allowed, and the plan says once to check hours before going.
- Events are only used when a known run covers the day.
- Each slot keeps money back for the cheapest option in the slots after it, so an early splurge never leaves the evening empty. A slot that cannot fit is left out and named.
- "Shuffle" rotates through the top three choices in each slot (`seed` in the URL).

**Costs are estimates per person.** The first dollar amount in a listing's price note wins, unless the note is about memberships or passes; otherwise the band's typical spend (low $10, moderate $30, varies $15). Every estimate is labelled "About", and saved plans recompute costs on the server, never trusting the browser.

**Open to everyone, with no account (November 2026; owner to confirm).** This reverses the original plan, where the planner was the paid feature. A locked planner cannot show why it is good, and research points to budget-conscious people who will not pay before seeing value. Now anyone gets a plan on arrival, can change it, and can share it by its address (which rebuilds the plan as first made). Pro keeps a plan, with edits, at a permanent link, and adds unlimited collections. To restore the old gate, put back the `membership.pro` check at the top of `planner/page.tsx`.

**The form answers as you change it.** A plan appears on arrival from sensible defaults, and each change re-plans. It is still a GET form, with a button for people without JavaScript.

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

## Staff and review

**Roles live on the user row; `ADMIN_EMAILS` bootstraps the first admins.** Listed emails are treated as admin on every request. Promote curators with `npx tsx scripts/set-role.ts <email> curator`. Curators review suggestions, corrections, and claims; only admins issue partner keys.

**Staff pages answer 404 to members without the role.** Signed-out visitors are sent to sign in. Every page and every server action checks the role again; the admin layout only draws the tabs. `/admin` is disallowed in robots.txt and noindex.

**Publishing a suggestion is one transaction.** The place is inserted (with a unique slug in its city) and the submission closed together; a second curator acting on the same suggestion gets "already reviewed". Corrections are applied by editing the listing in a form prefilled with its current values, or marked done without changes, or the listing is taken down.

**Contributors hear back.** The submission receipt promised a reply, so publishing, correcting, and rejecting each email the contributor when they left an address. Emails go out after the response, and a failed email never undoes the review.

## Business claims

**Claiming is free and changes facts, never order.** A claimant proposes hours, cost band, prices, website, and accessibility. A curator ticks which of those to apply. Approval sets `claimedBy` and the ticked fields only. It never touches `isPick` or `lastVerifiedAt`, both ranking inputs; `tests/unit/ranking-integrity.test.ts` fails if claims or partner code mention them.

**Verification is by a person, helped by one signal.** If the claimant signed in with an email at the listing's website domain (subdomains included, free mail providers never), the claim says so. Otherwise the curator calls the listed number. Claims are rate limited to 10 per member per day.

**Listings show "Details confirmed by the people who run it."** once claimed, and offer "Run this place? Claim it" until then. The $29 Presence tier is described as coming later and is not built.

## Partners

**Keys are shown once and stored as SHA-256 hashes.** Format `cr_live_` plus 32 random characters; the first 12 are kept to tell keys apart. Revoking is immediate. `lastUsedAt` is written at most every five minutes per key, so the API does not write on every request.

**The API is read only.** `/api/v1/places`, `/api/v1/cities`, `/api/v1/events`, with scopes `places:read` and `events:read` (cities needs any valid key). Responses use the same order as the site and carry CC BY 4.0 attribution. Errors are JSON with a stable `code`: 400 `invalid_query`, 401 `missing_key` or `invalid_key`, 403 `missing_scope`, 429 `rate_limited` with `Retry-After` (1,000 requests per key per hour, in Postgres like the other limits). With the partner flag off, every endpoint is a 404.

**The embed is its own route group.** `/embed/[city]` renders with no header, footer, navigation, palette, or save dialog; those moved from the root layout into the site and app layouts. It sends `frame-ancestors *` while every other path keeps `frame-ancestors 'none'` and `X-Frame-Options: DENY`. Nothing on it changes state, and every link opens CityRoots in a new tab.

**Partners are invoiced by email.** No billing code; the page offers a mailto.

**Feature flags are deployment settings.** `FEATURE_PARTNERS` and `FEATURE_BUSINESS` gate `/partners`, `/embed`, the API, `/business`, the claim link, admin tabs, footer links, and sitemap entries. Static pages read them at build time, so set them for both build and runtime (Vercel does). CI builds and tests with both on so every gated surface is checked.

**Code samples use the sans face.** The spec bans monospace; a base rule sets `pre`, `code`, and `textarea` to the sans font.

## Guides

**Metadata in TypeScript, bodies in MDX.** `@next/mdx` has no frontmatter, so each guide's metadata (title, city, budget, season, dates, stops) lives in `src/content/guides/index.ts`. It is type-checked and validated with Zod in a unit test, and the body is `src/content/guides/<slug>.mdx`. The test also checks that the `<Stop>` elements in each body match the metadata, in order.

**Every stop is a live listing.** `<Stop slug="...">` renders the listing's cost, price note, neighbourhood, and hours from the database, followed by the guide's own words. If a listing disappears, the guide build fails instead of shipping a gap. The prose only states what the listing data supports; hours and prices are never retyped in the body.

**Six guides, one per major city at launch:** Waterloo, Newmarket, Richmond Hill, Markham, Oakville, and Vaughan, the six cities with the most listings plus the spec's own Waterloo example. Free guides contain no dollar amounts (tested).

**The index is a single-column list**, not a card grid, to stay consistent with the home page change away from three-card layouts. Thumbnails carry their photo credits like every other photo.

## Link previews

**Generated OG images for the site, every city, every guide, and every place.** City and guide cards use the city photo under a dark scrim with the title in Fraunces. Places have no photos yet, so their card uses the category colour, the cost, and the category. Fonts are static TTF cuts of Fraunces and Instrument Sans (OFL) in `assets/fonts`, because the image renderer cannot read the woff2 files `next/font` serves.

**Cities and guides are rendered at build; places on first request.** That keeps 400 image renders out of the build. Place images are cached after first render (an empty `generateStaticParams` with a one-day revalidate).

## Analytics

**Plausible, and only when configured.** No cookies and no personal data; nothing loads unless `PLAUSIBLE_DOMAIN` is set, so local, preview, and test runs make no analytics requests (tested). The script URL is configurable for a proxy or self-hosting.

**Goals are CSS classes, not code.** Plausible's tagged events count clicks on buttons and links marked with `goal(...)`, so goals add no JavaScript. Saving a place is the one goal fired from code, after the server confirms it. Goal names live in `src/lib/analytics.ts`; none carries free text, emails, or names. The About page has a short privacy section saying so.

## Performance (current state)

Lighthouse, mobile, simulated Slow 4G with 4x CPU slowdown, median of 3 runs, after Phase 5:

| Page     | Perf | LCP    | TBT    | Script |
| -------- | ---- | ------ | ------ | ------ |
| Home     | 97   | 2.56 s | 82 ms  | 166 KB |
| City     | 96   | 2.33 s | 165 ms | 166 KB |
| About    | 93   | 2.80 s | 195 ms | 171 KB |
| Explore  | 90   | 2.89 s | 245 ms | 184 KB |
| Events   | 91   | 2.94 s | 213 ms | 170 KB |
| Submit   | 96   | 2.71 s | 172 ms | 171 KB |
| Pricing  | 95   | 2.78 s | 85 ms  | 166 KB |
| Planner  | 94   | 2.78 s | 169 ms | 174 KB |
| Partners | 96   | 2.56 s | 130 ms | 174 KB |
| Business | 96   | 2.78 s | 85 ms  | 166 KB |
| Guides   | 93   | 2.86 s | 170 ms | 170 KB |
| A guide  | 93   | 2.86 s | 171 ms | 170 KB |

Accessibility, best practices, and SEO are 100 on every page, and CLS is 0. The spec's acceptance bar (90+ in all four categories on mobile marketing pages, explorer accessibility 95+) is met everywhere.

**The 2.0 s LCP budget is measured on regular 4G, not Slow 4G (owner decision, 2026-11-02).** The spec says "LCP under 2.0s on 4G"; Lighthouse's default mobile profile is Slow 4G. Observed LCP on these pages is 0.1 to 0.2 s; the figures above come from Lighthouse's simulation, which charges every script downloaded before the paint to LCP even though none block rendering. Under Slow 4G (1.6 Mbps, 150 ms RTT, 4x CPU), React and the Next runtime alone cost about 2.5 s. CI now simulates 9 Mbps (a common regular-4G figure) and keeps the 150 ms RTT and 4x CPU slowdown, so only bandwidth changed. Every other budget is unchanged. Local medians on that profile: LCP 1.27 to 1.98 s, with Explore closest to the limit at 1.98 s. The table above is the Slow 4G baseline.

Phase 5 changes:

- The command palette builds its two explorer links by hand instead of importing the explorer's URL parsers, which took nuqs out of every page's JavaScript (shared app chunk 14.5 KB to 12 KB).
- Inlining CSS (`experimental.inlineCss`) was tried and reverted. It removed the render-blocking stylesheet but delayed the hero image enough that home LCP went from 2.56 s to 3.59 s.
- Images use Next 16's `preload` instead of the deprecated `priority`. The guides index preloads its first thumbnail, which is the LCP on phones (3.40 s to 2.86 s).
- TBT on Explore and Events sits around the 200 ms budget and crosses it in some runs; noise on this machine is about 100 ms.

On this machine (WSL), run-to-run noise is about 100 ms of TBT and 500 ms of LCP, so compare medians, not single runs.

**Lighthouse runs on Linux Chromium.** Under WSL, Lighthouse otherwise launches Windows Chrome and fails. Point `CHROME_PATH` at Playwright's Chromium, and run it from outside the repo: it can leave `C:\Users\...` profile folders in the working directory, which break Turbopack. CI on Ubuntu needs nothing extra.

## Who it is for (November 2026 research)

Budget-conscious locals, newcomers, families, and young adults looking to meet people. The job: "what can I do today or this weekend, near me, and what will it cost?"

- Two-thirds of Canadians plan to cut spending, and 44% plan to spend less on entertainment ([TD/Harris, 2026](https://www.bnnbloomberg.ca/business/2026/01/13/td-report-says-two-thirds-of-canadians-surveyed-plan-to-cut-spending-this-year/)). So cost is the first thing on every card and free is one tap away.
- 89% want events that connect them to a community, and 74% say in-person matters more now (Eventbrite 2026 Social Study). So Meet people is a top-level category.
- Only 4% buy tickets in the week of an event, but 64% of Gen Z find things to do on social feeds (Eventbrite TRNDS 2025, via ArtsHub). So Events opens on the soonest day with something on, and plans share by link.
- Free museum nights and swim times are scattered across conflicting blog lists. Neighbours like GetMovingTO and the Toronto Event Generator newsletter each cover one slice. One checked source, with the cost on every line, is the gap.

## Toronto data

**Built by a script, not by hand.** `npm run data:toronto` combines a hand-written list (`scripts/seed-data/toronto-curated.json`, 50 places with facts checked by hand) with City of Toronto open data: festivals and events, museums, places of interest, music venues, cultural hotspots, libraries, parks, and community centres. It dedupes by name within 120 m, assigns official neighbourhoods by point in polygon, checks links, and drops virtual events and tickets starting above $50. Hand-written entries win.

**Exact dates.** Feed events carry `events.occurrences`, a list of showings. Seeding retires feed events that have left the source. Other cities keep their month-level seasonal dates, and those never appear under a specific day.

**Explore lists places; Events lists dates.** A plain browse hides dated events, or hundreds of one-off shows would bury the places. Searching, or filtering to events, brings them back. The partner API is unaffected.

**Helplines do not open a list of things to do.** On a plain browse they follow the other free listings. Free listings still all come first. They are unchanged in search and in their categories.

## Design direction (November 2026)

**Solid surfaces replace glass.** A warm neutral background, white cards with a hairline border, and a soft shadow. Translucent cards on a gradient looked muddy and reduced contrast. Glass stays only over photos and the map.

**Cards read in one order:** kind of thing, name, what it is, then cost and where. "Free" is the one coloured label; "Local pick" stays secondary.

## Filters and menus

- **Filters are compact dropdown menus, not rows of chips.** The explorer had four rows of chips in a sticky card that filled most of a phone screen and overflowed it. Each facet (City, Cost, Type, Category, Sort) is now one button that opens a small menu; the filter row is no longer sticky. "Picks only" and "Free only" stay one-tap toggles.
- **Menus are `<details>` and `<summary>`**, so they open, and every option is still a link, without JavaScript. With JavaScript, Escape closes a menu and returns focus to its button, a click outside closes it, and picking a single choice (a city, a sort order) closes it. Menus in one row share a `name`, so only one is open at a time. Multi-select menus stay open so several options can be ticked, and each has its own Clear link.
- **On phones a menu spans the filter row**, so it never runs off the screen. From `sm` up it sits under its own button.
- **The planner's city step is a native select.** Ten cities as chips was a wall of buttons; a select is the standard control for one choice from many.

## Privacy and terms

- **`/privacy` and `/terms` describe what the code actually does**: the tables in the schema, the processors in `LAUNCH.md`, 30-day database sessions, hashed IPs for rate limits, cookieless Plausible, and the cascade rules above for account deletion. There is no self-serve account deletion yet, so the policy asks people to email. If any of those behaviours change, update the policy in the same change.
- They are linked from the footer, the sign-in page, and the about page's privacy summary.

## Deployment

- **The database is Neon, installed through the Vercel Marketplace** (free plan, `iad1` to sit next to Vercel's default function region). The integration sets `DATABASE_URL` for the project. Builds need it: city pages and OG images read the database while prerendering.
- **Without `NEXT_PUBLIC_SITE_URL`, the site URL falls back to Vercel's own URLs**: the production domain on production, the deployment URL on previews. Set `NEXT_PUBLIC_SITE_URL=https://cityroots.ca` once the domain points at Vercel.
- **`esbuild` is a direct dev dependency** so vite's optional peer (`^0.27 || ^0.28`) resolves at the root. Without it, npm 11 writes a lockfile that npm 10's `npm ci` in CI rejects.

## Deferred, by phase

- **Phase 2 (delivered):** map, command palette, optimistic filters, submit flow, hours parsing and "Open now", event calendar, rate limiting. The review screen for the moderation queue moves to Phase 4 with the rest of admin.
- **Phase 3 (delivered):** collections, Day Planner, shareable plans, Stripe subscription with webhooks and the customer portal, `/pricing`. Still to come for Pro: event reminders, the "new near you" digest, and saved collections in the command palette.
- **Phase 4 (delivered):** admin review queue, business claims, partner keys and API, embed widget, `/partners`, `/business`. Still to come: the Presence tier, and a business dashboard for editing details directly.
- **Phase 5 (delivered):** six guides, OG images for the site, cities, guides, and places, Plausible analytics with goals, a launch checklist (`LAUNCH.md`), and performance work. Open: place photography, and Pro event reminders and digests.

## Place preview

Cards open a panel over the page instead of leaving it, because people compare several places and lost their spot in the list each time. The URL gets `?preview=<id>` (`place` is taken by the map), so Back closes it and a reload keeps it. It is `pushState` rather than an intercepting route so the list's pathname and filters never change underneath it. Cards stay real links to `/places/<id>`: new tabs, search engines, and no-JavaScript visitors get the full page, and Share in the panel copies that address too. The panel carries what you need to decide; tips, similar places, accessibility, and corrections stay on the full page. The command palette still goes to the full page, because a search is a choice already made.

## Every city's data (November 2026)

**A listing stays only if a real source backs it.** An audit of the 400 hand-written listings outside Toronto found 37 dead links, 35 domains that do not resolve, and many places with no trace anywhere, including mental health services. A listing now needs a live page that names it, or an official dataset. Those that failed are in `scripts/seed-data/retired.json`, with the reason. Seeding hides them rather than deleting them, so saved items keep their record.

**Two layers, like Toronto.** `scripts/seed-data/curated/` holds the checked listings, and is the file to edit by hand. `scripts/seed-data/cities/` is generated by `npm run data:cities`, so do not edit it directly.

**Sources.** Events come from public library calendars (Communico for Burlington, Oakville, Waterloo, and Cambridge; BiblioCommons for Markham and Richmond Hill; Newmarket's and Vaughan's own pages), Explore Waterloo for the Waterloo Region cities, and the Town of Newmarket and City of Markham pages. Facilities come from York Region's directory and from Statistics Canada's 2020-21 databases, kept only when the municipality's own page still names the facility. OpenStreetMap was used to fact-check only, never imported, because of its share-alike licence.

**We do not get around blocks.** calendar.kitchener.ca, events.waterloo.ca, vaughan.ca, and kpl.org refuse automated requests, so their calendars are not used. That is why Vaughan has no municipal listings and Kitchener's events come from Explore Waterloo. Most of these calendars are public but undocumented, so an adapter can break, or a source can object. If one does, remove it. One failing calendar does not stop the others.

**Event text is written by us.** Descriptions are templated from the facts and link back. The source's prose is not copied.

**Variety caps.** 70 events a city, one showing of each title before repeats, and 15 family programs. Without them, a library's storytimes fill the calendar.

**"Source checked" replaces "Details checked".** The date means the linked page was read that day and still names the place. It does not mean a person confirmed every detail. Clock hours are kept only if the page shows those same times.

**A closed place comes out.** The McMichael is closed until 2029, so it is retired and the Vaughan guide says so.

**One guide per city.** Burlington, Kitchener, Cambridge, and Toronto now have guides. A unit test fails if a guide stops at a place that is no longer listed.

## Colour (November 2026)

**Category colours come from one rule.** All ten share one OKLCH lightness per theme (0.49 light, 0.80 dark) and differ only in hue, so none shouts over another. `tests/unit/palette.test.ts` enforces AA contrast in both themes, the shared lightness, 24 degrees between categories, and 14 degrees from the colours reserved for free, local pick, and danger.

## Layout and consistency (November 2026)

The owner asked for a site that is consistent and does not read as machine-made. These rules hold across pages; change the shared piece, not one page.

**One page frame.** Header, footer, and every page use `page-frame` (1200px, the same side padding), so all left edges line up. There used to be eight different widths. Long text and forms add `reading`, which limits the measure but stays on the same left edge instead of centring. The map view uses the same frame.

**One type scale.** Serif for page titles and section headings, sans for everything inside them. `text-display` is only for a title on a photo; every other page opens with `page-title`.

**Three corners.** `rounded-control` (8px) for anything you press or type in, `rounded-card` (12px) for surfaces, `--radius-modal` (16px) for sheets. Full circles are only for dots and progress bars.

**Events are always a schedule row, never a scrolling card.** `EventRow` is the only event display, and it uses a container query: where sits under the title in a narrow space and gets its own column in a wide one. Nothing on the site scrolls sideways out of view.

**Boxes only where they earn it.** Place cards stay cards because they hold several facts and a save button. Events, categories, and guides are ruled lists. Cost is plain text instead of a pill, and category icons have no tinted tile: the card names the category in words.

**Cities are in alphabetical order.** They were ordered by listing count, which put Toronto first everywhere; every city matters equally here.

**No hover lift or photo zoom.** Cards answer with a border and shadow, ruled rows with an underline. Glass stays only over the map and on the mobile results sheet, as "Design direction" already said.

**Copy.** Vague praise was removed from listings ("genuinely", "world-class", "one of the most..."). Specific, checkable claims stayed. Superlatives need a fact behind them.

## Ergonomics and friction (November 2026)

Measured on a 390px phone and at 1280px before changing anything.

**One name per thing.** The nav says what the page's title says: "Things to do" and "What's on". Categories always use their full name with their icon, never a short name or a colour dot. "Free" is the same word on Explore and Events, and "Clear filters" is the one word for clearing.

**Explore loads more only when asked.** Automatic loading kept pushing the footer away, 24 cards at a time. The button says how far along you are.

**One search box on a page.** Explore's own box filters what you see, so the header's search steps aside there. Ctrl K still opens it.

**A label on every card is no label.** "Local pick" is hidden when every card shown is a pick, which is the whole first page of the default order. The default sort is called "Free first" until there is a search to match.

**The plan comes first in the Planner.** Changing a setting on a phone used to update a list below the fold. The header's picker is the one city control, as on Explore (the form gets a city field only without JavaScript), and interests are collapsed. Removing a stop can be undone, and the page says that edits are not kept without Pro.

**44px to tap, without bigger controls.** `touch-target` extends the tappable area of chips, small buttons, and footer links with a pseudo-element, so spacing and looks stay the same.

**Guide links and the logo do not prefetch.** The two-column list put ten links in view, and their route code pushed `/guides` over the script budget. The logo is on every page, so prefetching it added the home page's 8 KB everywhere.

**The map sits above the page.** It is `z-10`. At `z-0`, any positioned element later in the page paints over it, and `touch-target` links in the footer did.

**Counts match where the link goes.** A city's "See all" and free counts, and the count on its card, leave out events, because Explore's default view does. The full total still appears where the text says listings.

**A menu says what it did.** An open filter menu covers the results on a phone, so multi-select menus end with "Show 12 places", which closes them.

**One choice lights one control.** The Free toggle does not also light Budget. Budget still shows Free as ticked inside the menu.

**An empty search gets search advice.** With only a search on, the page suggests a broader word. In a city, it also offers "Search all cities".

**Undo keeps later edits.** It puts the stop back rather than restoring a snapshot. A toast with something to undo stays for 8 seconds, not 4.

**Shared pieces.** `page-top` is the space above a title, `Notice` confirms what just happened, `BackLink` goes back up, and `iconButtonClasses` is every icon-only control at one size. "See" is the one verb for going to something.

## Volunteering (November 2026)

**A category, not a new kind of listing.** "Volunteer" is an eleventh category, so it appears in the Category menu, the home and city lists, search, and the submit form without new screens. Listings are `kind: program`, so they appear among free things to do.

**Not in the Planner.** Almost every role needs signing up ahead, often with references or checks, so it cannot be a stop in a day planned on the spot.

**The same source rule.** Each listing was read on its own live page on 2026-11-06, and its details come from that page. Left out: Volunteer Toronto, whose site refuses automated requests, so it could not be checked; Mackenzie Health, whose portal says applications are closed until March 2027; and Richmond Hill Food Bank, whose page shows no readable text. `innfromthecold.org` does not mention Newmarket on the pages checked, so it was left out too.

**Listings point at organizations, not single openings.** Openings change weekly and we have no feed, so a listing says what kinds of roles exist and links to the live list. No start dates or "urgently needed" claims.

**Colour.** Hue 140 is the only gap left that keeps 24 degrees from other categories and 14 from Free's green, so it sits close to Free. It appears only on a small icon.

**Deploy before seeding.** A category row the running code does not know makes `categoryMeta` throw, so the code has to go live before production is seeded.

## Finished events and category looks (November 2026)

The owner asked for finished events to leave the site and for each category to stop looking cookie cutter. This replaces two earlier rules: that category colour is only a small indicator, and that every place is shown as the same card.

**A finished event leaves everywhere, at once.** `notFinished` used to apply only to events with `occurrences`, so a curated event could outlive its dates in search and on its own page, and counts ignored it entirely. Now any event past `end_at` is out of lists, search, the map, the sitemap, Saved, its own page, and every count. It is hidden by the query, not deleted, so no job has to run on time for it to go. A seed marks dropped feed events `rejected`, and moves a yearly event's row to its next date, which brings it back.

**Events with no date stay.** Six listings have only a season note ("Annual summer event"). Nothing says they are over, so they stay, and a poster says what the note says.

**The weekly refresh is still the owner's switch.** It skips itself without a `DATABASE_URL` repository secret. Without it, nothing clutters, but new events stop arriving and yearly events stay hidden after they end, until someone seeds by hand.

**Each category has a form that suits what people want from it**, chosen from the data it has. No category has photos, so none of them lean on one. Get moving is signposts, led by where. Calm and support is one quiet column with the phone number in reach. Meet people is a notice board. Money help is a directory led by what you get. Arts is wall labels. Music is a lineup of large names. Food is a menu with dotted leaders. Cafes lead with the one thing worth knowing. Thrift is grouped by neighbourhood, so you can visit a few at once. Volunteer ticks off what you would do. Festivals are posters led by the date, soonest first within each cost band, so "Free first" stays true.

**Still `/explore?cat=`, not separate pages.** Filters, shared links, and working without JavaScript all stay. One category gets its look; a mix stays as cards, which now carry their category's colour and, for things you go and see, the serif. The map's narrow list also stays as cards. All of it is server-rendered, because Explore has about 1 KB of script budget left.

**Thrift groups sort by name.** Within a group the chosen sort still applies, but a neighbourhood's place on the page does not change with it.

## Palette and type (November 2026)

The owner asked for a new palette, fonts, and theme, without naming a direction. This is the direction chosen, and it is easy to change because it all lives in tokens.

**A community paper, not a lifestyle template.** Cream paper, forest green, and Fraunces is a very common template look, which the owner's brief warns against. The paper is now a cool white and the ink a blue-black.

**Lake blue is the brand, so green means only Free.** The old brand green sat beside Free's green and blurred what green meant. Free, Local pick, and danger keep their colours.

**Schibsted Grotesk for text, Newsreader for headlines.** Schibsted was drawn for a news publisher and stays clear at small sizes. Newsreader has a real italic, which the Arts and Cafes looks use, and an optical size axis, so it holds up from labels to page titles.

**Category colours keep their hues and gain chroma,** since they now cover large areas. `tests/unit/palette.test.ts` still holds them to one lightness per theme, the hue gaps, and AA.

**The theme still follows the device.** A manual light and dark switch needs client script, and Explore has about 1 KB of budget left.

**No site-wide tabular numbers.** Schibsted Grotesk's tabular setting also widens commas, periods, and colons, which put visible gaps before punctuation in all running text.

## Home page first glance (November 2026)

The owner said the site felt claustrophobic and its point was not clear at first glance. The home page hero was a darkened photo with a headline and nothing that said what CityRoots is. Now:

- The hero sits on the page's own paper: headline, one plain sentence saying what the site is (live counts, hand-checked, no ads), and the "Show me..." sentence in accent underlines. The photo is shown at full colour beside it instead of under a scrim.
- A note pinned to the photo lists three real free events coming up, so the first screen shows the idea working rather than describing it.
- Categories come second, each with its colour, icon, and one-line lede (shared with the category pages), on a solid band so the page has rhythm.
- More air everywhere: `PageSection` spacing went from 3.5rem to 4rem/6rem, and the footer gap grew. The home week list shows six rows, not eight.
- Feature flags are read at build time, so local Playwright runs need `FEATURE_PARTNERS=true FEATURE_BUSINESS=true` on the build too, as in CI.

## Home page modelled on an editorial city-portal layout (November 2026)

The owner shared a reference layout (a city portal shot) and asked for the home page to be similar. It follows that layout, using CityRoots' own name, content and photos:

- Warm `sand` hero band with the hero sentence, a small "10 Ontario cities, no ads" label, a landscape photo fading in at the bottom left, and three overlapping city photo cards. Which cities appear rotates daily, so no city always leads.
- Intro paragraph beside a large heading, then four fact cards. These are real counts (places, free share, cities, events this week), each with a line saying what it means. The owner's earlier "no vanity stats" brief is met by keeping them true and explained.
- Categories as photo cards with three real places each (`listCategorySamples`, picks first, otherwise rotating daily). The eleven category photos are from Wikimedia Commons, credited in `scripts/seed-data/photo-credits.json`.
- Cities in a white panel over a full-bleed photo, with a rotating "Today's city" card.
- This week as ticket rows on sand, guides as a 2x2 list with round photos, and the sample day as a dark card beside the plan.
- Site footer is dark in both themes, with a suggest-a-place card, link columns, and a large wordmark.
- The rounded "see all" links (`PillLink`) and round arrows (`CircleArrow`) come from the reference. Use them for section-level moves, not as status badges.
