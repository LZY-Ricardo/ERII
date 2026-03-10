
const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "quote",
  "list",
  "code",
  "image",
  "divider",
  "callout",
  "embed",
]);

const BLOCK_TEMPLATES = [
  {
    id: "story-hero",
    label: "叙事开场",
    description: "包含标题、摘要和首图的开场结构。",
    blocks: [
      { type: "heading", level: 1, text: "写下你的标题" },
      { type: "paragraph", text: "用一句简短摘要概括这篇文章。" },
      { type: "image", src: "", alt: "", width: 980, caption: "首图" },
      { type: "callout", tone: "info", text: "背景信息或关键结论。" },
    ],
  },
  {
    id: "step-by-step",
    label: "教程流程",
    description: "适合操作指南类文章的实用结构。",
    blocks: [
      { type: "heading", level: 2, text: "目标" },
      { type: "paragraph", text: "读者将完成什么。" },
      { type: "heading", level: 2, text: "步骤" },
      { type: "list", ordered: true, items: ["步骤 1", "步骤 2", "步骤 3"] },
      { type: "code", language: "bash", code: "echo \"sample\"" },
    ],
  },
  {
    id: "case-breakdown",
    label: "案例拆解",
    description: "按问题、方案、结果展开，可附嵌入内容。",
    blocks: [
      { type: "heading", level: 2, text: "问题" },
      { type: "paragraph", text: "变更前最大的难点是什么。" },
      { type: "heading", level: 2, text: "方案" },
      { type: "paragraph", text: "做了哪些改变，为什么有效。" },
      { type: "embed", url: "https://", title: "参考链接或演示地址" },
      { type: "heading", level: 2, text: "结果" },
      { type: "callout", tone: "tip", text: "关键指标或结论。" },
    ],
  },
];

function createId() {
  return `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toType(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  return BLOCK_TYPES.has(raw) ? raw : "paragraph";
}

function toText(value, fallback = "") {
  const text = String(value ?? "");
  return text || fallback;
}

function toWidth(value, fallback = 500) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(80, Math.min(2400, Math.round(num)));
}

function toListItems(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function createBlock(type = "paragraph", partial = {}) {
  const resolvedType = toType(type);
  const id = String(partial?.id ?? "").trim() || createId();

  if (resolvedType === "heading") {
    const level = Number(partial?.level);
    return {
      id,
      type: "heading",
      level: Number.isFinite(level) ? Math.max(1, Math.min(6, Math.round(level))) : 2,
      text: toText(partial?.text),
    };
  }

  if (resolvedType === "quote") {
    return { id, type: "quote", text: toText(partial?.text) };
  }

  if (resolvedType === "list") {
    return {
      id,
      type: "list",
      ordered: Boolean(partial?.ordered),
      items: toListItems(partial?.items),
    };
  }

  if (resolvedType === "code") {
    return {
      id,
      type: "code",
      language: String(partial?.language ?? "").trim(),
      code: toText(partial?.code),
    };
  }

  if (resolvedType === "image") {
    return {
      id,
      type: "image",
      src: String(partial?.src ?? "").trim(),
      alt: String(partial?.alt ?? "").trim(),
      width: toWidth(partial?.width, 500),
      caption: String(partial?.caption ?? "").trim(),
    };
  }

  if (resolvedType === "divider") {
    return { id, type: "divider" };
  }

  if (resolvedType === "callout") {
    const tone = String(partial?.tone ?? "note").trim().toLowerCase();
    return { id, type: "callout", tone: tone || "note", text: toText(partial?.text) };
  }

  if (resolvedType === "embed") {
    return {
      id,
      type: "embed",
      url: String(partial?.url ?? "").trim(),
      title: String(partial?.title ?? "").trim(),
    };
  }

  return { id, type: "paragraph", text: toText(partial?.text) };
}

export function normalizeBlocksPayload(value) {
  const rawBlocks = Array.isArray(value)
    ? value
    : Array.isArray(value?.blocks)
      ? value.blocks
      : [];

  const blocks = rawBlocks
    .map((item) => createBlock(item?.type, item))
    .filter(Boolean);

  return blocks.length ? blocks : [];
}

export function buildBlocksContentJson(blocks) {
  const normalized = normalizeBlocksPayload(blocks);
  return { blocks: normalized };
}

export function legacyContentToBlocks(content) {
  const raw = String(content ?? "").trim();
  if (!raw) return [createBlock("paragraph", { text: "" })];
  return [createBlock("paragraph", { text: raw })];
}

export function getBlockTemplates() {
  return BLOCK_TEMPLATES.map((template) => ({
    id: template.id,
    label: template.label,
    description: template.description,
  }));
}

export function createTemplateBlocks(templateId) {
  const template = BLOCK_TEMPLATES.find((item) => item.id === templateId);
  if (!template) return [];
  return template.blocks.map((block) => createBlock(block.type, block));
}
