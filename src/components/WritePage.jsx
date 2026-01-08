"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ResizableImage from "./ResizableImage";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSlug = searchParams.get("slug") || "";

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");
  const [toast, setToast] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [loadedStatus, setLoadedStatus] = useState("");
  const [postIndex, setPostIndex] = useState([]);
  const [postIndexQuery, setPostIndexQuery] = useState("");
  const [postIndexFilter, setPostIndexFilter] = useState("all");
  const [isPostIndexLoading, setIsPostIndexLoading] = useState(false);

  const textareaRef = useRef(null);
  const uploadInputRef = useRef(null);
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

  useEffect(() => {
    if (urlSlug && urlSlug !== slug) {
      setSlug(urlSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSlug]);

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(""), 1400);
  }, []);

  const refreshSession = useCallback(async () => {
    setIsAuthLoading(true);
    try {
      const res = await fetch("/api/write/session", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      setIsAuthed(Boolean(data?.authenticated));
    } catch {
      setIsAuthed(false);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const requireAuthOrOpenSettings = () => {
    if (isAuthLoading) {
      showToast("正在检查会话…");
      return false;
    }
    if (isAuthed) return true;
    setIsSettingsOpen(true);
    showToast("需要先登录");
    return false;
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      showToast("请输入口令");
      return;
    }

    setIsBusy(true);
    try {
      const res = await fetch("/api/write/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        showToast(data?.error || "登录失败");
        return;
      }

      setPassword("");
      await refreshSession();
      showToast("已登录");
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogout = async () => {
    setIsBusy(true);
    try {
      await fetch("/api/write/session", { method: "DELETE" });
      await refreshSession();
      showToast("已退出");
    } finally {
      setIsBusy(false);
    }
  };

  const refreshPostIndex = useCallback(async () => {
    if (!isAuthed) return;
    setIsPostIndexLoading(true);
    try {
      const res = await fetch("/api/write/posts?status=all&limit=200", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        if (res.status === 401) {
          await refreshSession();
        }
        showToast(data?.error || "加载文章列表失败");
        return;
      }
      setPostIndex(Array.isArray(data.posts) ? data.posts : []);
    } catch {
      showToast("加载文章列表失败");
    } finally {
      setIsPostIndexLoading(false);
    }
  }, [isAuthed, refreshSession, showToast]);

  useEffect(() => {
    if (!isAuthed) return;
    if (!isSettingsOpen) return;
    refreshPostIndex();
  }, [isAuthed, isSettingsOpen, refreshPostIndex]);

  const loadDraft = async (targetSlug) => {
    if (!requireAuthOrOpenSettings()) return;
    if (!targetSlug) {
      showToast("需要 slug");
      return;
    }

    setIsDraftLoading(true);
    try {
      const res = await fetch(`/api/write/posts/${encodeURIComponent(targetSlug)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        if (res.status === 401) {
          await refreshSession();
          setIsSettingsOpen(true);
        }
        showToast(data?.error || "载入失败");
        return;
      }

      const post = data.post;
      setSlug(post.slug);
      setTitle(post.title || "");
      setDate(String(post.date || "").slice(0, 10));
      setDescription(post.description || "");
      setCover(post.cover || "");
      setTags(Array.isArray(post.tags) ? post.tags.join(", ") : "");
      setContent(post.content || "");
      setLoadedStatus(post.status || "");
      router.replace(`/write?slug=${encodeURIComponent(post.slug)}`);
      setIsSettingsOpen(false);
      if (post.status === "published") {
        showToast("已载入已发布文章");
      } else {
        showToast("已载入草稿");
      }
    } finally {
      setIsDraftLoading(false);
    }
  };

  const loadedUrlSlugRef = useRef("");
  useEffect(() => {
    if (!isAuthed) return;
    if (!urlSlug) return;
    if (loadedUrlSlugRef.current === urlSlug) return;
    loadedUrlSlugRef.current = urlSlug;
    loadDraft(urlSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, urlSlug]);

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

  const filteredPostIndex = useMemo(() => {
    const query = postIndexQuery.trim().toLowerCase();
    const filter = postIndexFilter;

    return postIndex.filter((post) => {
      if (filter === "draft") return post.status === "draft";
      if (filter === "published") return post.status === "published";
      return true;
    }).filter((post) => {
      if (!query) return true;
      const haystack = `${post.title ?? ""} ${post.slug ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [postIndex, postIndexFilter, postIndexQuery]);

  const insertAtSelection = (buildSnippet) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const text = textarea.value ?? "";
    const selectedText = text.substring(start, end);
    const snippet = buildSnippet(selectedText);

    const nextText = text.substring(0, start) + snippet + text.substring(end);
    setContent(nextText);

    setTimeout(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  };

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

  const writePayload = () => ({
    slug: slug || undefined,
    title,
    date,
    description,
    tags,
    cover,
    content,
  });

  const handleSaveDraft = async () => {
    if (!requireAuthOrOpenSettings()) return;

    const willUnpublish = loadedStatus === "published";
    if (willUnpublish) {
      const confirmed = window.confirm(
        "当前文章为已发布状态，保存为草稿会使其从站点下线。是否继续？"
      );
      if (!confirmed) return;
    }

    setIsBusy(true);
    try {
      const res = await fetch("/api/write/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(writePayload()),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        if (res.status === 401) {
          await refreshSession();
          setIsSettingsOpen(true);
        }
        showToast(data?.error || "保存失败");
        return;
      }

      setSlug(data.slug);
      setLoadedStatus("draft");
      router.replace(`/write?slug=${encodeURIComponent(data.slug)}`);
      showToast(willUnpublish ? "草稿已保存（已下线）" : "草稿已保存");
    } finally {
      setIsBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!requireAuthOrOpenSettings()) return;

    setIsBusy(true);
    try {
      const res = await fetch("/api/write/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(writePayload()),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        if (res.status === 401) {
          await refreshSession();
          setIsSettingsOpen(true);
        }
        showToast(data?.error || "发布失败");
        return;
      }

      setSlug(data.slug);
      setLoadedStatus("published");
      router.replace(`/write?slug=${encodeURIComponent(data.slug)}`);
      showToast("已发布");
      router.push(`/blog/${encodeURIComponent(data.slug)}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handlePickImage = () => {
    if (!requireAuthOrOpenSettings()) return;
    uploadInputRef.current?.click();
  };

  const uploadFile = async (file) => {
    if (!file) return;
    if (!requireAuthOrOpenSettings()) return;

    setIsBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("prefix", "images");

      const res = await fetch("/api/write/assets", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        if (res.status === 401) {
          await refreshSession();
          setIsSettingsOpen(true);
        }
        showToast(data?.error || "上传失败");
        return;
      }

      const url = data.url;
      const fallbackAlt = file.name.replace(/\.[a-z0-9]+$/i, "");
      insertAtSelection((selected) => `<img src="${url}" alt="${selected || fallbackAlt}" width="500" />`);
      showToast("图片已插入");
    } finally {
      setIsBusy(false);
    }
  };

  const handleUploadChange = async (event) => {
    const file = event.target.files?.[0];
    await uploadFile(file);
    event.target.value = "";
  };

  const handlePaste = async (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadFile(file);
        }
        return;
      }
    }
  };

  const handleImageResize = useCallback((src, newWidth) => {
    setContent((prev) => {
      // Match <img ... src="THE_SRC" ... width="XXX" ... />
      const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        `(<img[^>]*src=["']${escapedSrc}["'][^>]*width=["'])\\d+(["'][^>]*\\/?>)`,
        "g"
      );
      return prev.replace(regex, `$1${Math.round(newWidth)}$2`);
    });
  }, []);

  const resetDraft = () => {
    setSlug("");
    setTitle("");
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setTags("");
    setCover("");
    setContent("");
    setLoadedStatus("");
    router.replace("/write");
    showToast("已新建空白稿");
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col text-wafu-sumi">
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadChange}
      />
      <header className="sticky top-0 z-50 h-14 border-b border-wafu-sumi/10 bg-wafu-paper/60 px-4 backdrop-blur-md">
        <div className="flex h-full items-center justify-between gap-4">
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
              {slug
                ? `${slug} · ${loadedStatus ? String(loadedStatus).toUpperCase() : "NEW"}`
                : "DRAFTING..."}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen((open) => !open)}
              aria-label="设置"
              title="设置"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/60 hover:text-erii-red ${isSettingsOpen ? "text-erii-red" : "text-wafu-sumi/55"
                }`}
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isBusy}
              aria-label="保存草稿"
              title="保存草稿"
              className="rounded-full border border-wafu-sumi/10 bg-white/60 px-4 py-2 text-[11px] font-serif tracking-[0.18em] text-wafu-sumi/70 transition-colors hover:bg-white/80 hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
            >
              草稿
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isBusy}
              aria-label="奉纳（发布）"
              title="奉纳（发布）"
              className="grid h-10 w-10 place-items-center rounded-md bg-wafu-sumi text-wafu-paper shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
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
        className={`fixed inset-0 z-[60] transition ${isSettingsOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
      >
        <div
          className={`absolute inset-0 bg-wafu-sumi/10 backdrop-blur-sm transition-opacity ${isSettingsOpen ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => setIsSettingsOpen(false)}
        />
        <div className="absolute left-0 right-0 top-0">
          <div
            role="dialog"
            aria-modal={isSettingsOpen}
            aria-label="设置"
            className={`mx-auto max-w-4xl origin-top rounded-b-3xl border border-wafu-sumi/10 bg-wafu-paper/80 p-6 shadow-lg backdrop-blur transition-transform duration-300 ${isSettingsOpen ? "translate-y-0" : "-translate-y-full"
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
                <span className="text-xs text-wafu-sumi/60">slug</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border-b border-dashed border-wafu-sumi/20 bg-transparent px-1 py-2 text-sm font-mono text-wafu-sumi outline-none placeholder:text-wafu-sumi/30 focus:border-erii-red caret-erii-red"
                  placeholder="auto"
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

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs text-wafu-sumi/55">
                  {isAuthed
                    ? "会话：已登录（发布/草稿/上传可用）"
                    : "会话：未登录（仅下载/复制）"}
                </p>
                {!isAuthed ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 border-b border-dashed border-wafu-sumi/20 bg-transparent px-1 py-2 text-sm font-mono text-wafu-sumi outline-none placeholder:text-wafu-sumi/30 focus:border-erii-red caret-erii-red"
                      placeholder="口令…"
                    />
                    <button
                      type="button"
                      onClick={handleLogin}
                      disabled={isBusy}
                      className="rounded-full border border-wafu-sumi/10 bg-white/60 px-4 py-2 text-xs text-wafu-sumi/80 transition-colors hover:bg-white/80 hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      登录
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadDraft(slug)}
                      disabled={isBusy || isDraftLoading}
                      className="rounded-full border border-wafu-sumi/10 bg-white/60 px-4 py-2 text-xs text-wafu-sumi/80 transition-colors hover:bg-white/80 hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      载入（slug）
                    </button>
                    <button
                      type="button"
                      onClick={resetDraft}
                      disabled={isBusy}
                      className="rounded-full border border-wafu-sumi/10 bg-white/60 px-4 py-2 text-xs text-wafu-sumi/80 transition-colors hover:bg-white/80 hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      新稿
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isBusy}
                      className="rounded-full border border-wafu-sumi/10 bg-white/60 px-4 py-2 text-xs text-wafu-sumi/80 transition-colors hover:bg-white/80 hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      退出
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 md:justify-end">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-full border border-wafu-sumi/10 bg-white/60 px-4 py-2 text-xs text-wafu-sumi/80 transition-colors hover:bg-white/80 hover:text-erii-red"
                >
                  <Code size={16} />
                  <span>下载 MDX</span>
                </button>
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

            {isAuthed ? (
              <section className="mt-6 rounded-2xl border border-wafu-sumi/10 bg-white/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="select-none font-serif text-xs tracking-[0.28em] text-wafu-sumi/60">
                    POSTS
                  </div>
                  <button
                    type="button"
                    onClick={refreshPostIndex}
                    disabled={isPostIndexLoading}
                    className="rounded-full border border-wafu-sumi/10 bg-white/60 px-4 py-2 text-xs text-wafu-sumi/80 transition-colors hover:bg-white/80 hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPostIndexLoading ? "刷新中…" : "刷新"}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1">
                    <span className="text-[11px] text-wafu-sumi/55">筛选</span>
                    <select
                      value={postIndexFilter}
                      onChange={(e) => setPostIndexFilter(e.target.value)}
                      className="w-full rounded-lg border border-dashed border-wafu-sumi/15 bg-white/40 px-3 py-2 text-sm text-wafu-sumi outline-none focus:border-erii-red"
                    >
                      <option value="all">全部</option>
                      <option value="draft">草稿</option>
                      <option value="published">已发布</option>
                    </select>
                  </label>
                  <label className="grid gap-1 md:col-span-2">
                    <span className="text-[11px] text-wafu-sumi/55">搜索</span>
                    <input
                      value={postIndexQuery}
                      onChange={(e) => setPostIndexQuery(e.target.value)}
                      className="w-full rounded-lg border border-dashed border-wafu-sumi/15 bg-white/40 px-3 py-2 text-sm text-wafu-sumi outline-none placeholder:text-wafu-sumi/30 focus:border-erii-red caret-erii-red"
                      placeholder="标题或 slug"
                    />
                  </label>
                </div>

                <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-wafu-sumi/10 bg-white/30">
                  {filteredPostIndex.length ? (
                    <ul className="divide-y divide-wafu-sumi/10">
                      {filteredPostIndex.map((post) => (
                        <li
                          key={post.slug}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm text-wafu-sumi">
                              {post.title || post.slug}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-wafu-sumi/55">
                              <span className="font-mono">{post.slug}</span>
                              <span className="h-1 w-1 rounded-full bg-wafu-sumi/25" />
                              <span className="font-mono">
                                {String(post.date ?? "").slice(0, 10)}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-wafu-sumi/25" />
                              <span className="rounded-full border border-wafu-sumi/10 bg-white/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                                {post.status}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => loadDraft(post.slug)}
                            disabled={isBusy || isDraftLoading}
                            className="shrink-0 rounded-full border border-wafu-sumi/10 bg-white/60 px-4 py-2 text-xs text-wafu-sumi/80 transition-colors hover:bg-white/80 hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            载入
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-6 text-center text-xs text-wafu-sumi/55">
                      {isPostIndexLoading ? "加载中…" : "暂无文章"}
                    </div>
                  )}
                </div>
              </section>
            ) : null}
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
              onPaste={handlePaste}
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
                  onClick={handlePickImage}
                  tooltip={isAuthed ? "上传图片" : "上传图片（需登录）"}
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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: ({ src, alt, width }) => (
                      <ResizableImage
                        src={src}
                        alt={alt}
                        width={width}
                        onResize={handleImageResize}
                      />
                    ),
                  }}
                >
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
