## 1. Baseline And Measurement
- [x] 1.1 Capture current `pnpm build` output and route render modes.
- [x] 1.2 Record current largest `.next/static/chunks` and largest `public/images` assets.
- [x] 1.3 Capture desktop and mobile browser screenshots for `/`, `/blog`, `/blog/[slug]`, `/projects`, and `/music`.
- [x] 1.4 Record initial public-route network requests for `/`, `/blog`, `/projects`, and `/music`.

## 2. Public Shell Decomposition
- [x] 2.1 Split always-rendered public shell markup from client-only behavior.
- [x] 2.2 Move navigation search/progress into a small client island.
- [x] 2.3 Move sidebar panel controls and appearance controls into scoped client islands.
- [x] 2.4 Dynamically load floating prompts and music dock outside the critical path.
- [x] 2.5 Verify public navigation and theme behavior after decomposition.

## 3. Data Fetch Optimization
- [x] 3.1 Remove `/api/projects` client fetch from `ArgonRightbar` initial load.
- [x] 3.2 Remove duplicate project database reads in `/projects`.
- [x] 3.3 Delay comment loading below the article first viewport.
- [x] 3.4 Avoid blocking `/music` render on external cover lookups.
- [x] 3.5 Verify route output and API behavior after each data change.

## 4. Component Hydration Reduction
- [x] 4.1 Convert `ProjectCard` to server-first markup.
- [x] 4.2 Keep image fallback behavior in the smallest possible client boundary, if still required.
- [x] 4.3 Confirm post/project list cards do not require full-card hydration.

## 5. Asset And CSS Optimization
- [x] 5.1 Compress or replace oversized public images.
- [x] 5.2 Add reduced-motion handling for decorative animations.
- [x] 5.3 Reduce unnecessary fixed overlay repaint pressure where possible.
- [x] 5.4 Verify layout stability across desktop and mobile breakpoints.

## 6. Final Verification
- [x] 6.1 Run `pnpm build`.
- [x] 6.2 Run `pnpm test`.
- [x] 6.3 Run browser smoke checks for public routes.
- [x] 6.4 Compare build artifacts and network request counts against baseline.
- [x] 6.5 Document residual risks and follow-up candidates.
