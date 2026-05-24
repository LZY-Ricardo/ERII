# Change: Optimize Public Site Performance

## Why
Public pages currently share a feature-rich Argon shell that mounts multiple client components, event listeners, and follow-up API requests on routes where most of that behavior is not required for first paint. Build output also shows large shared client chunks and several oversized visual assets, which increases white-screen risk and delays interaction readiness.

## What Changes
- Split public layout behavior into server-rendered shell structure plus route-scoped, lazily loaded client islands.
- Remove unnecessary first-load API requests from global sidebars and music widgets.
- Reduce repeated database reads on project listing routes.
- Convert presentational cards to server components where client state is not essential.
- Define image and CSS optimization rules for public pages.
- Add repeatable verification steps for route render mode, bundle size, first-load request count, and user-facing interaction behavior.

## Impact
- Affected specs: `public-site-performance`
- Affected public routes: `/`, `/blog`, `/blog/[slug]`, `/projects`, `/resources`, `/music`, `/about`, `/teamspeak`
- Affected code areas:
  - `app/layout.jsx`
  - `app/page.jsx`
  - `app/blog/page.jsx`
  - `app/blog/[slug]/page.jsx`
  - `app/projects/page.jsx`
  - `app/music/page.jsx`
  - `src/components/argon/*`
  - `src/components/ProjectCard.jsx`
  - `src/components/PostCard.jsx`
  - `src/lib/projects.js`
  - `public/images/**`
  - `app/globals.css`
- Non-goals:
  - Redesigning the visual identity.
  - Changing admin/write authentication flows.
  - Changing content storage architecture.
  - Removing analytics or speed insights unless they are replaced with equivalent observability.
