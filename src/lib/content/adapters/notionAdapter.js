import { EDITOR_SOURCES } from "@/src/lib/content/constants";
import {
  buildBlocksContentJson,
  createBlock,
} from "@/src/lib/content/blockEditorModel";
import { blocksToMdx } from "@/src/lib/content/renderPipeline";

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = process.env.NOTION_API_VERSION || "2022-06-28";

function getNotionToken(explicitToken) {
  return explicitToken || process.env.NOTION_TOKEN || process.env.NOTION_API_KEY || "";
}

function pickTitleProperty(properties) {
  const entries = Object.entries(properties ?? {});
  const exactTitle = entries.find(([, prop]) => prop?.type === "title");
  if (exactTitle) return exactTitle[1];
  return null;
}

function pickDateProperty(properties) {
  const entries = Object.entries(properties ?? {});
  const priorityNames = ["date", "publish date", "published_at", "publish"];
  for (const name of priorityNames) {
    const hit = entries.find(
      ([key, prop]) => key.trim().toLowerCase() === name && prop?.type === "date"
    );
    if (hit) return hit[1];
  }
  return entries.find(([, prop]) => prop?.type === "date")?.[1] ?? null;
}

function pickTagsProperty(properties) {
  const entries = Object.entries(properties ?? {});
  const priorityNames = ["tags", "tag"];
  for (const name of priorityNames) {
    const hit = entries.find(
      ([key, prop]) =>
        key.trim().toLowerCase() === name &&
        (prop?.type === "multi_select" || prop?.type === "select")
    );
    if (hit) return hit[1];
  }
  return (
    entries.find(([, prop]) => prop?.type === "multi_select")?.[1] ??
    entries.find(([, prop]) => prop?.type === "select")?.[1] ??
    null
  );
}

function pickDescriptionProperty(properties) {
  const entries = Object.entries(properties ?? {});
  const priorityNames = ["description", "summary", "excerpt", "desc"];
  for (const name of priorityNames) {
    const hit = entries.find(
      ([key, prop]) =>
        key.trim().toLowerCase() === name &&
        (prop?.type === "rich_text" || prop?.type === "title")
    );
    if (hit) return hit[1];
  }
  return entries.find(([, prop]) => prop?.type === "rich_text")?.[1] ?? null;
}

function richTextToPlain(richText) {
  const list = Array.isArray(richText) ? richText : [];
  return list.map((node) => String(node?.plain_text ?? "")).join("");
}

function getNotionFileUrl(fileLike) {
  if (!fileLike || typeof fileLike !== "object") return "";
  if (fileLike.type === "external") return String(fileLike.external?.url ?? "");
  if (fileLike.type === "file") return String(fileLike.file?.url ?? "");
  return "";
}

function pickPageCover(page) {
  return getNotionFileUrl(page?.cover);
}

function normalizeDateString(value) {
  const raw = String(value ?? "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return new Date().toISOString().slice(0, 10);
}

function isListItemBlockType(type) {
  return type === "bulleted_list_item" || type === "numbered_list_item";
}

function blockValueUrl(type, value) {
  if (type === "bookmark") return String(value?.url ?? "").trim();
  if (type === "video" || type === "pdf" || type === "audio" || type === "file") {
    return getNotionFileUrl(value);
  }
  return "";
}

async function notionRequest(pathname, { method = "GET", body, notionToken }) {
  const token = getNotionToken(notionToken);
  if (!token) throw new Error("Notion token is not configured.");

  const response = await fetch(`${NOTION_API_BASE}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion API error ${response.status}: ${text.slice(0, 600)}`);
  }

  return response.json();
}

async function fetchNotionPage(pageId, notionToken) {
  return notionRequest(`/pages/${encodeURIComponent(pageId)}`, { notionToken });
}

async function fetchNotionBlockChildren(blockId, notionToken, pageSize = 100) {
  const blocks = [];
  let cursor = null;

  while (true) {
    const params = new URLSearchParams({ page_size: String(pageSize) });
    if (cursor) params.set("start_cursor", cursor);
    const data = await notionRequest(
      `/blocks/${encodeURIComponent(blockId)}/children?${params.toString()}`,
      { notionToken }
    );

    blocks.push(...(data?.results ?? []));
    if (!data?.has_more || !data?.next_cursor) break;
    cursor = data.next_cursor;
  }

  return blocks;
}

async function expandChildren(blocks, notionToken, depth = 0) {
  if (!Array.isArray(blocks) || !blocks.length) return [];
  if (depth > 4) return blocks;

  const output = [];
  for (const block of blocks) {
    const next = { ...block };
    if (block?.has_children) {
      const children = await fetchNotionBlockChildren(block.id, notionToken);
      next.children = await expandChildren(children, notionToken, depth + 1);
    }
    output.push(next);
  }
  return output;
}

async function notionBlockToEditorBlocks(block, options = {}) {
  const type = String(block?.type ?? "");
  const value = block?.[type] ?? {};
  const children = Array.isArray(block?.children) ? block.children : [];
  const assetResolver = options.assetResolver;
  const out = [];

  if (type === "paragraph") {
    const text = richTextToPlain(value.rich_text ?? []).trim();
    if (text) out.push(createBlock("paragraph", { text }));
  } else if (type === "heading_1") {
    out.push(createBlock("heading", { level: 1, text: richTextToPlain(value.rich_text ?? []) }));
  } else if (type === "heading_2") {
    out.push(createBlock("heading", { level: 2, text: richTextToPlain(value.rich_text ?? []) }));
  } else if (type === "heading_3") {
    out.push(createBlock("heading", { level: 3, text: richTextToPlain(value.rich_text ?? []) }));
  } else if (type === "quote") {
    out.push(createBlock("quote", { text: richTextToPlain(value.rich_text ?? []) }));
  } else if (type === "callout") {
    out.push(createBlock("callout", { tone: "note", text: richTextToPlain(value.rich_text ?? []) }));
  } else if (type === "divider") {
    out.push(createBlock("divider"));
  } else if (type === "code") {
    out.push(
      createBlock("code", {
        language: String(value?.language ?? "").trim(),
        code: richTextToPlain(value.rich_text ?? []),
      })
    );
  } else if (type === "image") {
    const src = getNotionFileUrl(value);
    if (src) {
      const mirroredSrc = assetResolver ? await assetResolver(src, "image") : src;
      out.push(
        createBlock("image", {
          src: mirroredSrc,
          alt: richTextToPlain(value.caption ?? []),
          caption: richTextToPlain(value.caption ?? []),
          width: 720,
        })
      );
    }
  } else if (type === "to_do") {
    const checked = Boolean(value?.checked);
    const text = richTextToPlain(value.rich_text ?? []).trim();
    const item = `${checked ? "[x]" : "[ ]"} ${text || "Task"}`;
    out.push(createBlock("list", { ordered: false, items: [item] }));
  } else if (type === "toggle") {
    const summary = richTextToPlain(value.rich_text ?? []).trim();
    out.push(
      createBlock("callout", {
        tone: "info",
        text: summary || "Toggle section",
      })
    );
  } else {
    const url = blockValueUrl(type, value);
    if (url) {
      out.push(createBlock("embed", { url, title: url }));
    }
  }

  if (children.length) {
    const nested = await notionBlocksToEditorBlocks(children, options);
    out.push(...nested);
  }

  return out;
}

async function notionBlocksToEditorBlocks(blocks, options = {}) {
  const source = Array.isArray(blocks) ? blocks : [];
  const output = [];

  for (let i = 0; i < source.length; i += 1) {
    const block = source[i];
    const type = String(block?.type ?? "");

    if (isListItemBlockType(type)) {
      const ordered = type === "numbered_list_item";
      const items = [];
      const extraBlocks = [];

      while (i < source.length && String(source[i]?.type ?? "") === type) {
        const current = source[i];
        const value = current?.[type] ?? {};
        const text = richTextToPlain(value.rich_text ?? []).trim();
        if (text) items.push(text);

        const children = Array.isArray(current?.children) ? current.children : [];
        if (children.length) {
          const nested = await notionBlocksToEditorBlocks(children, options);
          extraBlocks.push(...nested);
        }

        i += 1;
      }

      i -= 1;

      if (items.length) {
        output.push(createBlock("list", { ordered, items }));
      }
      if (extraBlocks.length) {
        output.push(...extraBlocks);
      }
      continue;
    }

    const converted = await notionBlockToEditorBlocks(block, options);
    output.push(...converted);
  }

  return output;
}

function extractTitle(page) {
  const titleProp = pickTitleProperty(page?.properties);
  const title = richTextToPlain(titleProp?.title ?? []);
  return title.trim() || "无题";
}

function blockPreviewText(block) {
  if (!block || typeof block !== "object") return "";
  if (
    block.type === "paragraph" ||
    block.type === "quote" ||
    block.type === "heading" ||
    block.type === "callout"
  ) {
    return String(block.text ?? "").trim();
  }
  if (block.type === "list") {
    return Array.isArray(block.items) ? String(block.items[0] ?? "").trim() : "";
  }
  return "";
}

function extractDescription(page, editorBlocks = []) {
  const descriptionProp = pickDescriptionProperty(page?.properties);
  const description = richTextToPlain(
    descriptionProp?.rich_text ?? descriptionProp?.title ?? []
  ).trim();
  if (description) return description;

  const firstTextBlock = editorBlocks.find((block) => blockPreviewText(block));
  return firstTextBlock ? blockPreviewText(firstTextBlock).slice(0, 180) : "";
}

function extractTags(page) {
  const tagsProp = pickTagsProperty(page?.properties);
  if (!tagsProp) return [];

  if (tagsProp.type === "multi_select") {
    return (tagsProp.multi_select ?? [])
      .map((item) => String(item?.name ?? "").trim())
      .filter(Boolean);
  }

  if (tagsProp.type === "select") {
    const value = String(tagsProp.select?.name ?? "").trim();
    return value ? [value] : [];
  }

  return [];
}

function extractDate(page) {
  const dateProp = pickDateProperty(page?.properties);
  const start = dateProp?.date?.start;
  return normalizeDateString(start);
}

export async function fetchNotionPageAsPostInput({
  pageId,
  notionToken,
  assetResolver,
}) {
  if (!pageId) throw new Error("pageId is required.");

  const page = await fetchNotionPage(pageId, notionToken);
  const rootBlocks = await fetchNotionBlockChildren(pageId, notionToken);
  const rawBlocks = await expandChildren(rootBlocks, notionToken);
  const editorBlocks = await notionBlocksToEditorBlocks(rawBlocks, { assetResolver });

  const contentJson = {
    provider: "notion",
    pageId: page.id,
    ...buildBlocksContentJson(editorBlocks),
  };

  const content = blocksToMdx(contentJson);
  const cover = pickPageCover(page);

  return {
    sourcePage: page,
    sourceBlocks: rawBlocks,
    sourceEditorBlocks: editorBlocks,
    input: {
      slug: null,
      title: extractTitle(page),
      date: extractDate(page),
      description: extractDescription(page, editorBlocks),
      tags: extractTags(page),
      cover: cover || null,
      content,
      contentFormat: "blocks",
      contentJson,
      editorSource: EDITOR_SOURCES.NOTION,
      sourceRef: page.id,
      sourceUpdatedAt: page.last_edited_time || null,
    },
  };
}

export function isNotionConfigured() {
  return Boolean(getNotionToken());
}
