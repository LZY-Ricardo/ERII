# ERII Blog: /write Direct Publishing to Vercel – Pending Plan

> Goal: Publish the edited content from `/write` “directly and display it on the live site”.
>
> Status: **MVP implemented** (Postgres + Blob + draft/publish + password‑session authentication + public read path migration). This document retains the solution history and adds “current implementation and usage steps”.
>
> > Update: The current project has converged the public reading content source to a single **Postgres (`published`)** source, and has deprecated/removed the fallback reading logic for `content/*.mdx`; any references to `content/` below are for historical reference only.

---

## 0. Confirmed Choices (Can Serve as Baseline for Future Implementations)

- Deployment: Vercel
- Primary content DB: Vercel Postgres (stores article body/metadata/status)
- Media assets: Vercel Blob (stores images/videos/etc. binary, returns publicly accessible URLs)
- Release latency: near‑second visibility, allows caching + revalidation (proactively `revalidateTag/revalidatePath` after publishing)
- Permission requirement: **Publishing / uploading / editing is only allowed for yourself** (must enforce authentication; a “hidden entry” is not a security mechanism)
- Drafts: needed (`draft/published`), with support for **private draft preview / continued editing**
- Authentication: password session (server validates password → issues **signed HttpOnly Cookie**)

## 0.5 Current Implementation (Implemented)

### Key Files
- Database schema: `db/schema.sql`
- DB connection: `src/lib/db.js`
- Write authentication: `src/lib/writeAuth.js`, `src/lib/writeGuard.js`
- Health check: `app/api/health/route.js`
- Write APIs:
  - `app/api/write/session/route.js` (login / logout / session)
  - `app/api/write/posts/route.js` (draft upsert + draft list)
  - `app/api/write/posts/publish/route.js` (publish upsert)
  - `app/api/write/posts/[slug]/route.js` (read draft/published for editor loading)
  - `app/api/write/assets/route.js` (upload to Blob and backfill URL)
- Public read path: `src/lib/posts.js` (DB only: `published`)
- Editor: `src/components/WritePage.jsx` (login / draft / publish / upload / export)

### Initialization Steps (What you need to do manually the first time)
1) **Create tables**: Vercel Dashboard → Storage → Postgres → Query, execute `db/schema.sql`
2) **Configure environment variables (Vercel + local)**
   - Postgres: `DATABASE_URL`
   - Blob: `BLOB_READ_WRITE_TOKEN`
   - Write authentication: `ERII_WRITE_PASSWORD`, `ERII_WRITE_SESSION_SECRET`
3) **Validate connectivity**: after starting locally, access `GET /api/health` (`db.ok=true` and `blob.ok=true`)
4) **Login and publish**: open `/write` → enter password in settings panel → draft / submit / upload works

## 1. Current State and Constraints

### Current State (Code Level)
- Article source: **DB (`published`) single source**
- Reading logic: `src/lib/posts.js` (DB only + `unstable_cache`, refreshed after publishing via `revalidateTag/revalidatePath`)
- Display page: `app/blog/[slug]/page.jsx` (server reads `getPostData(slug)`)
- Editor: `src/components/WritePage.jsx` (password‑session login; draft/publish writes to DB; image upload to Blob; still supports download/copy MDX)

### Key Constraints (Vercel)
- The file system in Vercel/Serverless runtime **cannot be written persistently**.
- Therefore: production cannot rely on “writing local files” as a publishing/storage solution.

**Conclusion**: To achieve “online publishing and display”, a **persistent publishing channel** must be chosen:
1) Write to a Git repo (visible after triggering a redeploy)  
2) Write to external persistent storage (visible without redeploy)

## 2. Decision Questions (Answer First, Then Choose)

**Confirmed**  
- **Latency**: near‑second visibility, allows caching / revalidation  
- **Content form**: DB/object storage (Postgres + Blob)  
- **Drafts**: `draft/published` + private draft preview / continued editing  
- **Authentication**: password session (HttpOnly Cookie)  
- **Security model**: only self can write (publish / upload / draft read requires auth)

**To be confirmed (will affect implementation scope)**  
- Need draft list/search/delete/recycle bin (cross‑device retrieval & management)?  
- Need version history/rollback/scheduled publishing (higher complexity)?

## 3. Option A (Recommended Starting Point): Publish = Submit to GitHub `content/`, Vercel Auto‑Redeploys

### Suitable Scenarios
- You already drive the whole site with `content/*.mdx`;  
- You accept waiting for a build/deploy after publishing;  
- You want “minimal changes” while preserving Git history.

### Core Flow
1) `/write` frontend sends `fullMdx` to `POST /api/publish`  
2) Server route handler calls the GitHub Contents API:  
   - create/update `content/<slug>.mdx`  
   - commit to the specified branch (usually `main`)  
3) Vercel watches repo changes → auto build/deploy  
4) After deployment, the new article automatically appears at `/blog/<slug>` and in the homepage list

### What Needs to Be Done (Implementation Highlights)
- Add route handler: `app/api/publish/route.js`  
- Server‑side env vars (visible only to server):  
  - `GITHUB_TOKEN` (PAT or GitHub App token)  
  - `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_BRANCH`  
  - `ERII_WRITE_PASSWORD` (or separate `WRITE_TOKEN` to protect the publish endpoint)  
- Slug strategy (suggest predictable & stable):  
  - generated from title/date (return final slug on publish)  
  - handle duplicate slugs (suffix `-2`, etc.)  
- Security:  
  - Token never sent to client  
  - API must authenticate + rate‑limit (at least limit origin/password/simple rate limit)  
  - Validate `slug` to prevent path traversal (allow only `[a-z0-9-]`, etc.)  
- UX:  
  - After publish show “submitted, waiting for Vercel deployment…”  
  - Optional: return commit SHA or expected article URL

### Pros & Cons
**Pros**  
- Minimal changes: hardly any modifications to `src/lib/posts.js` or existing pages  
- Content naturally versionable, auditable, PR‑able  

**Cons**  
- Not second‑level: publishing ≈ triggering a deploy  
- Requires GitHub Token and endpoint authentication (security mandatory)

## 4. Option B (Recommended for the Long Term): Publish = Write to Persistent Storage, Pages Read from Storage (Achievable Second‑Level Visibility)

### Suitable Scenarios
- You want “publish and immediate visibility”  
- You don’t mind moving the content source from `content/` to external storage

### Sub‑options

#### B1. Vercel Postgres (Most Structured‑Friendly)
Recommended as the primary store for **articles and metadata**.

**Suggested schema (minimum viable, favor KISS/YAGNI)**
- `posts`
  - `id`: uuid (PK)  
  - `slug`: text (unique, used in URL; suggest `YYYY-MM-DD-<shortId>` to avoid transliteration complexity)  
  - `title`: text  
  - `description`: text (nullable)  
  - `date`: date (for sorting/display)  
  - `tags`: text[] (or jsonb)  
  - `cover_url`: text (nullable, from Blob)  
  - `content_md`: text (Markdown/MDX source)  
  - `status`: text (`draft` | `published`)  
  - `published_at`: timestamptz (nullable)  
  - `created_at` / `updated_at`: timestamptz  

*(Optional) `assets` for media metadata (not required but useful later for an asset library / reuse / deletion)*
- `assets`
  - `id`: uuid (PK)  
  - `blob_url`: text  
  - `pathname`: text (e.g. `images/<uuid>.png`)  
  - `content_type`: text  
  - `bytes`: int  
  - `created_at`: timestamptz  

**Caching & revalidation** (to meet “second‑level visibility + allow caching”)
- Read: use `unstable_cache` (or Next.js tag‑based data cache) and tag queries:  
  - List: `posts`  
  - Single: `post:${slug}`  
- Write/Publish: after success, call `revalidateTag("posts")`, `revalidateTag(\`post:${slug}\`)` (or `revalidatePath`)

#### B2. Vercel Blob + DB/KV (Better for Large Content)
Recommended as the primary store for **media assets** (images/videos/attachments).

**Editor UX improvements** (solving the pain of manually placing files in `public/`)  
- Editor provides “upload image” button → `POST /api/assets` uploads to Blob  
- API returns `url` → automatically insert into content: `![alt](${url})` or set as `cover_url`

*Note*: **Do not** store image binaries in Postgres (possible but hurts backup/migration/performance/CDN).

#### B3. Vercel KV (Redis)
- Can store small content or draft cache  
- Large content (long articles) may not be suitable as a long‑term primary store (depends on strategy & cost)

### B's API Draft (MVP Implemented, Current Path)

**Auth (self only)**
- `POST /api/write/session`: submit `ERII_WRITE_PASSWORD` (`{ password }`), on success issue **signed HttpOnly Cookie** (session)  
- `DELETE /api/write/session`: clear cookie  
- `GET /api/write/session`: query session status  

**Media upload (Blob)**
- `POST /api/write/assets`: upload file → write to Blob → return `{ url, blob }`  
  - Constraints: MIME whitelist (`image/*`, optional `video/*`), size limit, auth required  

**Article write (Postgres)**
- `GET /api/write/posts?status=draft|all`: draft list (session only)  
- `POST /api/write/posts`: draft upsert (returns `slug` for continued editing)  
- `POST /api/write/posts/publish`: publish upsert (returns `slug`; triggers `revalidateTag/revalidatePath`)  
- `GET /api/write/posts/:slug`: read draft/published (session only, for continued editing)  
- `POST /api/posts/:id/publish`: set to `published` + `published_at` + `revalidateTag`  

**Draft workflow (MVP suggestion)**
1) Enter `/write`: automatically create a draft or open “last draft”  
2) While editing: debounce `PATCH` save every N seconds or after idle  
3) Management: settings drawer offers “draft list / open / delete”  
4) Publish: on success redirect to `/blog/<slug>` and trigger `revalidateTag("posts")` + `revalidateTag(\`post:${slug}\`)`

### B's Page Modifications (Migrate from File Source to DB)
- `src/lib/posts.js`  
  - `getSortedPostsData()`: change to query Postgres (only `published`)  
  - `getPostData(slug)`: change to query Postgres by `slug` (only `published` or optionally support draft preview)  
- `app/blog/[slug]/page.jsx`: keep rendering structure, swap data source to DB  
- `app/page.jsx`, `app/blog/page.jsx`: lists also use DB  
- `/write` editor:  
  - Upload button calls `POST /api/assets`, backfills URL into body/cover field  
  - Publish button calls `POST /api/posts/:id/publish` (second‑level visibility)  

### Pros & Cons
**Pros**  
- Can achieve “second‑level publish & display”  
- No redeploy dependency  

**Cons**  
- Larger refactor: need to rewrite content reading chain and migrate existing `content/*.mdx`  
- Must handle backup, migration, cost, and permission management  

## 5. Option C (Optional): Integrate a Headless CMS (Sanity / Contentful etc.)

**Suitable scenarios**
- You prefer the CMS to handle the “content system” (editing, drafts, review, asset management, versioning, etc.)  
- The site side only handles rendering & display  

**Cons**
- Introduces an external system and learning curve; differs significantly from the current “file‑as‑content” approach  

## 6. Security & Risk Checklist (Consider Regardless of Choice)

1) **Write capability auth (self only)**: protect `/write` and all write endpoints (publish / save draft / upload Blob).  
   - Lightest recommendation: `ERII_WRITE_PASSWORD` (env var) + login returns HttpOnly Cookie (`SameSite=Strict`, `Secure`)  
   - Cookie suggestions:  
     - Name with `__Host-` prefix (e.g. `__Host-erii_session`), fixed `Path=/`  
     - Content is a **signed, verifiable** session (includes expiration), signed with `ERII_WRITE_SESSION_SECRET`  
     - Use constant‑time password comparison to avoid side‑channel leaks; add rate limiting / delay to login endpoint  
   - Middleware at Edge intercepts `/write` and `/api/*` (write) routes: unauthenticated requests get 401 or redirect  
   - API also validates `Origin` (prevent CSRF) and applies basic rate limiting (prevent brute‑force)  
2) **Input validation**  
   - Restrict `slug` charset, forbid `../`  
   - Limit body size to avoid abuse  
3) **MDX risk**  
   - Current display pages render MDX with `next-mdx-remote/rsc`; if you ever allow non‑self publishing, decide whether JSX/component capability is permitted  
4) **Rate limiting**  
   - Prevent brute‑force password attempts and API abuse  
5) **Cost risk**  
   - Blob uploads can be abused (must auth)  
   - Postgres and Blob have quotas and billing; recommend simple file‑size limits and MIME whitelists  

## 7. Recommended Path (Pragmatic)

You’ve indicated a preference for a “smooth writing experience + integrated media upload”, so the recommendation is to go straight with:

1) **Option B (Vercel Postgres + Vercel Blob)**: near‑second visibility, editor supports one‑click upload and link insertion;  
2) **Option A (GitHub commit)** as a fallback: enable when you need content stored as files with Git history.

## 8. (Todo) Implementation Checklist for the Next Real Build

- [ ] Draft management scope: list / open / delete / recycle bin needed?  
- [ ] Session strategy: cookie shape, signing method, expiration, `AUTH_SECRET` rotation policy  
- [ ] Choose: B (Postgres + Blob) as primary, A as fallback  
- [ ] Define: slug rules + conflict strategy  
- [ ] Define: authentication method (password session vs OAuth)  
- [ ] UI: publish button states, error messages, completion feedback  
- [ ] Cache: tag‑based cache + `revalidateTag/revalidatePath`

### MVP Implementation Order (Suggested)

1) **Base resources**  
   - Provision Postgres + Blob in the Vercel console, set environment variables for local/preview/production  

2) **Auth closure** (lock down write ability first)  
   - Implement `POST /api/auth/login`, `POST /api/auth/logout`  
   - Middleware protects `/write` and write APIs (publish / save / upload)  

3) **Media upload** (key UX)  
   - Implement `POST /api/assets`: upload → Blob → return URL (auto‑insert in editor)  

4) **Draft CRUD**  
   - Implement `POST /api/posts`, `GET/PATCH/DELETE /api/posts/:id`, `GET /api/posts?status=draft`  
   - Add “auto‑save (debounce) + draft list open” in editor  

5) **Publish & display**  
   - Implement `POST /api/posts/:id/publish` + `revalidateTag`  
   - Migrate `src/lib/posts.js` from `fs` to Postgres (initially read only `published`)  

6) **Migrate historic articles** (optional)  
   - Write a one‑off script to import existing `content/*.mdx` into Postgres, or use a short‑term dual‑source read (not recommended long‑term)