# Design: Public Site Performance Optimization

## Context
The project is a Next.js 16 App Router blog with DB-only published content. The public UI uses an Argon shell that provides navigation, sidebars, theme controls, floating prompts, music dock, custom scrollbar, and analytics.

The current implementation favors a rich global experience, but many routes pay the same client-side cost even when users do not interact with those features. The goal is to keep the visual experience while reducing the amount of JavaScript, hydration, follow-up requests, and painting work required before the page becomes useful.

## Current Findings
- `pnpm build` succeeds.
- Build output shows `/`, `/about`, `/music`, `/resources`, `/sitemap.xml` as ISR/static-style routes with 1 minute revalidation, while `/blog`, `/blog/[slug]`, `/projects`, `/teamspeak`, and `/write` are dynamic.
- `app/layout.jsx` globally imports `ToastProvider`, `SiteScrollbar`, Vercel Analytics, and Speed Insights.
- `ArgonShell` always renders `ArgonNavbar`, `ArgonLeftbar`, `ArgonRightbar`, `UnmarkFloatingPrompt`, `TimeThemePrompt`, and `MusicDock`.
- The home page client reference manifest includes the global layout client chunk plus Argon shell client modules and `ProjectCard`.
- `ArgonRightbar` fetches `/api/projects` on non-article public routes.
- `MusicDock` fetches `/api/music` on mount on public routes except hidden prefixes and `/music`.
- `ProjectsPage` calls `getProjects({ focus })` and `getProjects()` separately.
- Several public images exceed a practical first-load budget, with `public/images/projects/erii.png` above 2 MB.
- `app/globals.css` contains multiple decorative fixed layers and continuous animations that should be reduced for motion-sensitive and low-power contexts.

## Goals
- Preserve public page layout and visual identity.
- Reduce first-load JavaScript for public pages by moving non-essential behavior out of the critical path.
- Reduce client-side follow-up API requests on initial load.
- Reduce repeated server-side data reads for project pages.
- Improve perceived responsiveness of navigation, sidebar controls, comments, and music interactions.
- Keep performance verification reproducible through build output and browser checks.

## Non-Goals
- No visual redesign.
- No database schema changes unless a later approved proposal explicitly requires them.
- No dependency upgrades as part of this change.
- No admin dashboard/write editor performance overhaul.

## Proposed Architecture
Use a layered public shell:

1. `ArgonShell` remains the public composition entry, but its default render path should be mostly server-rendered markup.
2. Interactive behavior should move into narrow client islands:
   - navigation search and scroll progress;
   - sidebar panel controls;
   - appearance controls;
   - article catalog active-heading tracking;
   - comments;
   - music dock;
   - floating prompts.
3. Non-critical islands should be dynamically imported and delayed until one of these conditions is true:
   - route explicitly needs it;
   - user interaction requests it;
   - browser is idle and the feature is non-blocking.
4. Route data should be fetched once per request where possible and passed down rather than refetched from the client.
5. Presentational components should be server components by default. Client state should be localized to the smallest element that genuinely needs browser APIs.

## Route Strategy

### Home `/`
- Keep ISR behavior.
- Render project cards and post cards as server-first markup.
- Defer sidebar widgets that are not visible or not required for first interaction.
- Avoid first-load `/api/projects` and `/api/music` requests unless the user opens the relevant widget.

### Blog Index `/blog`
- Keep filtering behavior.
- Avoid hydration of full post lists.
- Keep search URL-driven and server-rendered; only hydrate the search control.

### Blog Detail `/blog/[slug]`
- Preserve article metadata, MDX rendering, table of contents, comments, edit link, and share panel.
- Keep article content server-rendered.
- Delay comments until the comment section enters the viewport or the user navigates to `#comments`.
- Avoid fetching recent comment summaries if the sidebar is not rendered for the current viewport or route mode.

### Projects `/projects`
- Fetch the project collection once, then derive filtered list and counts in memory.
- Convert `ProjectCard` to server-first markup, with a tiny client fallback only if needed for image error handling.

### Music `/music`
- Avoid blocking page render on external Spotify oEmbed requests when stored cover URLs are missing.
- Prefer persisted cover URLs or a route-level cached resolver.
- Keep the embedded player mounted only after direct user intent.

## Bundle Strategy
- Keep layout-level client code minimal.
- Do not import feature-heavy client modules from shell components unless the route needs them.
- Use `next/dynamic` for non-critical client islands with stable skeleton markup.
- Preserve SSR for content and navigation links.
- Avoid turning list cards into client components for hover, image fallback, or simple link behavior.

## Data Strategy
- Use existing `unstable_cache` for published posts.
- Use route-level server data for project and sidebar content instead of client fetches when content is visible at render time.
- Use lazy client fetch only for optional widgets after user intent.
- Avoid duplicate database queries in a single route render.

## Asset Strategy
- Define source image budget:
  - public decorative/background images: target under 150 KB each.
  - project card covers: target under 250 KB each unless there is a documented reason.
  - animated GIFs: replace with poster plus optional video/WebP where possible.
- Prefer optimized image formats and fixed dimensions to avoid layout shift.
- Keep `next/image` optimization enabled unless the remote/source constraints require otherwise.

## CSS And Paint Strategy
- Gate continuous decorative animations behind `prefers-reduced-motion`.
- Reduce fixed full-viewport overlay complexity where it causes repaint pressure.
- Keep layout dimensions stable for nav, sidebars, cards, and media containers.
- Avoid adding explanatory UI copy while optimizing.

## Verification Strategy
- Run `pnpm build` and inspect the route table.
- Inspect public page client reference manifests for removed or delayed modules.
- Inspect `.next/static/chunks` for large shared chunks.
- Use browser verification on desktop and mobile widths for:
  - no blank first viewport;
  - navigation works before optional widgets load;
  - search works;
  - theme controls work;
  - comments load when requested;
  - music dock/player loads only after intended trigger;
  - no overlapping text or layout shift in primary flows.

## Risks
- Splitting client islands may accidentally break cross-component custom events.
- Delaying optional widgets may change when users see prompts or music controls.
- Changing card component boundaries may affect image fallback behavior.
- Reducing decorative CSS may alter perceived brand feel.

## Mitigations
- Keep event names and storage keys stable.
- Introduce changes in small phases with build/browser verification after each phase.
- Preserve DOM class names where possible to avoid broad CSS churn.
- Add focused unit tests for pure helpers and browser checks for visual/interaction flows.
