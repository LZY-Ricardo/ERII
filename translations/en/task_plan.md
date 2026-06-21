# Task Plan

## Goal

Implement that unpublished edits to a published article go into the drafts folder, without affecting the live published content; only after manual publishing is the blog content updated.

## Phases

- [complete] 1. Review the existing writing/publishing/draft data flow and constraints
- [complete] 2. Design an independent edit‑draft model and API for published articles
- [complete] 3. Write an OpenSpec change proposal and task list
- [complete] 4. Implement backend and frontend changes after proposal approval
- [in_progress] 5. Verify the full workflow of editing, closing, drafting, and republishing

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `openspec/specs/write-editor/spec.md` does not exist | 1 | Switch to reading the existing change description under `openspec/changes/`; the project currently has no archived specs |

## Notes

- The current repository has unarchived changes: `add-admin-dashboard`, `edit-published-posts`
- The current workspace contains user uncommitted changes; avoid touching unrelated files

## 2026-03-16 Current Task

### Goal

Create an OpenSpec proposal for “Importing Juejin articles into the blog”, with scope narrowed to the MVP of “Manually importing public articles as drafts”.

### Phases

- [complete] 1. Review the existing content platform, Notion sync pipeline, and OpenSpec constraints
- [complete] 2. Validate whether Juejin public article pages can be extracted for structured content on the server side
- [complete] 3. Write the `add-juejin-import` proposal, design, and task list
- [complete] 4. Run strict OpenSpec validation and compile conclusions
- [complete] 5. Implement Juejin adapter, import service, writing API, and `/write` entry point
- [complete] 6. Perform no‑side‑effect verification and organize remaining real import validation items
- [complete] 7. Complete a real single‑article import and small‑batch deduplication verification
- [complete] 8. Complete full import of public articles, handling Juejin risk‑control challenges and compatibility

### Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `openspec list --specs` returned `No specs found.` | 1 | Indicates that the current repository has no archived formal specs yet; this time directly add a capability delta under the changes directory. |

### Notes

- Juejin public article pages currently return SSR HTML directly, containing `window.__NUXT__`, `article_info`, and `web_html_content`.
- The `posts` table already supports `editor_source='import'`, `source_ref`, `source_updated_at`, sufficient for MVP source tagging.
- `content_sync_jobs.provider` currently only allows `notion`, so the MVP does not introduce a sync job table and uses the manual import API first.
- Juejin public author pages show article lists with `?cursor=<n>` pagination links, so the proposal should be upgraded to a “batch import public articles” primary workflow.
- The core code is implemented, but import writes to the real database have not been executed yet, to avoid contaminating existing article data before confirmation.
- Real database verification has been completed, confirming the deduplication pipeline works.
- Completed full import of 96 public articles for author `2936108653217451`; final review result: `skipped=96, failed=0`.