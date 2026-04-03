# ERII Blog

Personal blog project, currently using a **DB-only content architecture**:

- Public content source: Postgres `posts(status='published')`
- Writing entry point: `/write` (token‑based session authentication)
- Media assets: Vercel Blob
- Content format: dual mode with `mdx` + `blocks`
- Sync capabilities: manual Notion sync + Webhook sync

## Tech Stack

- Next.js 16.1.1 (App Router)
- React 19.2.3
- Tailwind CSS 4
- `next-mdx-remote` / `react-markdown`
- `@vercel/postgres` / `@vercel/blob`

## Quick Start

1. Install```bash
corepack enable
pnpm install
```2. Configure environment variables (locally recommended to place them in `.env.local`)

- `DATABASE_URL` (or `POSTGRES_URL`)
- `BLOB_READ_WRITE_TOKEN`
- `ERII_WRITE_PASSWORD`
- `ERII_WRITE_SESSION_SECRET`
- Optional Notion:
  - `NOTION_TOKEN`
  - `NOTION_API_VERSION` (default `2022-06-28`)
  - `ERII_NOTION_WEBHOOK_SECRET`

3. Initialize the database (first time)

- Run: `db/schema.sql`
- Or run migration: `db/migrations/20260304_content_platform.sql`

4. Start```bash
pnpm dev
```Default port: `http://localhost:3239`

## Common Scripts

- `pnpm dev`: local development
- `pnpm lint`: ESLint checking
- `pnpm build`: production build
- `pnpm start`: start production service

## Content and Writing Capabilities

- `/write` supports:
  - login/logout sessions
  - draft saving
  - publishing (triggers revalidate)
  - article list retrieval and loading
  - image/cover upload to Blob
  - MDX / Blocks dual editing mode
- Versioning capabilities:
  - `post_revisions` snapshot records
  - support restoration by version
- Notion sync:
  - Manual: `POST /api/write/sync/notion`
  - Webhook: `POST /api/write/sync/notion/webhook`

## Key Endpoints (Writing Side)

- `GET/POST/DELETE /api/write/session`
- `GET/POST /api/write/posts`
- `GET /api/write/posts/[slug]`
- `POST /api/write/posts/publish`
- `GET/POST /api/write/posts/[slug]/revisions`
- `POST /api/write/assets`
- `POST /api/write/sync/notion`
- `POST /api/write/sync/notion/webhook`
- `GET /api/health`

## Documentation

- Documentation navigation: `docs/README.md`
- Project status report: `docs/Project-Feature-and-Progress-Report.md`
- Runbook: `docs/ContentPlatform-Runbook.md`
- Content platform implementation plan: `docs/ContentPlatform-Implementation-Plan.md`