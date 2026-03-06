"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createBlock,
  createTemplateBlocks,
  getBlockTemplates,
} from "@/src/lib/content/blockEditorModel";

const BLOCK_INSERT_TYPES = [
  ["paragraph", "Paragraph"],
  ["heading", "Heading"],
  ["quote", "Quote"],
  ["list", "List"],
  ["code", "Code"],
  ["image", "Image"],
  ["callout", "Callout"],
  ["embed", "Embed"],
  ["divider", "Divider"],
];

function BlockActionButton({ label, onClick, disabled, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-md border border-wafu-sumi/15 bg-white/85 px-2 py-1 text-[11px] text-wafu-sumi/70 transition-colors hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function BlockTypePills({ onInsert, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {BLOCK_INSERT_TYPES.map(([type, label]) => (
        <button
          key={type}
          type="button"
          onClick={() => onInsert(type)}
          disabled={disabled}
          className="rounded-full border border-wafu-sumi/15 bg-white/80 px-3 py-1 text-[11px] font-medium text-wafu-sumi/70 transition-colors hover:border-erii-red/35 hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function TemplatePills({ onInsertTemplate, disabled }) {
  const templates = useMemo(() => getBlockTemplates(), []);

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          title={template.description}
          onClick={() => onInsertTemplate(template.id)}
          disabled={disabled}
          className="rounded-full border border-erii-red/20 bg-erii-red/5 px-3 py-1 text-[11px] font-medium text-erii-red/80 transition-colors hover:bg-erii-red/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {template.label}
        </button>
      ))}
    </div>
  );
}

export default function BlockComposer({
  blocks = [],
  onChange,
  onUploadImage,
  disabled = false,
}) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const updateBlock = (id, patch) => {
    onChange?.(safeBlocks.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const changeType = (id, nextType) => {
    onChange?.(
      safeBlocks.map((item) => {
        if (item.id !== id) return item;
        return createBlock(nextType, { id: item.id });
      })
    );
  };

  const insertBlock = (type, index = safeBlocks.length) => {
    const next = createBlock(type);
    const copy = [...safeBlocks];
    copy.splice(index, 0, next);
    onChange?.(copy);
  };

  const insertTemplate = (templateId, index = safeBlocks.length) => {
    const templateBlocks = createTemplateBlocks(templateId);
    if (!templateBlocks.length) return;
    const copy = [...safeBlocks];
    copy.splice(index, 0, ...templateBlocks);
    onChange?.(copy);
  };

  const removeBlock = (id) => {
    const filtered = safeBlocks.filter((item) => item.id !== id);
    onChange?.(filtered.length ? filtered : [createBlock("paragraph")]);
  };

  const moveBlock = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= safeBlocks.length) return;
    const next = [...safeBlocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange?.(next);
  };

  const handleDragStart = (event, id) => {
    if (disabled) return;
    setDraggingId(id);
    setDropTargetId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (event, id) => {
    if (disabled) return;
    event.preventDefault();
    if (dropTargetId !== id) setDropTargetId(id);
  };

  const handleDragLeave = (event, id) => {
    if (disabled) return;
    const related = event.relatedTarget;
    if (
      related &&
      related instanceof HTMLElement &&
      related.closest(`[data-block-id="${id}"]`)
    ) {
      return;
    }
    if (dropTargetId === id) setDropTargetId(null);
  };

  const handleDrop = (event, targetId) => {
    if (disabled) return;
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain") || draggingId;
    if (!sourceId || !targetId || sourceId === targetId) {
      setDraggingId(null);
      setDropTargetId(null);
      return;
    }

    const from = safeBlocks.findIndex((item) => item.id === sourceId);
    const to = safeBlocks.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) {
      setDraggingId(null);
      setDropTargetId(null);
      return;
    }

    const next = [...safeBlocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange?.(next);

    setDraggingId(null);
    setDropTargetId(null);
  };

  const clearDrag = () => {
    setDraggingId(null);
    setDropTargetId(null);
  };

  return (
    <div className="zen-scrollbar min-h-0 flex-1 overflow-y-auto px-8 pb-24">
      <div className="rounded-2xl border border-wafu-sumi/10 bg-white/40 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-serif text-xs tracking-[0.24em] text-wafu-sumi/60">BLOCKS</p>
          <span className="rounded-full border border-wafu-sumi/15 bg-white/85 px-3 py-1 text-[11px] font-mono text-wafu-sumi/65">
            {safeBlocks.length} blocks
          </span>
        </div>
        <BlockTypePills onInsert={insertBlock} disabled={disabled} />
        <TemplatePills onInsertTemplate={insertTemplate} disabled={disabled} />
      </div>

      <div className="mt-4 space-y-3">
        {safeBlocks.map((block, index) => (
          <div
            key={block.id}
            data-block-id={block.id}
            draggable={!disabled}
            onDragStart={(event) => handleDragStart(event, block.id)}
            onDragOver={(event) => handleDragOver(event, block.id)}
            onDragLeave={(event) => handleDragLeave(event, block.id)}
            onDrop={(event) => handleDrop(event, block.id)}
            onDragEnd={clearDrag}
            className={`rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur transition-colors ${
              dropTargetId === block.id
                ? "border-erii-red/40"
                : "border-wafu-sumi/15"
            }`}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  title="Drag to reorder"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-wafu-sumi/15 bg-white/90 text-wafu-sumi/55 hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <GripVertical size={14} />
                </button>
                <span className="rounded-full border border-wafu-sumi/15 bg-white/90 px-2 py-0.5 text-[10px] font-mono uppercase text-wafu-sumi/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <select
                  value={block.type}
                  disabled={disabled}
                  onChange={(event) => changeType(block.id, event.target.value)}
                  className="rounded-md border border-wafu-sumi/20 bg-white px-2 py-1 text-xs text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                >
                  {BLOCK_INSERT_TYPES.map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <BlockActionButton
                  label="Up"
                  icon={<ArrowUp size={12} />}
                  onClick={() => moveBlock(index, -1)}
                  disabled={disabled || index === 0}
                />
                <BlockActionButton
                  label="Down"
                  icon={<ArrowDown size={12} />}
                  onClick={() => moveBlock(index, 1)}
                  disabled={disabled || index === safeBlocks.length - 1}
                />
                <BlockActionButton
                  label="Delete"
                  icon={<Trash2 size={12} />}
                  onClick={() => removeBlock(block.id)}
                  disabled={disabled}
                />
                <BlockActionButton
                  label="Add"
                  icon={<Plus size={12} />}
                  onClick={() => insertBlock("paragraph", index + 1)}
                  disabled={disabled}
                />
              </div>
            </div>

            {(block.type === "paragraph" || block.type === "quote" || block.type === "callout") && (
              <textarea
                value={block.text || ""}
                disabled={disabled}
                onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                className="min-h-20 w-full resize-y rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-sm text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                placeholder="Type your content..."
              />
            )}

            {block.type === "heading" && (
              <div className="grid gap-3 md:grid-cols-[120px_1fr]">
                <select
                  value={block.level || 2}
                  disabled={disabled}
                  onChange={(event) => updateBlock(block.id, { level: Number(event.target.value) })}
                  className="rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-sm text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                >
                  <option value={1}>H1</option>
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                  <option value={4}>H4</option>
                  <option value={5}>H5</option>
                  <option value={6}>H6</option>
                </select>
                <input
                  value={block.text || ""}
                  disabled={disabled}
                  onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                  className="rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-sm text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                  placeholder="Heading text..."
                />
              </div>
            )}

            {block.type === "list" && (
              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-xs text-wafu-sumi/70">
                  <input
                    type="checkbox"
                    checked={Boolean(block.ordered)}
                    disabled={disabled}
                    onChange={(event) => updateBlock(block.id, { ordered: event.target.checked })}
                  />
                  Ordered list
                </label>
                <textarea
                  value={Array.isArray(block.items) ? block.items.join("\n") : ""}
                  disabled={disabled}
                  onChange={(event) =>
                    updateBlock(block.id, {
                      items: event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className="min-h-24 w-full resize-y rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-sm text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                  placeholder="One item per line..."
                />
              </div>
            )}

            {block.type === "code" && (
              <div className="space-y-3">
                <input
                  value={block.language || ""}
                  disabled={disabled}
                  onChange={(event) => updateBlock(block.id, { language: event.target.value })}
                  className="w-40 rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-xs font-mono text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                  placeholder="language"
                />
                <textarea
                  value={block.code || ""}
                  disabled={disabled}
                  onChange={(event) => updateBlock(block.id, { code: event.target.value })}
                  className="min-h-28 w-full resize-y rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 font-mono text-sm text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                  placeholder="Code..."
                />
              </div>
            )}

            {block.type === "image" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUploadImage?.(block.id)}
                    disabled={disabled}
                    className="inline-flex items-center gap-2 rounded-full border border-wafu-sumi/15 bg-white/85 px-3 py-1.5 text-xs text-wafu-sumi/75 transition-colors hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ImagePlus size={14} />
                    Upload
                  </button>
                </div>
                <input
                  value={block.src || ""}
                  disabled={disabled}
                  onChange={(event) => updateBlock(block.id, { src: event.target.value })}
                  className="w-full rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-xs font-mono text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                  placeholder="https://..."
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={block.alt || ""}
                    disabled={disabled}
                    onChange={(event) => updateBlock(block.id, { alt: event.target.value })}
                    className="rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-sm text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                    placeholder="alt text"
                  />
                  <input
                    type="number"
                    min={80}
                    max={2400}
                    value={block.width || 500}
                    disabled={disabled}
                    onChange={(event) => updateBlock(block.id, { width: Number(event.target.value) || 500 })}
                    className="rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-sm text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                    placeholder="width"
                  />
                </div>
                <input
                  value={block.caption || ""}
                  disabled={disabled}
                  onChange={(event) => updateBlock(block.id, { caption: event.target.value })}
                  className="w-full rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-sm text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                  placeholder="caption (optional)"
                />
              </div>
            )}

            {block.type === "callout" && (
              <div className="mb-3">
                <select
                  value={block.tone || "note"}
                  disabled={disabled}
                  onChange={(event) => updateBlock(block.id, { tone: event.target.value })}
                  className="rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-xs text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                >
                  <option value="note">Note</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="tip">Tip</option>
                </select>
              </div>
            )}

            {block.type === "embed" && (
              <div className="grid gap-3">
                <input
                  value={block.url || ""}
                  disabled={disabled}
                  onChange={(event) => updateBlock(block.id, { url: event.target.value })}
                  className="w-full rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-xs font-mono text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                  placeholder="https://..."
                />
                <input
                  value={block.title || ""}
                  disabled={disabled}
                  onChange={(event) => updateBlock(block.id, { title: event.target.value })}
                  className="w-full rounded-md border border-wafu-sumi/20 bg-white px-3 py-2 text-sm text-wafu-sumi outline-none focus:border-erii-red/30 focus:ring-4 focus:ring-erii-red/15"
                  placeholder="Link title (optional)"
                />
              </div>
            )}

            {block.type === "divider" && (
              <div className="rounded-md border border-dashed border-wafu-sumi/20 bg-white/70 px-3 py-4 text-center text-xs font-mono text-wafu-sumi/45">
                --- divider ---
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

