import { requireDb } from "@/src/lib/db";
import { createEditToken, hashToken } from "@/src/lib/commentSecurity";

const COMMENT_STATUS_APPROVED = "approved";
const MAX_CONTENT_LENGTH = 5000;
const MAX_NAME_LENGTH = 48;
const MAX_LINK_LENGTH = 255;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function isMissingCommentsTableError(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  return code === "42P01" && message.includes('relation "comments" does not exist');
}

function isMissingCommentVotesTableError(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  return code === "42P01" && message.includes('relation "comment_votes" does not exist');
}

function isMissingCommentEditHistoryTableError(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  return code === "42P01" && message.includes('relation "comment_edit_history" does not exist');
}

function getDbSafe() {
  try {
    return requireDb();
  } catch {
    return null;
  }
}

function normalizeSlug(value) {
  return String(value ?? "").trim();
}

function normalizeName(value) {
  return String(value ?? "").trim().slice(0, MAX_NAME_LENGTH);
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeLink(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.slice(0, MAX_LINK_LENGTH);
}

function normalizeContent(value) {
  const content = String(value ?? "").trim();
  return content.slice(0, MAX_CONTENT_LENGTH);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainToHtml(value) {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value == null) return fallback;
  const text = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(text)) return true;
  if (["0", "false", "no", "off"].includes(text)) return false;
  return fallback;
}

function validateBaseInput(raw, options = {}) {
  const allowEmptyContent = Boolean(options.allowEmptyContent);
  const slug = normalizeSlug(raw?.slug);
  const name = normalizeName(raw?.authorName);
  const email = normalizeEmail(raw?.authorEmail);
  const link = normalizeLink(raw?.authorLink);
  const content = normalizeContent(raw?.content);
  const useMarkdown = toBoolean(raw?.useMarkdown, true);
  const isPrivate = toBoolean(raw?.isPrivate, false);
  const mailNotice = toBoolean(raw?.mailNotice, false);

  if (!slug) return { ok: false, error: "文章标识缺失。" };
  if (!name) return { ok: false, error: "昵称不能为空。" };
  if (!content && !allowEmptyContent) return { ok: false, error: "评论内容不能为空。" };
  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, error: "邮箱格式错误。" };
  }
  if (link && !/^https?:\/\//i.test(link)) {
    return { ok: false, error: "网站格式错误（需以 http(s):// 开头）。" };
  }

  return {
    ok: true,
    value: {
      slug,
      name,
      email,
      link,
      content,
      useMarkdown,
      isPrivate,
      mailNotice,
    },
  };
}

function mapDbCommentRow(row, ownerTokenMap) {
  const idText = String(row.id);
  const viewerToken = ownerTokenMap?.[idText];
  const isOwner = Boolean(viewerToken && hashToken(viewerToken) === row.edit_token_hash);
  const isPrivate = Boolean(row.is_private);
  const isMaskedPrivate = isPrivate && !isOwner;

  const contentRaw = isMaskedPrivate
    ? "此评论为私密评论，仅发送者和博主可见。"
    : String(row.content_raw ?? "");
  const contentHtml = isMaskedPrivate
    ? plainToHtml(contentRaw)
    : String(row.content_html ?? plainToHtml(contentRaw));

  return {
    id: Number(row.id),
    postSlug: row.post_slug,
    parentId: row.parent_id == null ? null : Number(row.parent_id),
    authorName: row.author_name,
    authorLink: row.author_link ?? "",
    contentRaw,
    contentHtml,
    useMarkdown: isMaskedPrivate ? false : Boolean(row.use_markdown),
    isPrivate,
    isMaskedPrivate,
    mailNotice: Boolean(row.mail_notice),
    status: row.status,
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
    editedAt: formatDateTime(row.edited_at),
    editCount: Number(row.edit_count ?? 0),
    voteCount: Number(row.vote_count ?? 0),
    canEdit: isOwner,
    canViewHistory: isOwner || !isPrivate,
    children: [],
  };
}

function sortByCreatedAsc(a, b) {
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  return aTime - bTime;
}

function sortByCreatedDesc(a, b) {
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  return bTime - aTime;
}

function buildCommentTree(rows) {
  const map = new Map();
  for (const row of rows) {
    map.set(row.id, row);
  }

  const roots = [];
  for (const row of rows) {
    if (row.parentId == null || !map.has(row.parentId)) {
      roots.push(row);
      continue;
    }
    map.get(row.parentId).children.push(row);
  }

  const dfsSort = (node) => {
    node.children.sort(sortByCreatedAsc);
    for (const child of node.children) dfsSort(child);
  };
  for (const root of roots) dfsSort(root);

  roots.sort(sortByCreatedDesc);
  return roots;
}

function flattenIds(nodes, out = []) {
  for (const node of nodes) {
    out.push(node.id);
    if (node.children.length) flattenIds(node.children, out);
  }
  return out;
}

export async function listCommentsByPostSlug({
  slug,
  ownerTokenMap = {},
  page = 1,
  pageSize = 20,
}) {
  const safeSlug = normalizeSlug(slug);
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const db = getDbSafe();
  if (!db) {
    return {
      comments: [],
      totalTopLevel: 0,
      page: safePage,
      pageSize: safePageSize,
      hasMore: false,
    };
  }

  let result;
  try {
    result = await db.sql`
      SELECT
        c.*,
        COALESCE(v.vote_count, 0)::int AS vote_count
      FROM comments c
      LEFT JOIN (
        SELECT comment_id, COUNT(*)::int AS vote_count
        FROM comment_votes
        GROUP BY comment_id
      ) v ON v.comment_id = c.id
      WHERE c.post_slug = ${safeSlug} AND c.status = ${COMMENT_STATUS_APPROVED}
      ORDER BY c.created_at ASC
    `;
  } catch (error) {
    if (isMissingCommentsTableError(error)) {
      return {
        comments: [],
        totalTopLevel: 0,
        page: safePage,
        pageSize: safePageSize,
        hasMore: false,
      };
    }
    if (!isMissingCommentVotesTableError(error)) throw error;

    result = await db.sql`
      SELECT
        c.*,
        0::int AS vote_count
      FROM comments c
      WHERE c.post_slug = ${safeSlug} AND c.status = ${COMMENT_STATUS_APPROVED}
      ORDER BY c.created_at ASC
    `;
  }

  const rows = result.rows.map((row) => mapDbCommentRow(row, ownerTokenMap));
  const roots = buildCommentTree(rows);

  const totalTopLevel = roots.length;
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize;
  const pagedRoots = roots.slice(from, to);

  return {
    comments: pagedRoots,
    totalTopLevel,
    page: safePage,
    pageSize: safePageSize,
    hasMore: to < totalTopLevel,
  };
}

export async function createComment({
  slug,
  parentId,
  authorName,
  authorEmail,
  authorLink,
  content,
  useMarkdown,
  isPrivate,
  mailNotice,
  ip,
  userAgent,
}) {
  const validated = validateBaseInput({
    slug,
    authorName,
    authorEmail,
    authorLink,
    content,
    useMarkdown,
    isPrivate,
    mailNotice,
  });
  if (!validated.ok) return validated;

  const db = getDbSafe();
  if (!db) {
    return { ok: false, error: "数据库未配置，无法发送评论。" };
  }
  const payload = validated.value;
  const normalizedParentId =
    Number.isFinite(Number(parentId)) && Number(parentId) > 0 ? Number(parentId) : null;

  if (normalizedParentId != null) {
    let parentResult;
    try {
      parentResult = await db.sql`
        SELECT id
        FROM comments
        WHERE id = ${normalizedParentId}
        AND post_slug = ${payload.slug}
        AND status = ${COMMENT_STATUS_APPROVED}
        LIMIT 1
      `;
    } catch (error) {
      if (!isMissingCommentsTableError(error)) throw error;
      return { ok: false, error: "评论数据表不存在，请先执行最新 schema。" };
    }
    if (!parentResult.rows[0]) {
      return { ok: false, error: "回复目标不存在或不可用。" };
    }
  }

  const editToken = createEditToken();
  const editTokenHash = hashToken(editToken);
  const authorEmailHash = hashToken(payload.email);

  let inserted;
  try {
    inserted = await db.sql`
      INSERT INTO comments (
        post_slug, parent_id, author_name, author_email, author_email_hash, author_link,
        content_raw, content_html, use_markdown, is_private, mail_notice,
        status, edit_token_hash, ip, user_agent
      )
      VALUES (
        ${payload.slug},
        ${normalizedParentId},
        ${payload.name},
        ${payload.email},
        ${authorEmailHash},
        ${payload.link || null},
        ${payload.content},
        ${plainToHtml(payload.content)},
        ${payload.useMarkdown},
        ${payload.isPrivate},
        ${payload.mailNotice},
        ${COMMENT_STATUS_APPROVED},
        ${editTokenHash},
        ${ip || null},
        ${userAgent || null}
      )
      RETURNING *
    `;
  } catch (error) {
    if (!isMissingCommentsTableError(error)) throw error;
    return { ok: false, error: "评论数据表不存在，请先执行最新 schema。" };
  }

  return {
    ok: true,
    comment: mapDbCommentRow(inserted.rows[0], { [String(inserted.rows[0].id)]: editToken }),
    editToken,
  };
}

export async function editComment({
  commentId,
  editToken,
  content,
  useMarkdown,
  ip,
  userAgent,
}) {
  const normalizedContent = normalizeContent(content);
  if (!normalizedContent) {
    return { ok: false, error: "评论内容不能为空。" };
  }
  if (!editToken || String(editToken).trim().length < 16) {
    return { ok: false, error: "编辑凭据无效，请使用原浏览器操作。" };
  }

  const normalizedId = Number(commentId);
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return { ok: false, error: "评论 ID 无效。" };
  }

  const db = getDbSafe();
  if (!db) {
    return { ok: false, error: "数据库未配置，无法编辑评论。" };
  }
  const tokenHash = hashToken(editToken);
  const markdownValue = toBoolean(useMarkdown, true);

  let currentResult;
  try {
    currentResult = await db.sql`
      SELECT *
      FROM comments
      WHERE id = ${normalizedId}
        AND status = ${COMMENT_STATUS_APPROVED}
      LIMIT 1
    `;
  } catch (error) {
    if (!isMissingCommentsTableError(error)) throw error;
    return { ok: false, error: "评论数据表不存在，请先执行最新 schema。" };
  }
  const current = currentResult.rows[0];
  if (!current) {
    return { ok: false, error: "评论不存在或不可编辑。" };
  }
  if (current.edit_token_hash !== tokenHash) {
    return { ok: false, error: "无权限编辑该评论。" };
  }

  try {
    await db.sql`
      INSERT INTO comment_edit_history (
        comment_id, content_raw, content_html, editor_ip, editor_user_agent
      )
      VALUES (
        ${normalizedId},
        ${String(current.content_raw ?? "")},
        ${String(current.content_html ?? "")},
        ${ip || null},
        ${userAgent || null}
      )
    `;
  } catch (error) {
    if (!isMissingCommentEditHistoryTableError(error)) throw error;
  }

  const updatedResult = await db.sql`
    UPDATE comments
    SET
      content_raw = ${normalizedContent},
      content_html = ${plainToHtml(normalizedContent)},
      use_markdown = ${markdownValue},
      edit_count = COALESCE(edit_count, 0) + 1,
      edited_at = NOW(),
      updated_at = NOW(),
      user_agent = ${userAgent || null}
    WHERE id = ${normalizedId}
    RETURNING *
  `;

  const updated = updatedResult.rows[0];
  return {
    ok: true,
    comment: mapDbCommentRow(updated, { [String(updated.id)]: editToken }),
  };
}

export async function listCommentEditHistory({ commentId, editToken }) {
  const normalizedId = Number(commentId);
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return { ok: false, error: "评论 ID 无效。" };
  }

  const db = getDbSafe();
  if (!db) {
    return { ok: false, error: "数据库未配置，无法查看编辑历史。" };
  }
  let commentResult;
  try {
    commentResult = await db.sql`
      SELECT id, is_private, edit_token_hash
      FROM comments
      WHERE id = ${normalizedId}
      LIMIT 1
    `;
  } catch (error) {
    if (!isMissingCommentsTableError(error)) throw error;
    return { ok: false, error: "评论数据表不存在，请先执行最新 schema。" };
  }
  const comment = commentResult.rows[0];
  if (!comment) {
    return { ok: false, error: "评论不存在。" };
  }

  const isPrivate = Boolean(comment.is_private);
  const isOwner = Boolean(editToken && hashToken(editToken) === comment.edit_token_hash);
  if (isPrivate && !isOwner) {
    return { ok: false, error: "无权限查看该评论编辑历史。" };
  }

  let historyResult;
  try {
    historyResult = await db.sql`
      SELECT id, content_raw, content_html, edited_at
      FROM comment_edit_history
      WHERE comment_id = ${normalizedId}
      ORDER BY edited_at DESC, id DESC
      LIMIT 40
    `;
  } catch (error) {
    if (!isMissingCommentEditHistoryTableError(error)) throw error;
    historyResult = { rows: [] };
  }

  const history = historyResult.rows.map((row) => ({
    id: Number(row.id),
    contentRaw: String(row.content_raw ?? ""),
    contentHtml: String(row.content_html ?? ""),
    editedAt: formatDateTime(row.edited_at),
  }));

  return { ok: true, history };
}

export async function upvoteComment({ commentId, fingerprintHash }) {
  const normalizedId = Number(commentId);
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return { ok: false, error: "评论 ID 无效。" };
  }
  if (!fingerprintHash) {
    return { ok: false, error: "投票指纹缺失。" };
  }

  const db = getDbSafe();
  if (!db) {
    return { ok: false, error: "数据库未配置，无法点赞。" };
  }

  try {
    await db.sql`
      INSERT INTO comment_votes (comment_id, fingerprint_hash)
      VALUES (${normalizedId}, ${fingerprintHash})
      ON CONFLICT (comment_id, fingerprint_hash) DO NOTHING
    `;
  } catch (error) {
    if (isMissingCommentVotesTableError(error) || isMissingCommentsTableError(error)) {
      return { ok: false, error: "评论点赞数据表不存在，请先执行最新 schema。" };
    }
    throw error;
  }

  const countResult = await db.sql`
    SELECT COUNT(*)::int AS vote_count
    FROM comment_votes
    WHERE comment_id = ${normalizedId}
  `;
  const votedResult = await db.sql`
    SELECT 1
    FROM comment_votes
    WHERE comment_id = ${normalizedId}
      AND fingerprint_hash = ${fingerprintHash}
    LIMIT 1
  `;

  return {
    ok: true,
    voteCount: Number(countResult.rows[0]?.vote_count ?? 0),
    voted: Boolean(votedResult.rows[0]),
  };
}

export async function getCommentCountByPostSlug(slug) {
  const safeSlug = normalizeSlug(slug);
  if (!safeSlug) return 0;
  const db = getDbSafe();
  if (!db) return 0;
  try {
    const result = await db.sql`
      SELECT COUNT(*)::int AS comment_count
      FROM comments
      WHERE post_slug = ${safeSlug}
        AND status = ${COMMENT_STATUS_APPROVED}
    `;
    return Number(result.rows[0]?.comment_count ?? 0);
  } catch (error) {
    if (!isMissingCommentsTableError(error)) throw error;
    return 0;
  }
}

export function countFlattenedComments(topLevelComments) {
  return flattenIds(Array.isArray(topLevelComments) ? topLevelComments : []).length;
}
