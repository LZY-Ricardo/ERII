import { requireDb } from "@/src/lib/db";

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return JSON.stringify({ invalid_payload: true });
  }
}

export async function createSyncJob({
  provider,
  sourceRef,
  eventType,
  payload,
  dbClient,
}) {
  const db = dbClient ?? requireDb();

  const result = await db.sql`
    INSERT INTO content_sync_jobs (provider, source_ref, event_type, status, payload)
    VALUES (${provider}, ${sourceRef}, ${eventType}, 'pending', ${safeJsonStringify(payload)}::jsonb)
    RETURNING id
  `;

  return Number(result.rows[0]?.id);
}

export async function markSyncJobRunning({ jobId, dbClient }) {
  const db = dbClient ?? requireDb();
  await db.sql`
    UPDATE content_sync_jobs
    SET status = 'running', started_at = NOW()
    WHERE id = ${jobId}
  `;
}

export async function markSyncJobSuccess({ jobId, payload, dbClient }) {
  const db = dbClient ?? requireDb();
  await db.sql`
    UPDATE content_sync_jobs
    SET status = 'success', payload = ${safeJsonStringify(payload)}::jsonb, finished_at = NOW()
    WHERE id = ${jobId}
  `;
}

export async function markSyncJobSkipped({ jobId, payload, dbClient }) {
  const db = dbClient ?? requireDb();
  await db.sql`
    UPDATE content_sync_jobs
    SET status = 'skipped', payload = ${safeJsonStringify(payload)}::jsonb, finished_at = NOW()
    WHERE id = ${jobId}
  `;
}

export async function markSyncJobFailed({ jobId, errorMessage, payload, dbClient }) {
  const db = dbClient ?? requireDb();
  await db.sql`
    UPDATE content_sync_jobs
    SET
      status = 'failed',
      error_message = ${String(errorMessage ?? "").slice(0, 4000)},
      payload = ${safeJsonStringify(payload)}::jsonb,
      finished_at = NOW()
    WHERE id = ${jobId}
  `;
}

