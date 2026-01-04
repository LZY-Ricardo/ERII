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
  Italic,
  Link2,
  List,
  Mountain,
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
      className="rounded-lg p-2 text-wafu-sumi/45 transition-colors hover:bg-white/60 hover:text-wafu-shu"
    >
      {icon}
    </button>
  );
}

export default function WritePage() {
  const [title, setTitle] = useState("04.24 東京タワー");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("世界はやさしい。写在城市灯火的上方。");
  const [tags, setTags] = useState("日記,東京");
  const [content, setContent] = useState("世界はやさしい。\n\n在此处开始书写你的故事……");
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

  const tagList = useMemo(() => {
    return String(tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [tags]);

  const markdownComponents = useMemo(() => {
    return {
      h1: ({ node, ...props }) => (
        <h1
          className="font-serif text-3xl font-bold text-wafu-shu"
          {...props}
        />
      ),
      h2: ({ node, ...props }) => (
        <h2
          className="font-serif text-2xl font-bold text-wafu-sumi"
          {...props}
        />
      ),
      h3: ({ node, ...props }) => (
        <h3 className="font-serif text-xl font-bold text-wafu-sumi" {...props} />
      ),
      p: ({ node, ...props }) => (
        <p
          className="font-sans leading-relaxed tracking-wide text-wafu-sumi/85"
          {...props}
        />
      ),
      a: ({ node, ...props }) => (
        <a
          className="text-wafu-shu underline decoration-wafu-shu/30 underline-offset-4"
          {...props}
        />
      ),
      blockquote: ({ node, ...props }) => (
        <blockquote
          className="border-l-4 border-wafu-indigo/30 bg-white/35 pl-4 italic text-wafu-sumi/70"
          {...props}
        />
      ),
      code: ({ node, inline, className, children, ...props }) => {
        if (inline) {
          return (
            <code
              className="rounded bg-white/55 px-1 py-0.5 font-mono text-[0.9em] text-wafu-sumi"
              {...props}
            >
              {children}
            </code>
          );
        }
        return (
          <code
            className={`${className ?? ""} font-mono text-sm text-wafu-sumi`}
            {...props}
          >
            {children}
          </code>
        );
      },
      pre: ({ node, ...props }) => (
        <pre
          className="overflow-x-auto rounded-xl border border-wafu-sumi/10 bg-white/45 p-4"
          {...props}
        />
      ),
      img: ({ node, ...props }) => (
        <img className="rounded-xl border border-wafu-sumi/10" {...props} />
      ),
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col text-wafu-sumi">
      <header className="sticky top-0 z-50 h-16 border-b border-wafu-sumi/10 bg-wafu-paper/85 px-4 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-sans text-wafu-sumi/70 transition-colors hover:bg-white/60 hover:text-wafu-shu"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">回到首页</span>
            </Link>

            <div className="hidden writing-vertical font-serif text-[11px] tracking-[0.45em] text-wafu-sumi/60 sm:block">
              无题の稿
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="hidden items-center gap-2 rounded-full border border-wafu-sumi/15 bg-white/60 px-4 py-2 text-sm font-sans text-wafu-sumi/80 transition-colors hover:bg-white/80 hover:text-wafu-shu md:inline-flex"
            >
              <Copy size={18} />
              <span>复制</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-md border border-wafu-sumi/15 bg-gradient-to-b from-white/70 to-wafu-sakura/40 px-5 py-2 text-sm font-serif text-wafu-sumi shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              <Save size={18} />
              <span>奉纳</span>
            </button>
          </div>
        </div>
      </header>

      {toast ? (
        <div className="fixed right-6 top-20 z-50 rounded-full border border-wafu-sumi/10 bg-wafu-paper/90 px-4 py-2 text-xs text-wafu-sumi shadow-lg">
          {toast}
        </div>
      ) : null}

      <main className="flex-1 overflow-hidden">
        <div className="grid h-full grid-rows-[1fr_1fr] md:grid-rows-1 md:grid-cols-[1fr_18px_1fr]">
          <section className="min-h-0 flex flex-col bg-white/10">
            <div className="border-b border-dashed border-wafu-sumi/15 bg-white/30 p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-b border-dashed border-wafu-sumi/20 bg-transparent px-1 py-1 text-sm font-serif text-wafu-sumi outline-none placeholder:text-wafu-sumi/40 focus:border-wafu-shu caret-wafu-shu"
                  placeholder="标题"
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border-b border-dashed border-wafu-sumi/20 bg-transparent px-1 py-1 text-sm font-mono text-wafu-sumi outline-none focus:border-wafu-shu caret-wafu-shu"
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border-b border-dashed border-wafu-sumi/20 bg-transparent px-1 py-1 text-sm text-wafu-sumi/80 outline-none placeholder:text-wafu-sumi/35 focus:border-wafu-shu caret-wafu-shu"
                  placeholder="一句描述（可选）"
                />
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full border-b border-dashed border-wafu-sumi/20 bg-transparent px-1 py-1 text-sm text-wafu-sumi/80 outline-none placeholder:text-wafu-sumi/35 focus:border-wafu-shu caret-wafu-shu"
                  placeholder="标签（逗号分隔）"
                />
              </div>
              <p className="mt-3 text-xs text-wafu-sumi/55">
                图片放进{" "}
                <code className="rounded bg-white/60 px-1 py-0.5 font-mono">
                  public/images
                </code>
                ，再用工具栏插入。
              </p>
            </div>

            <div className="flex items-center gap-1 border-b border-dashed border-wafu-sumi/15 bg-wafu-paper/70 px-3 py-2">
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
                icon={<span className="px-0.5 font-serif text-[16px] leading-none">「」</span>}
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

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-0 flex-1 resize-none bg-transparent p-8 font-mono text-sm leading-loose text-wafu-sumi/85 outline-none caret-wafu-shu selection:bg-wafu-sakura/70 selection:text-wafu-sumi"
              placeholder="在此处开始书写你的故事..."
              spellCheck={false}
            />
          </section>

          <div className="hidden bg-wafu-paper/30 md:block">
            <div className="mx-auto h-full w-[12px] border-x border-wafu-sumi/10 bg-gradient-to-b from-transparent via-wafu-sumi/5 to-transparent" />
          </div>

          <section className="min-h-0 overflow-y-auto bg-wafu-paper/50 p-8 md:p-10">
            <div className="mb-8 flex items-start gap-6 border-b border-dashed border-wafu-sumi/15 pb-6">
              <div className="writing-vertical font-serif text-3xl font-bold text-wafu-shu">
                {title?.trim() ? title : "（無題）"}
              </div>
              <div className="pt-1">
                <div className="text-xs font-sans text-wafu-sumi/60">
                  {date} · 预览
                </div>
                {description?.trim() ? (
                  <p className="mt-3 text-sm text-wafu-sumi/70">
                    {description}
                  </p>
                ) : null}
                {tagList.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tagList.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-wafu-sakura/60 px-3 py-1 text-[11px] font-sans text-wafu-sumi/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="prose max-w-none prose-slate prose-headings:tracking-wide prose-strong:text-wafu-sumi prose-a:text-wafu-shu">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
