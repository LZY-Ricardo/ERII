"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Code,
  Copy,
  Home,
  Italic,
  Link2,
  List,
  Mountain,
  Settings,
  X,
} from "lucide-react";

function escapeYamlString(value) {
  return String(value ?? "").replace(/"/g, '\\"').replace(/\r?\n/g, " ");
}

function toYamlTags(raw) {
  const tags = String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return tags.length ? tags.map((t) => `"${escapeYamlString(t)}"`).join(", ") : "";
}

function sanitizeFileName(name) {
  const cleaned = String(name ?? "untitled")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-");
  return cleaned.length ? cleaned : "untitled";
}

function ToolButton({ icon, onClick, tooltip }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className="rounded-md p-2 text-wafu-sumi/45 transition-colors hover:text-erii-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erii-red/25"
    >
      {icon}
    </button>
  );
}

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");
  const [toast, setToast] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const textareaRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsSettingsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsOpen]);

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(""), 1400);
  };

  const frontmatter = useMemo(() => {
    const tagsValue = toYamlTags(tags);
    const coverLine = cover?.trim()
      ? `cover: "${escapeYamlString(cover)}"\n`
      : "";
    return `---\ntitle: "${escapeYamlString(title)}"\ndate: "${date}"\ndescription: "${escapeYamlString(
      description
    )}"\ntags: [${tagsValue}]\n${coverLine}---\n\n`;
  }, [title, date, description, tags, cover]);

  const fullMdx = useMemo(() => frontmatter + content, [frontmatter, content]);

  const insertText = (before, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const text = textarea.value ?? "";
    const selectedText = text.substring(start, end);
    const nextText =
      text.substring(0, start) +
      before +
      selectedText +
      after +
      text.substring(end);

    setContent(nextText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleDownload = () => {
    const blob = new Blob([fullMdx], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFileName(title)}.mdx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("已奉纳（下载 MDX）");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullMdx);
      showToast("已复制到剪贴板");
    } catch {
      showToast("复制失败");
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-wafu-sumi">
      <header className="sticky top-0 z-50 h-14 border-b border-wafu-sumi/10 bg-wafu-paper/60 px-4 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="回到首页"
              title="回到首页"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-wafu-sumi/55 transition-colors hover:bg-white/60 hover:text-erii-red"
            >
              <Home size={18} />
            </Link>

            <div className="select-none font-serif text-[11px] tracking-[0.28em] text-wafu-sumi/50">
              DRAFTING...
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen((open) => !open)}
              aria-label="设置"
              title="设置"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/60 hover:text-erii-red ${
                isSettingsOpen ? "text-erii-red" : "text-wafu-sumi/55"
              }`}
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              aria-label="奉纳（下载 MDX）"
              title="奉纳（下载 MDX）"
              className="grid h-10 w-10 place-items-center rounded-md bg-wafu-sumi text-wafu-paper shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              <span
                className="font-serif text-[11px] leading-none tracking-[0.28em]"
                style={{ writingMode: "vertical-rl", textOrientation: "upright" }}
              >
                奉纳
              </span>
            </button>
          </div>
        </div>
      </header>

      {toast ? (
        <div className="fixed right-6 top-16 z-50 rounded-full border border-wafu-sumi/10 bg-wafu-paper/90 px-4 py-2 text-xs text-wafu-sumi shadow-lg">
          {toast}
        </div>
      ) : null}

      <div
        className={`fixed inset-0 z-[60] transition ${
          isSettingsOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-wafu-sumi/10 backdrop-blur-sm transition-opacity ${
            isSettingsOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsSettingsOpen(false)}
        />
        <div className="absolute left-0 right-0 top-0">
          <div
            role="dialog"
            aria-modal={isSettingsOpen}
            aria-label="设置"
            className={`mx-auto max-w-4xl origin-top rounded-b-3xl border border-wafu-sumi/10 bg-wafu-paper/80 p-6 shadow-lg backdrop-blur transition-transform duration-300 ${
              isSettingsOpen ? "translate-y-0" : "-translate-y-full"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="select-none font-serif text-xs tracking-[0.32em] text-wafu-sumi/60">
                SETTINGS
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="关闭设置"
                title="关闭"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-wafu-sumi/55 transition-colors hover:bg-white/60 hover:text-erii-red"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs text-wafu-sumi/60">日期</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border-b border-dashed border-wafu-sumi/20 bg-transparent px-1 py-2 text-sm font-mono text-wafu-sumi outline-none focus:border-erii-red caret-erii-red"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs text-wafu-sumi/60">封面</span>
                <input
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                  className="w-full border-b border-dashed border-wafu-sumi/20 bg-transparent px-1 py-2 text-sm text-wafu-sumi/80 outline-none placeholder:text-wafu-sumi/30 focus:border-erii-red caret-erii-red"
                  placeholder="/images/cover.png（可选）"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs text-wafu-sumi/60">摘要</span>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border-b border-dashed border-wafu-sumi/20 bg-transparent px-1 py-2 text-sm text-wafu-sumi/80 outline-none placeholder:text-wafu-sumi/30 focus:border-erii-red caret-erii-red"
                  placeholder="一句描述（可选）"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs text-wafu-sumi/60">标签</span>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full border-b border-dashed border-wafu-sumi/20 bg-transparent px-1 py-2 text-sm text-wafu-sumi/80 outline-none placeholder:text-wafu-sumi/30 focus:border-erii-red caret-erii-red"
                  placeholder="标签（逗号分隔）"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-wafu-sumi/55">
                图片放进{" "}
                <code className="rounded bg-white/60 px-1 py-0.5 font-mono">
                  public/images
                </code>
                ，再用工具栏插入。
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-full border border-wafu-sumi/10 bg-white/60 px-4 py-2 text-xs text-wafu-sumi/80 transition-colors hover:bg-white/80 hover:text-erii-red"
              >
                <Copy size={16} />
                <span>复制 MDX</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        <div className="grid h-full grid-rows-[1fr_1fr] divide-y divide-wafu-sumi/10 md:grid-rows-1 md:grid-cols-2 md:divide-x md:divide-y-0 md:divide-wafu-sumi/10">
          <section className="min-h-0 flex flex-col bg-erii-paper/35">
            <div className="px-8 pb-6 pt-10">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent p-0 font-serif text-4xl font-bold tracking-wide text-wafu-sumi outline-none placeholder:text-wafu-sumi/20 caret-erii-red"
                placeholder="无题..."
                spellCheck={false}
              />
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="zen-scrollbar min-h-0 flex-1 resize-none bg-transparent px-8 pb-24 font-mono text-[15px] leading-loose text-wafu-sumi/85 outline-none placeholder:text-wafu-sumi/20 caret-erii-red selection:bg-erii-red/15 selection:text-wafu-sumi"
              placeholder="在此处开始书写你的故事..."
              spellCheck={false}
            />

            <div className="border-t border-wafu-sumi/10 bg-wafu-paper/40 px-6 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <ToolButton
                  icon={<Bold size={18} />}
                  onClick={() => insertText("**", "**")}
                  tooltip="太字"
                />
                <ToolButton
                  icon={<Italic size={18} />}
                  onClick={() => insertText("*", "*")}
                  tooltip="斜体"
                />
                <ToolButton
                  icon={
                    <span className="px-0.5 font-serif text-[16px] leading-none">
                      「」
                    </span>
                  }
                  onClick={() => insertText("> ")}
                  tooltip="引用"
                />
                <ToolButton
                  icon={<List size={18} />}
                  onClick={() => insertText("- ")}
                  tooltip="列表"
                />
                <ToolButton
                  icon={<Code size={18} />}
                  onClick={() => insertText("`", "`")}
                  tooltip="代码"
                />
                <ToolButton
                  icon={<Link2 size={18} />}
                  onClick={() => insertText("[", "](https://)")}
                  tooltip="结缘"
                />
                <ToolButton
                  icon={<Mountain size={18} />}
                  onClick={() => insertText("![描述](/images/", ")")}
                  tooltip="山水"
                />
              </div>
            </div>
          </section>

          <section className="zen-scrollbar min-h-0 overflow-y-auto bg-wafu-paper/40 bg-washi-texture p-8 md:p-10">
            <article className="mx-auto max-w-3xl rounded-3xl border border-wafu-sumi/10 bg-wafu-paper/80 p-8 shadow-sm backdrop-blur">
              <header>
                <h1 className="font-serif text-4xl text-wafu-sumi">
                  {title?.trim() ? title : "无题"}
                </h1>
                <p className="mt-2 font-sans text-sm text-wafu-shu/70">
                  {date} · 预览
                </p>
                {description?.trim() ? (
                  <p className="mt-3 text-base text-wafu-sumi/70">
                    {description}
                  </p>
                ) : null}
              </header>

              <div className="my-6 border-t border-dashed border-wafu-sumi/15" />

              <div className="prose max-w-none prose-slate prose-headings:font-serif prose-headings:text-wafu-sumi prose-a:text-wafu-shu prose-strong:text-wafu-sumi">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
