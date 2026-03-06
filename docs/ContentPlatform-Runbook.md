# Content Platform Runbook

## 1. Apply Database Migration

Run the SQL in:

- `db/migrations/20260304_content_platform.sql`

This migration adds:

1. `posts` extended content fields (`content_format`, `content_json`, `render_body`, source metadata).
2. `post_revisions` for version snapshots.
3. `content_sync_jobs` for Notion sync history.
4. `assets` source tracking fields.

## 2. Required Environment Variables

Existing:

1. `DATABASE_URL` (or `POSTGRES_URL`)
2. `ERII_WRITE_PASSWORD`
3. `ERII_WRITE_SESSION_SECRET`
4. `BLOB_READ_WRITE_TOKEN` (for image upload/mirroring)

New (optional, for Notion sync):

1. `NOTION_TOKEN`
2. `NOTION_API_VERSION` (optional, default `2022-06-28`)
3. `ERII_NOTION_WEBHOOK_SECRET` (required only for webhook endpoint)

## 3. New/Updated API Endpoints

## 3.1 Save Draft (updated)

`POST /api/write/posts`

Supported payload fields now include:

1. `contentFormat` (`markdown|mdx|blocks`)
2. `contentJson` (JSON object/array/stringified JSON)
3. `renderBody`
4. `editorSource`
5. `sourceRef`
6. `sourceUpdatedAt`

Backward compatibility:

1. Sending only legacy `content` still works.

## 3.2 Publish (updated)

`POST /api/write/posts/publish`

Same new fields and compatibility behavior as draft save.

## 3.3 Read Single Post (updated)

`GET /api/write/posts/:slug`

Returns extended fields:

1. `contentFormat`
2. `contentJson`
3. `renderBody`
4. `editorSource`
5. `sourceRef`
6. `sourceUpdatedAt`
7. `latestRevisionId`

## 3.4 Revisions API (new)

1. `GET /api/write/posts/:slug/revisions?limit=30`
2. `POST /api/write/posts/:slug/revisions`

`POST` body:

```json
{
  "revisionId": 123,
  "status": "draft"
}
```

`status` can be `draft` or `published`.

## 3.5 Notion Sync API (new)

`POST /api/write/sync/notion`

Example payload:

```json
{
  "pageId": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "published",
  "mirrorAssets": true,
  "eventType": "manual_sync"
}
```

Behavior:

1. Pulls Notion page + blocks.
2. Converts blocks to MDX-compatible body.
3. Optionally mirrors remote Notion assets to Blob.
4. Upserts into `posts` and creates revision.
5. Writes sync execution state into `content_sync_jobs`.

## 3.6 Notion Webhook Sync (new)

`POST /api/write/sync/notion/webhook`

Auth:

1. Header: `x-erii-sync-secret: <ERII_NOTION_WEBHOOK_SECRET>`
2. Or query: `?secret=<ERII_NOTION_WEBHOOK_SECRET>`

Payload supports common fields:

1. `type`
2. `data.id` or `entity.id` as Notion page id

## 4. Rendering Behavior

Article rendering now prefers:

1. `render_body`
2. fallback to legacy `content`

This keeps old posts working while allowing structured/block pipelines.

## 4.1 `/write` Editor Modes

`/write` now supports two authoring modes:

1. `MDX` mode: existing plain markdown/MDX text editing workflow.
2. `BLOCKS` mode: visual block composer with paragraph, heading, quote, list, code, image, callout, embed, divider.
3. `BLOCKS` mode supports drag-and-drop reordering and one-click block templates.

Persistence behavior:

1. `MDX` mode writes `contentFormat=mdx` with text body.
2. `BLOCKS` mode writes `contentFormat=blocks`, `contentJson={ blocks: [...] }`, and generated `renderBody`.
3. Notion sync now stores content as internal `blocks` JSON for direct visual editing in `/write`.

## 5. Recommended Verification Checklist

1. Save a draft from `/write`, ensure `post_revisions` has new row.
2. Publish an article, ensure `/blog/:slug` renders normally.
3. Update same article again, verify `latest_revision_id` changes.
4. Restore an old revision via revisions API.
5. Run a Notion sync request and verify `content_sync_jobs` updates.
