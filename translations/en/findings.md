# Findings

## 2026-03-15

- The `posts` table currently only holds a single status per article, with `published` and `draft` being mutually exclusive; the public site only reads `posts(status='published')`.
- `WritePageV2` currently auto‑saves drafts by calling `/api/write/posts`, which writes the target article directly as a `draft`.
- A fix has been applied for published articles: auto‑save is prevented from silently demoting `published` to `draft`.
- The new behavior users want is not “restoring the old logic,” but adding the ability to have an “editing draft for a published article.”
- Although `post_revisions` can store historical content, it lacks fields such as `slug` and `date`, making it unsuitable as the primary storage for recoverable editing drafts.
- A more reasonable approach is to add a separate editing‑draft storage and have `/write?slug=<published-slug>` load that draft preferentially.
- `pnpm build` has reached the page pre‑rendering stage, but fails because the existing `/admin/comments` in the repository lacks a `Suspense` wrapper around `useSearchParams()`. This is unrelated to the current changes.
- Neon MCP is currently unavailable; the error is OAuth `invalid_grant: Invalid refresh token`. Additionally, `codex mcp login neon` returns `No authorization support detected`.
- Using the Neon connection string in the project, we directly executed `db/migrations/20260315_post_working_drafts.sql` against the database and verified that `to_regclass('public.post_working_drafts') = post_working_drafts`.

## 2026-03-16

- The current repository’s content model already includes external source fields: `editor_source`, `source_ref`, `source_updated_at`.
- The constraint on `posts.editor_source` already includes `import`, so the Juejin import MVP does not need to add a new source enum first.
- `content_sync_jobs.provider` currently only allows `notion`. Reusing the sync‑job table directly would require an extra migration; the MVP is better served by a manual import API.
- By requesting a public Juejin article page from the server, we confirmed that the SSR HTML can be fetched directly, and the page contains `window.__NUXT__`, `article_info`, and `web_html_content`.
- This means that Juejin import can prioritize parsing the public page, without relying on logged‑in state, cookies, or bidirectional sync in the MVP.
- The imported body still needs to be converted from HTML to Markdown, as the current writing entry point is the ByteMD editor.
- If duplicate imports directly overwrite existing articles, published content may be unintentionally affected; the MVP should first deduplicate by `source_ref` and return the existing draft.
- Public Juejin author pages also return SSR HTML, showing the author’s article list, `article_id`, `post_article_count`, and public pagination links in the form `?cursor=<n>`.
- This makes “scanning all public articles from an author’s home page in bulk, then importing them one by one” a feasible main flow for the MVP.
- For the scenario “importing one’s own articles,” the public author page is sufficient; there is no need to integrate Juejin’s logged‑in state directly into the blog backend.
- In a Next/Turbopack environment, `turndown-plugin-gfm` needs to be imported as a namespace (`import * as …`); default import causes a build error.
- Bulk scanning validation passed: example author `312692511089736` successfully scanned 15 articles with `maxPages=2, maxArticles=15`.
- Single‑article extraction validation passed: example article `7250317954993897528` correctly extracts title, description, date, cover, and Markdown content snippet.
- The build has confirmed that the new code can pass the compilation stage; `pnpm build` still stops at the existing `/admin/comments` issue where `useSearchParams()` lacks a `Suspense` wrapper.
- To avoid writing real content before verification, no real import into production/development databases was performed this time.
- Real single‑article import test succeeded: article `7548595210558767138` was imported as a draft and successfully published.
- Real small‑batch test succeeded: author `2936108653217451` completed bulk scanning and import with `maxPages=1, maxArticles=3`.
- A critical issue was discovered during the process: when an imported article is published in the editor, `editorSource/sourceRef/sourceUpdatedAt` are lost, causing subsequent batch imports to fail deduplication.
- This was fixed by persisting source metadata in `WritePageV2`, and verification shows that re‑importing correctly results in `skipped`.
- To avoid retaining test junk data, the mistakenly created duplicate draft `打造属于你的前端沙盒-2` has been deleted.
- Full public article import verification completed: author `2936108653217451` scanned 96 public articles, all of which are now importable with no failures.
- The remaining failures in the first full import were not due to content conversion but because some articles returned ByteDance’s WAF `Please wait...` JavaScript challenge page.
- This challenge page contains `wci/cs` parameters; by solving the SHA‑256 nonce locally to generate a `_wafchallengeid` cookie, the content page can be fetched immediately afterward.
- After adding this handling in `fetchJuejinHtml`, the last originally‑failing article `7536319934545412139` was also successfully imported