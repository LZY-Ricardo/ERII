# Public Site Performance Optimization Plan

## Status
Implementation in progress on `codex/optimize-public-site-performance`.

Completed:
- Removed avoidable initial `/api/projects`, `/api/music`, and comment-list requests from key public first views.
- Reduced public hydration by moving project cards to server-first markup and isolating image fallback state.
- Deferred floating prompts, music dock, comments, and GitHub trending fetches until idle, visibility, or direct user intent.
- Removed duplicate project collection reads on `/projects`.
- Avoided Spotify oEmbed cover lookups during `/music` server render.
- Moved navbar search/progress into a small client island while keeping nav links server-rendered.
- Moved right sidebar tab state, appearance controls, article catalog navigation, recent comment jumps, and trending timestamp state into scoped client islands.
- Added reduced-motion handling for continuous decorative animations.
- Replaced oversized local project cover PNGs with generated WebP variants and mapped old DB cover paths to optimized local assets at read time.
- Replaced the hidden `secret-trigger.gif` with a lighter animated WebP.

## Goal
Reduce public-page white-screen time, initial hydration work, avoidable API requests, and interaction latency while preserving the current Argon visual identity and content behavior.

## Baseline Evidence

### Build
Command:

```bash
pnpm build
```

Result:
- Build succeeds.
- `/`, `/about`, `/music`, `/resources`, `/sitemap.xml` are generated with 1 minute revalidation.
- `/blog`, `/blog/[slug]`, `/projects`, `/teamspeak`, and `/write` are dynamic.

### High-Risk Entry Points
- `app/layout.jsx` globally mounts `ToastProvider`, `SiteScrollbar`, Vercel Analytics, and Speed Insights.
- `src/components/argon/ArgonShell.jsx` always mounts:
  - `ArgonNavbar`
  - `ArgonLeftbar`
  - `ArgonRightbar`
  - `UnmarkFloatingPrompt`
  - `TimeThemePrompt`
  - `MusicDock`
- `src/components/argon/ArgonRightbar.jsx` fetches `/api/projects` on public non-article routes.
- `src/components/argon/MusicDock.jsx` fetches `/api/music` on mount.
- `app/projects/page.jsx` calls `getProjects({ focus })` and `getProjects()` separately.
- `src/components/ProjectCard.jsx` is a client component only to handle image fallback state.
- `app/music/page.jsx` may block render on Spotify oEmbed cover lookups.
- Large assets exist under `public/images/projects`, including `erii.png` above 2 MB.

## Principles
- Server-render content by default.
- Hydrate only user-facing interactions that need browser APIs.
- Defer optional widgets until intent, visibility, or idle.
- Remove duplicate data reads before adding abstractions.
- Preserve DOM class names when possible to avoid CSS churn.
- Verify every phase with build and browser checks.

## Target Outcomes
- Public first viewport renders without waiting for music, floating prompts, comments, or optional sidebar widgets.
- Fewer public initial client-side requests:
  - no automatic `/api/projects` from `ArgonRightbar`;
  - no automatic `/api/music` before music dock visibility or intent.
- `/projects` avoids duplicate project collection reads.
- Project cards no longer hydrate full cards for image fallback only.
- Oversized public images are compressed or replaced.
- Reduced-motion users do not get continuous decorative animations.

## Implementation Phases

### Phase 0: Baseline Capture

Files:
- Read only.

Actions:
1. Run `pnpm build`.
2. Save route table and largest chunks.
3. Save largest public asset list.
4. Start production server and capture public route screenshots.
5. Capture initial network request lists for `/`, `/blog`, `/projects`, and `/music`.

Commands:

```bash
pnpm build
Get-ChildItem ".next/static/chunks" -Recurse -File | Sort-Object Length -Descending | Select-Object -First 30
Get-ChildItem "public" -Recurse -File | Sort-Object Length -Descending | Select-Object -First 30
```

Acceptance:
- Baseline data exists before code changes.

### Phase 1: Public Shell Decomposition

Primary files:
- `src/components/argon/ArgonShell.jsx`
- `src/components/argon/ArgonNavbar.jsx`
- `src/components/argon/ArgonLeftbar.jsx`
- `src/components/argon/ArgonRightbar.jsx`
- `src/components/argon/MusicDock.jsx`
- `src/components/argon/UnmarkFloatingPrompt.jsx`
- `src/components/argon/TimeThemePrompt.jsx`
- `src/components/SiteScrollbar.jsx`
- `app/layout.jsx`

Plan:
1. Keep `ArgonShell` as the public composition boundary.
2. Extract static shell markup from interactive behavior.
3. Keep navigation links server-rendered.
4. Move nav search and scroll progress to a small client island.
5. Move sidebar panel state and appearance controls into route-scoped client islands.
6. Dynamically load `MusicDock`, `UnmarkFloatingPrompt`, and `TimeThemePrompt`.
7. Keep analytics and speed insights, but ensure they are not coupled to shell hydration.

Implementation notes:
- Preserve existing class names.
- Preserve storage keys from `src/lib/appearance.js`.
- Preserve custom event names:
  - `nh:open-panel`
  - `nh:set-appearance`
  - `nh:appearance-state`
- Avoid a broad rewrite of visual CSS.

Verification:
- `pnpm build`: passed after stopping the local preview process that was locking `.next/perf-server.err.log`.
- Browser check completed for `/` and `/projects`; broader smoke is tracked in Phase 5.
- Navbar search/progress island verified on `http://localhost:3240/blog?category=AI`: AI nav item is active, search expands, and scroll progress updates from `0%` to `99.9919%`.
- Right sidebar island split verified on `http://localhost:3240/blog?category=AI`: settings tab renders controls and content tab state remains interactive.

Rollback:
- Revert shell extraction commits only; no database or data migration involved.

### Phase 2: Data Fetch Optimization

Primary files:
- `src/components/argon/ArgonRightbar.jsx`
- `src/components/argon/MusicDock.jsx`
- `app/projects/page.jsx`
- `src/lib/projects.js`
- `app/blog/[slug]/page.jsx`
- `src/components/argon/ArgonCommentShell.jsx`
- `app/music/page.jsx`
- `src/lib/musicCatalog.js`
- `src/lib/music.js`

Plan:
1. Remove initial `/api/projects` fetch from `ArgonRightbar`.
2. If sidebar project links remain visible, pass server data from route or shell props.
3. In `/projects`, fetch one project collection and derive:
   - filtered projects;
   - total count;
   - focus label.
4. Delay comments until viewport visibility or hash intent.
5. Avoid blocking `/music` on external Spotify oEmbed requests:
   - prefer stored cover URL;
   - otherwise show stable fallback and resolve later;
   - do not block page response on external cover lookup.
6. Defer `/api/music` from `MusicDock` until dock is visible or user opens it.

Verification:
- Route table after `pnpm build`.
- Network tab on `/`, `/projects`, `/music`.
- Confirmed no initial `/api/projects` on `/` and `/projects`.
- Confirmed no initial `/api/music` before opening the music surface.
- Added lazy comment mounting so `/api/comments` is not requested until comments are near viewport or hash intent targets comments.
- Added lazy GitHub trending fetch so `/api/trending` waits for sidebar visibility plus idle time.
- Confirmed `/projects` renders from one project collection read and derives filters in memory.

Rollback:
- Revert data fetch commits.
- Since no schema changes are planned, rollback is file-only.

### Phase 3: Hydration Reduction For Cards

Primary files:
- `src/components/ProjectCard.jsx`
- Possible new small client component:
  - `src/components/ProjectCoverImage.jsx`

Plan:
1. Convert `ProjectCard` to a server component.
2. Keep link and text markup server-rendered.
3. If image error fallback is still required, isolate it to a tiny client component that only controls the image/fallback region.
4. Avoid passing functions or browser-only props through card lists.

Verification:
- Build manifests no longer show full `ProjectCard` as a direct client dependency for pages that only render cards.
- `/` and `/projects` cards render correctly.
- Broken cover URLs show fallback without breaking layout.

Rollback:
- Revert card component split.

### Phase 4: Asset And CSS Optimization

Primary files:
- `public/images/projects/**`
- `public/images/**`
- `app/globals.css`
- Components that reference affected assets.

Plan:
1. Compress large project images.
2. Replace oversized PNGs with WebP/AVIF where safe.
3. Replace animated GIF first-load usage with poster image or lighter format.
4. Add `prefers-reduced-motion` handling for continuous animations.
5. Reduce unnecessary repaint pressure from fixed decorative overlays where possible.
6. Keep media containers with stable dimensions.

Asset budget:
- Project cover source target: under 250 KB.
- Decorative background target: under 150 KB.
- Site icons target: under 50 KB.
- Larger assets require a documented reason.

Verification:
- Compare `public` asset size report before and after.
- Visual check on desktop and mobile.
- Confirm no layout shift caused by image dimension changes.

Current status:
- Reduced-motion CSS changes are implemented.
- Oversized local project covers were converted to WebP with width capped at 960px, and replaced PNGs were removed from `public/images/projects`.
- `public/images/secret-trigger.gif` was replaced by `public/images/secret-trigger.webp`, reducing the hidden animation from roughly 713 KB to 387 KB.

Rollback:
- Keep original assets available until visual QA passes.
- Revert asset references if any visual regression appears.

### Phase 5: Final QA

Commands:

```bash
pnpm build
pnpm test
```

Browser smoke routes:
- `/`
- `/blog`
- one valid `/blog/[slug]`
- `/projects`
- `/music`
- `/resources`
- `/about`
- `/teamspeak`

Checks:
- No blank first viewport.
- Navigation works.
- Search works.
- Theme controls work.
- Comments load when requested.
- Music dock/player loads after intended trigger.
- No incoherent text overlap.
- No critical console errors.

## Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Custom events break after island split | Theme/sidebar interactions may fail | Keep event names stable and verify each flow |
| Delayed widgets feel missing | Users may not see music/prompt immediately | Use stable placeholders or intent-based affordances |
| Card server conversion breaks image fallback | Broken cover UI | Isolate fallback into tiny client component |
| Asset compression changes visual quality | Brand feel degradation | Visual QA before replacing originals |
| Comments delayed too aggressively | Hash links to comments may feel broken | Load immediately when URL contains comment hash |

## Open Questions For Approval
1. Should the music dock be completely intent-loaded, or may it load during idle on desktop?
2. Should floating promotional prompts remain enabled by default after performance changes?
3. Are image replacements allowed to change file names, or should optimized files preserve existing paths?

## Proposed Definition Of Done
- OpenSpec change is approved and task status reflects implemented scope.
- `pnpm test` passes: 40 tests passed.
- `pnpm build` passes with the expected public route table.
- Browser smoke confirms public routes render without blank first view and critical interactions still work.
- Binary image compression is either approved and completed, or documented as a separate follow-up.
- Public route browser checks pass on desktop and mobile.
- Initial public route network requests are reduced for optional widgets.
- Oversized public assets are reduced or documented.
- Residual risks and follow-up work are recorded.
