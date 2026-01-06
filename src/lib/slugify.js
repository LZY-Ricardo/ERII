export function slugify(value) {
  const input = String(value ?? "").trim().toLowerCase();
  if (!input) return "";

  const normalized = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const slug = normalized
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug;
}

export function generateFallbackSlug(prefix = "draft") {
  return `${prefix}-${Date.now().toString(36)}`;
}

