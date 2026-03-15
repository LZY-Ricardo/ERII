import { slugify } from "@/src/lib/slugify";

function normalizeHeadingText(rawText) {
  return String(rawText ?? "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/[*_~]+/g, "")
    .replace(/\{[^}]+\}$/g, "")
    .trim();
}

function createUniqueHeadingId(text, index, counters) {
  const baseSlug = slugify(text) || `section-${index + 1}`;
  const seenCount = (counters.get(baseSlug) ?? 0) + 1;
  counters.set(baseSlug, seenCount);
  return seenCount === 1 ? `section-${baseSlug}` : `section-${baseSlug}-${seenCount}`;
}

export function extractArticleHeadings(content, { maxItems = 12 } = {}) {
  const lines = String(content ?? "").split(/\r?\n/);
  const counters = new Map();
  const headings = [];
  let activeFence = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const fenceMatch = line.match(/^(`{3,}|~{3,})/);

    if (fenceMatch) {
      const fenceToken = fenceMatch[1][0];
      activeFence = activeFence === fenceToken ? "" : fenceToken;
      continue;
    }

    if (activeFence) continue;

    const match = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const level = match[1].length;
    const text = normalizeHeadingText(match[2]);
    if (!text) continue;

    headings.push({
      id: createUniqueHeadingId(text, headings.length, counters),
      text,
      level,
    });
  }

  return {
    allHeadings: headings,
    tocItems: headings.slice(0, maxItems),
  };
}

export function normalizeTocItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      if (typeof item === "string") {
        const text = item.trim();
        return {
          id: "",
          text,
          level: 2,
          index,
        };
      }

      const text = String(item?.text ?? item?.title ?? "").trim();
      const id = String(item?.id ?? "").trim();
      const levelValue = Number(item?.level);

      return {
        id,
        text,
        level: Number.isFinite(levelValue) ? Math.min(3, Math.max(1, levelValue)) : 2,
        index,
      };
    })
    .filter((item) => item.text);
}
