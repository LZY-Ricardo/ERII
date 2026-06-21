# Progress

## 2026-03-15

- Read `openspec/AGENTS.md`, `openspec/project.md`
- Checked active changes: `add-admin-dashboard`, `edit-published-posts`
- Reviewed the current writing page, publishing API, and content service
- Confirmed the current state: published articles are not automatically taken offline, but unpublished edits do not go into the draft box
- Preparing a new OpenSpec proposal defining the behavior of “independent editing drafts for published articles”
- Created change: `openspec/changes/add-published-post-working-drafts/`
- Completed `openspec validate add-published-post-working-drafts --strict`
- Added `post_working_drafts` schema, migration file, working‑draft service layer, and save API
- Integrated auto‑save on the edit page, flush before closing, and cleanup of working drafts after publishing
- Updated the backend draft list to support displaying “published article revisions”
- Completed ESLint checks for related files
- Tried `pnpm build`; the build failed at the existing `/admin/comments` prerender issue, which was not introduced by this change
- Successfully executed `20260315_post_working_drafts.sql` via direct Neon connection; database table created
- Confirmed Neon MCP still has local OAuth credential issues, not fixed in this task

## 2026-03-16

- Read the `planning-with-files` documentation and added planning records for this proposal
- Ran `openspec list` / `openspec list --specs`, confirming there are unarchived changes in the repository but no formal specs yet
- Re‑examined `db/schema.sql`, `contentService.js`, and the Notion adapter / sync flow, confirming the Juejin import can reuse the existing content platform structure
- Verified on the server that public Juejin article pages return SSR HTML containing parsable `article_info` / `web_html_content`
- Created change directory: `openspec/changes/add-juejin-import/`
- Added `proposal.md`, `design.md`, `tasks.md`, and `specs/juejin-import/spec.md`
- Added verification of the public author page structure, confirming the presence of an article list and `cursor` pagination clues for batch import
- Shifting the proposal scope from “single‑article import” to “author‑homepage batch import as primary, single‑article import as secondary”
- Added dependencies: `cheerio`, `turndown`, `turndown-plugin-gfm`
- Implemented `src/lib/content/htmlToMarkdown.js`, `src/lib/content/adapters/juejinAdapter.js`, `src/lib/content/juejinImport.js`
- Added API: `app/api/write/import/juejin/route.js`
- Integrated a “Import Juejin” entry, batch/single mode toggle, and import result panel into `WritePageV2`
- Passed `pnpm lint` (retaining the repository’s existing three `<img>` warnings)
- Verified that the author‑page scanning and single‑article content extraction scripts run correctly
- Passed the compilation stage of `pnpm build`; the final build still fails on the repository’s existing `/admin/comments` Suspense issue
- Completed a real single‑article import test: `7548595210558767138` imported, published, and displayed successfully
- Completed a real small‑batch test: author `2936108653217451` scanned 3 articles, first‑time import succeeded
- Identified and fixed the “missing Juejin source metadata after publishing” issue
- Cleaned up duplicate test draft `打造属于你的前端沙盒-2`
- Re‑ran the same batch test, result: `scanned=3, imported=0, skipped=3, failed=0`
- Ran a full public‑article import for author `2936108653217451`; first full run result: `scanned=96, imported=85, skipped=3, failed=8`
- Re‑ran imports for the remaining failed articles, pinpointing the last failure as Juejin returning a JS challenge/waf page instead of article content
- Added automatic handling of Juejin `_wafchallengeid` challenges in `juejinAdapter`
- Successfully re‑imported the final failed article `7536319934545412139`
- Completed a full reconciliation: author `2936108653217451` now shows `scanned=96, imported=0, skipped=96, failed=0`