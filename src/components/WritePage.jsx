"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Bold,
  Code,
  Copy,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Quote,
  Save,
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
      className="rounded-lg p-2 text-erii-ink/45 transition-colors hover:bg-white hover:text-erii-red"
    >
      {icon}
    </button>
  );
}

export default function WritePage() {
  const [title, setTitle] = useState("04.24 东京塔");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("世界上最暖和的地方，在城市灯火的上方。");
  const [tags, setTags] = useState("日记,东京");
  const [content, setContent] = useState("# 04.24 东京塔\n\n世界很温柔。");
  const [toast, setToast] = useState("");

  const textareaRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(""), 1400);
  };

  const frontmatter = useMemo(() => {
    const tagsValue = toYamlTags(tags);
    return `---\ntitle: "${escapeYamlString(title)}"\ndate: "${date}"\ndescription: "${escapeYamlString(
      description
    )}"\ntags: [${tagsValue}]\n---\n\n`;
  }, [title, date, description, tags]);

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
    showToast("已下载 MDX");
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
    <div className="min-h-screen flex flex-col text-erii-ink">
      <header className="sticky top-0 z-50 h-16 border-b border-dashed border-erii-red/25 bg-white/55 px-4 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-hand text-erii-ink/70 transition-colors hover:bg-white hover:text-erii-red"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">回到首页</span>
            </Link>

            <div className="hidden items-center gap-3 md:flex">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-64 border-b border-dashed border-erii-red/30 bg-transparent px-1 py-1 text-sm font-hand text-erii-ink outline-none placeholder:text-erii-ink/40 focus:border-erii-red caret-erii-red"
                placeholder="标题"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-b border-dashed border-erii-red/30 bg-transparent px-1 py-1 text-sm font-hand text-erii-ink outline-none focus:border-erii-red caret-erii-red"
              />
            </div>
          </div>

          <div className="hidden items-center gap-1 lg:flex">
            <ToolButton
              icon={<Bold size={18} />}
              onClick={() => insertText("**", "**")}
              tooltip="加粗"
            />
            <ToolButton
              icon={<Italic size={18} />}
              onClick={() => insertText("*", "*")}
              tooltip="斜体"
            />
            <ToolButton
              icon={<Quote size={18} />}
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
              tooltip="行内代码"
            />
            <ToolButton
              icon={<LinkIcon size={18} />}
              onClick={() => insertText("[", "](https://)")}
              tooltip="链接"
            />
            <ToolButton
              icon={<ImageIcon size={18} />}
              onClick={() => insertText("![描述](/images/", ")")}
              tooltip="图片"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="hidden items-center gap-2 rounded-full border border-erii-red/20 bg-white/70 px-4 py-2 text-sm font-hand text-erii-ink/80 transition-colors hover:border-erii-red/30 hover:bg-white hover:text-erii-red md:inline-flex"
            >
              <Copy size={18} />
              <span>复制</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-full bg-erii-red px-4 py-2 text-sm font-hand text-white shadow-md transition-transform hover:scale-105 hover:shadow-erii-red/30 active:scale-95"
            >
              <Save size={18} />
              <span>下载 MDX</span>
            </button>
          </div>
        </div>
      </header>

      {toast ? (
        <div className="fixed right-6 top-20 z-50 rounded-full bg-white/90 px-4 py-2 text-xs text-erii-ink shadow-lg">
          {toast}
        </div>
      ) : null}

      <main className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-dashed border-erii-red/20 bg-white/25">
          <div className="border-b border-dashed border-erii-red/15 p-6 md:hidden">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-b border-dashed border-erii-red/30 bg-transparent px-1 py-1 text-sm font-hand text-erii-ink outline-none placeholder:text-erii-ink/40 focus:border-erii-red caret-erii-red"
                placeholder="标题"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border-b border-dashed border-erii-red/30 bg-transparent px-1 py-1 text-sm font-hand text-erii-ink outline-none focus:border-erii-red caret-erii-red"
              />
            </div>
            <div className="mt-3">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border-b border-dashed border-erii-red/20 bg-transparent px-1 py-1 text-sm text-erii-ink/80 outline-none placeholder:text-erii-ink/35 focus:border-erii-red caret-erii-red"
                placeholder="描述（可选）"
              />
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full w-full resize-none bg-transparent p-8 font-mono text-sm leading-relaxed text-erii-ink/80 outline-none caret-erii-red selection:bg-erii-duck"
            placeholder="开始记录今天的故事..."
            spellCheck={false}
          />
        </div>

        <div className="w-1/2 overflow-y-auto bg-white/60 p-8">
          <div className="mb-6 grid gap-3 md:grid-cols-2">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-b border-dashed border-erii-red/20 bg-transparent px-1 py-1 text-sm text-erii-ink/80 outline-none placeholder:text-erii-ink/35 focus:border-erii-red caret-erii-red"
              placeholder="描述（可选）"
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border-b border-dashed border-erii-red/20 bg-transparent px-1 py-1 text-sm text-erii-ink/80 outline-none placeholder:text-erii-ink/35 focus:border-erii-red caret-erii-red"
              placeholder="标签（逗号分隔）"
            />
          </div>

          <div className="prose max-w-none prose-slate prose-headings:font-hand prose-headings:text-erii-ink prose-a:text-erii-red prose-strong:text-erii-ink">
            <div className="mb-8 border-b border-dashed border-erii-red/30 pb-4">
              <h1 className="mb-2 text-3xl font-hand text-erii-ink">
                {title?.trim() ? title : "（无标题）"}
              </h1>
              <div className="text-xs font-hand text-erii-red/70">
                {date} · 预览模式
              </div>
              {description?.trim() ? (
                <p className="mt-2 text-sm text-erii-ink/70">{description}</p>
              ) : null}
            </div>

            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
}

