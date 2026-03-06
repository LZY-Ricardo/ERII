import {
  CONTENT_FORMATS,
  DEFAULT_CONTENT_FORMAT,
  normalizeContentFormat,
} from "@/src/lib/content/constants";

function escapeMdxText(value) {
  return String(value ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeBlocks(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.blocks)) return raw.blocks;
  return [];
}

function blockToMdx(block) {
  const type = String(block?.type ?? "").trim().toLowerCase();

  if (type === "heading") {
    const level = Math.max(1, Math.min(6, Number(block?.level || 2)));
    const text = escapeMdxText(block?.text ?? "");
    return `${"#".repeat(level)} ${text}`.trim();
  }

  if (type === "paragraph") {
    return escapeMdxText(block?.text ?? "");
  }

  if (type === "quote") {
    const text = escapeMdxText(block?.text ?? "");
    return `> ${text}`.trim();
  }

  if (type === "list") {
    const items = Array.isArray(block?.items) ? block.items : [];
    const ordered = Boolean(block?.ordered);
    if (!items.length) return "";
    return items
      .map((item, index) => {
        const text = escapeMdxText(item ?? "");
        return ordered ? `${index + 1}. ${text}` : `- ${text}`;
      })
      .join("\n");
  }

  if (type === "code") {
    const language = String(block?.language ?? "").trim();
    const code = String(block?.code ?? "");
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  if (type === "image") {
    const src = String(block?.src ?? "").trim();
    if (!src) return "";
    const alt = escapeAttr(block?.alt ?? "");
    const width = Number(block?.width);
    const widthAttr = Number.isFinite(width) ? ` width="${Math.round(width)}"` : "";
    const caption = String(block?.caption ?? "").trim();
    const imageTag = `<img src="${escapeAttr(src)}" alt="${alt}"${widthAttr} />`;
    return caption ? `${imageTag}\n\n*${escapeMdxText(caption)}*` : imageTag;
  }

  if (type === "divider") {
    return "---";
  }

  if (type === "callout") {
    const tone = String(block?.tone ?? "note").trim().toLowerCase();
    const text = escapeMdxText(block?.text ?? "");
    return `<blockquote data-callout="${escapeAttr(tone)}">${text}</blockquote>`;
  }

  if (type === "embed") {
    const url = String(block?.url ?? "").trim();
    if (!url) return "";
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noreferrer">${escapeAttr(
      block?.title ?? url
    )}</a>`;
  }

  return "";
}

export function blocksToMdx(rawBlocks) {
  const blocks = normalizeBlocks(rawBlocks);
  return blocks
    .map((block) => blockToMdx(block))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export function parseMaybeJson(value) {
  if (value == null || value === "") return null;
  if (typeof value === "object") return value;
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function buildRenderBody({
  contentFormat = DEFAULT_CONTENT_FORMAT,
  content = "",
  contentJson = null,
}) {
  const format = normalizeContentFormat(contentFormat);
  if (format === CONTENT_FORMATS.BLOCKS) {
    const rendered = blocksToMdx(contentJson);
    if (rendered) return rendered;
  }

  return String(content ?? "").trim();
}

