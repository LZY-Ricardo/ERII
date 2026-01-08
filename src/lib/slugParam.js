export function normalizeSlugParam(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // ignore decode errors; treat raw as-is
  }

  const slug = decoded.trim();
  if (!slug) return "";

  if (slug.length > 120) return "";
  if (slug === "." || slug === "..") return "";
  if (slug.includes("/") || slug.includes("\\") || slug.includes("\0")) return "";

  // Align with slugify(): latin letters/digits, hyphen, and CJK ideographs.
  // Also allow `_` for legacy/manual file slugs.
  if (!/^[a-z0-9\u4e00-\u9fff_-]+$/i.test(slug)) return "";

  return slug.toLowerCase();
}
