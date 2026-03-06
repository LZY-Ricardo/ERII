export const CONTENT_FORMATS = {
  MARKDOWN: "markdown",
  MDX: "mdx",
  BLOCKS: "blocks",
};

export const DEFAULT_CONTENT_FORMAT = CONTENT_FORMATS.MDX;

export const EDITOR_SOURCES = {
  INTERNAL: "internal",
  NOTION: "notion",
  IMPORT: "import",
};

export const DEFAULT_EDITOR_SOURCE = EDITOR_SOURCES.INTERNAL;

export function normalizeContentFormat(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === CONTENT_FORMATS.MARKDOWN) return CONTENT_FORMATS.MARKDOWN;
  if (raw === CONTENT_FORMATS.BLOCKS) return CONTENT_FORMATS.BLOCKS;
  return CONTENT_FORMATS.MDX;
}

export function normalizeEditorSource(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === EDITOR_SOURCES.NOTION) return EDITOR_SOURCES.NOTION;
  if (raw === EDITOR_SOURCES.IMPORT) return EDITOR_SOURCES.IMPORT;
  return EDITOR_SOURCES.INTERNAL;
}

