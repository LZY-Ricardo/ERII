export const MAX_FEATURED_PROJECTS = 3;
export const FEATURED_PROJECT_LIMIT_ERROR =
  `最多只能设置 ${MAX_FEATURED_PROJECTS} 个精选项目`;

export function shouldRejectFeaturedChange({
  featuredCount = 0,
  isCurrentFeatured = false,
  nextFeatured = false,
}) {
  if (!nextFeatured) return false;
  if (isCurrentFeatured) return false;
  return featuredCount >= MAX_FEATURED_PROJECTS;
}

export async function getFeaturedProjectLimitError(
  db,
  { projectId, nextFeatured = false } = {}
) {
  if (!nextFeatured) return null;

  const featuredCountResult = await db.sql`
    SELECT COUNT(*)::int AS count
    FROM projects
    WHERE featured = true
  `;
  const featuredCount = featuredCountResult.rows[0]?.count ?? 0;

  let isCurrentFeatured = false;
  if (projectId) {
    const currentProjectResult = await db.sql`
      SELECT featured
      FROM projects
      WHERE id = ${projectId}
      LIMIT 1
    `;
    isCurrentFeatured = currentProjectResult.rows[0]?.featured ?? false;
  }

  return shouldRejectFeaturedChange({
    featuredCount,
    isCurrentFeatured,
    nextFeatured,
  })
    ? FEATURED_PROJECT_LIMIT_ERROR
    : null;
}
