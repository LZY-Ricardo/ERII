"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Editor } from "@bytemd/react";
import gfm from "@bytemd/plugin-gfm";
import highlight from "@bytemd/plugin-highlight";
import frontmatter from "@bytemd/plugin-frontmatter";
import { CheckCircle2, CircleAlert, Home, Info, Settings, X } from "lucide-react";
import Link from "next/link";
import bytemdZhHans from "bytemd/locales/zh_Hans.json";
import gfmZhHans from "@bytemd/plugin-gfm/locales/zh_Hans.json";
import "bytemd/dist/index.css";
import "./WritePageV2.css";

const plugins = [gfm({ locale: gfmZhHans }), highlight(), frontmatter()];

const CATEGORY_OPTIONS = [
  "未分类",
  "TeamSpeak",
  "电脑技巧",
  "直播",
  "游戏",
  "音乐",
  "影视",
];

function parseTagsInput(raw) {
  return String(raw ?? "")
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatTagsInput(tags) {
  const unique = [];
  for (const tag of tags) {
    if (!unique.includes(tag)) unique.push(tag);
  }
  return unique.join(", ");
}

function getCategoryFromTags(raw) {
  const tags = parseTagsInput(raw);
  const match = tags.find((tag) => CATEGORY_OPTIONS.includes(tag));
  return match || "未分类";
}

function applyCategoryToTags(rawTags, category) {
  const tags = parseTagsInput(rawTags).filter(
    (tag) => !CATEGORY_OPTIONS.includes(tag)
  );

  if (category && category !== "未分类") {
    tags.unshift(category);
  }

  return formatTagsInput(tags);
}

export default function WritePageV2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSlug = searchParams.get("slug") || "";

  const [content, setContent] = useState("");
  const [metadata, setMetadata] = useState({
    slug: "",
    title: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    tags: "",
    cover: "",
  });
  const [postStatus, setPostStatus] = useState("draft");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState("idle");
  const [autoSaveAt, setAutoSaveAt] = useState("");
  const autoSaveTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const autoSaveInFlightRef = useRef(false);
  const pendingAutoSaveRef = useRef(false);
  const lastSavedSignatureRef = useRef("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/write/session");
      const data = await res.json().catch(() => null);
      setIsAuthed(Boolean(data?.authenticated));
    } catch {
      setIsAuthed(false);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const buildDraftPayload = useCallback(
    () => ({
      slug: metadata.slug,
      title: metadata.title,
      date: metadata.date,
      description: metadata.description,
      tags: metadata.tags,
      cover: metadata.cover,
      content,
    }),
    [metadata, content]
  );

  const hasDraftContent = useCallback(() => {
    const title = String(metadata.title ?? "").trim();
    const body = String(content ?? "").trim();
    return Boolean(title || body);
  }, [metadata.title, content]);

  const applySavedDraft = useCallback(
    (payload, data, { updateAutoSave } = {}) => {
      const savedSlug = data?.slug || data?.post?.slug || payload.slug || "";
      if (savedSlug && savedSlug !== metadata.slug) {
        setMetadata((prev) => ({ ...prev, slug: savedSlug }));
      }
      if (savedSlug && savedSlug !== urlSlug) {
        router.replace(`/write?slug=${savedSlug}`);
      }
      const signaturePayload = { ...payload, slug: savedSlug || payload.slug };
      lastSavedSignatureRef.current = JSON.stringify(signaturePayload);
      if (updateAutoSave) {
        setAutoSaveAt(
          new Date().toLocaleTimeString("zh-CN", { hour12: false })
        );
        setAutoSaveState("saved");
      }
    },
    [metadata.slug, router, urlSlug]
  );

  const postDraft = useCallback(async (payload) => {
    const res = await fetch("/api/write/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || "保存失败" };
    }
    return { ok: true, data };
  }, []);

  const showToast = useCallback((message, tone = "info") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({
      id: Date.now(),
      message,
      tone,
    });

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const loadDraft = useCallback(
    async (slug) => {
      try {
        const res = await fetch(`/api/write/posts/${slug}`);
        if (res.ok) {
          const data = await res.json();
          const post = data.post || data;
          const tagText = Array.isArray(post.tags)
            ? post.tags.join(", ")
            : String(post.tags ?? "");
          const nextMeta = {
            slug: post.slug || "",
            title: post.title || "",
            date: post.date || new Date().toISOString().split("T")[0],
            description: post.description || "",
            tags: tagText,
            cover: post.cover || "",
          };
          setMetadata(nextMeta);
          const nextContent = post.content || "";
          setContent(nextContent);
          setPostStatus(post.status || "draft");
          lastSavedSignatureRef.current = JSON.stringify({
            ...nextMeta,
            content: nextContent,
          });
          showToast("草稿已加载", "info");
        }
      } catch {
        showToast("加载失败", "error");
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (urlSlug && isAuthed) {
      loadDraft(urlSlug);
    }
  }, [isAuthed, loadDraft, urlSlug]);

  const handleSave = async () => {
    if (!metadata.slug || !metadata.title) {
      showToast("请填写 slug 和标题", "error");
      return;
    }
    setIsBusy(true);
    try {
      const payload = buildDraftPayload();
      const result = await postDraft(payload);
      if (!result.ok) {
        showToast(result.error || "保存失败", "error");
        return;
      }
      applySavedDraft(payload, result.data);
      showToast("草稿已保存", "success");
    } catch {
      showToast("保存失败", "error");
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!authPassword.trim()) {
      setAuthError("请输入写作密码");
      return;
    }

    setAuthError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/write/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: authPassword }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setAuthError(data?.error || "登录失败");
        return;
      }

      setAuthPassword("");
      setIsAuthed(true);
      showToast("登录成功", "success");
    } catch {
      setAuthError("网络错误，请重试");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePublish = async () => {
    if (!metadata.slug || !metadata.title) {
      showToast("请填写 slug 和标题", "error");
      return;
    }
    setIsBusy(true);
    try {
      const res = await fetch("/api/write/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...metadata, content }),
      });
      if (res.ok) {
        showToast("发布成功", "success");
      } else {
        showToast("发布失败", "error");
      }
    } catch {
      showToast("发布失败", "error");
    } finally {
      setIsBusy(false);
    }
  };

  const uploadImages = async (files) => {
    const uploaded = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/write/assets", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploaded.push({ url: data.url, alt: file.name });
        }
      } catch {}
    }
    return uploaded;
  };

  const performAutoSave = useCallback(async () => {
    if (!isAuthed || !hasDraftContent()) return;
    const payload = buildDraftPayload();
    const signature = JSON.stringify(payload);
    if (signature === lastSavedSignatureRef.current) return;

    if (autoSaveInFlightRef.current) {
      pendingAutoSaveRef.current = true;
      return;
    }

    autoSaveInFlightRef.current = true;
    setAutoSaveState("saving");
    const result = await postDraft(payload);
    autoSaveInFlightRef.current = false;

    if (result.ok) {
      applySavedDraft(payload, result.data, { updateAutoSave: true });
    } else {
      setAutoSaveState("error");
    }

    if (pendingAutoSaveRef.current) {
      pendingAutoSaveRef.current = false;
      setTimeout(() => {
        performAutoSave();
      }, 0);
    }
  }, [applySavedDraft, buildDraftPayload, hasDraftContent, isAuthed, postDraft]);

  useEffect(() => {
    if (!isAuthed) {
      setAutoSaveState("disabled");
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      return;
    }

    if (!hasDraftContent()) {
      setAutoSaveState("idle");
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      return;
    }

    const signature = JSON.stringify(buildDraftPayload());
    if (signature === lastSavedSignatureRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 5000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [buildDraftPayload, hasDraftContent, isAuthed, performAutoSave]);

  const autoSaveLabel = (() => {
    if (!isAuthed || !hasDraftContent()) return "";
    if (autoSaveState === "saving") return "自动保存中…";
    if (autoSaveState === "saved") {
      return autoSaveAt ? `已自动保存 ${autoSaveAt}` : "已自动保存";
    }
    if (autoSaveState === "error") return "自动保存失败";
    return "";
  })();

  const selectedCategory = getCategoryFromTags(metadata.tags);
  const normalizedCover = String(metadata.cover ?? "").trim();
  const hasCoverPreview = /^https?:\/\/\S+$/i.test(normalizedCover);

  const toastConfig = toast
    ? {
        success: {
          icon: CheckCircle2,
          eyebrow: "完成",
          panelClass:
            "border-emerald-200/80 bg-white/95 text-emerald-950 shadow-[0_18px_50px_rgba(5,150,105,0.18)]",
          iconClass: "bg-emerald-100 text-emerald-700",
          eyebrowClass: "text-emerald-700/80",
        },
        error: {
          icon: CircleAlert,
          eyebrow: "注意",
          panelClass:
            "border-rose-200/90 bg-white/95 text-rose-950 shadow-[0_18px_50px_rgba(225,29,72,0.18)]",
          iconClass: "bg-rose-100 text-rose-700",
          eyebrowClass: "text-rose-700/80",
        },
        info: {
          icon: Info,
          eyebrow: "提示",
          panelClass:
            "border-stone-200/90 bg-white/95 text-stone-900 shadow-[0_18px_50px_rgba(68,64,60,0.16)]",
          iconClass: "bg-stone-100 text-stone-700",
          eyebrowClass: "text-stone-600/80",
        },
      }[toast.tone] ?? {
        icon: Info,
        eyebrow: "提示",
        panelClass:
          "border-stone-200/90 bg-white/95 text-stone-900 shadow-[0_18px_50px_rgba(68,64,60,0.16)]",
        iconClass: "bg-stone-100 text-stone-700",
        eyebrowClass: "text-stone-600/80",
      }
    : null;
  const ToastIcon = toastConfig?.icon ?? Info;

  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center">加载中...</div>;
  }

  if (!isAuthed) {
    return (
      <div className="flex h-screen items-center justify-center bg-wafu-paper px-4">
        <div className="w-full max-w-sm rounded-2xl border border-wafu-sumi/10 bg-white/85 p-8 shadow-xl shadow-black/5 backdrop-blur">
          <p className="text-center text-lg font-semibold text-wafu-sumi">请先登录</p>
          <p className="mt-2 text-center text-sm text-wafu-sumi/55">
            输入写作密码后进入编辑器
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <input
              type="password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder="写作密码"
              autoFocus
              className="w-full rounded-xl border border-wafu-sumi/10 bg-wafu-paper/60 px-4 py-3 text-sm text-wafu-sumi outline-none transition focus:border-erii-red/40 focus:bg-white"
            />

            {authError ? (
              <p className="text-sm text-[#be123c]">{authError}</p>
            ) : null}

            <button
              type="submit"
              disabled={isLoggingIn || !authPassword.trim()}
              className="w-full rounded-xl bg-wafu-sumi px-4 py-3 text-sm font-medium text-wafu-paper transition hover:bg-[#2e2a26] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingIn ? "登录中…" : "登录"}
            </button>
          </form>

          <Link
            href="/admin/login?from=/write"
            className="mt-4 block text-center text-xs text-wafu-sumi/45 transition hover:text-erii-red"
          >
            或前往后台登录页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex h-14 items-center justify-between border-b border-wafu-sumi/10 bg-wafu-paper/80 px-4 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/" className="text-wafu-sumi/55 hover:text-erii-red shrink-0">
            <Home size={18} />
          </Link>
          <div className="relative w-[calc(50vw-2rem)] min-w-0">
            <input
              type="text"
              placeholder="输入文章标题…"
              value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              className="w-full rounded-lg border border-wafu-sumi/8 bg-white/50 px-3 py-1.5 text-base font-medium text-wafu-sumi outline-none transition-all placeholder:text-wafu-sumi/30 focus:border-wafu-sumi/20 focus:bg-white/80 focus:shadow-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-wafu-sumi/45">
            文章将自动保存至草稿箱
          </span>
          {autoSaveLabel ? (
            <span className="text-[11px] text-wafu-sumi/55">{autoSaveLabel}</span>
          ) : null}
          <Link
            href="/admin/posts?tab=draft"
            className="rounded-full border border-wafu-sumi/10 bg-white/60 px-3 py-1.5 text-[11px] text-wafu-sumi/70 hover:bg-white/80"
          >
            草稿箱
          </Link>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="text-wafu-sumi/55 hover:text-erii-red"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={handlePublish}
            disabled={isBusy}
            className="rounded-full bg-[#e11d48] px-5 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-[#e11d48]/40 transition hover:bg-[#be123c] hover:shadow-md disabled:opacity-60"
          >
            发布文章
          </button>
        </div>
      </header>

      {toast && toastConfig ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 sm:bottom-8">
          <div
            role={toast.tone === "error" ? "alert" : "status"}
            aria-live={toast.tone === "error" ? "assertive" : "polite"}
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md animate-[write-toast-in_240ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none ${toastConfig.panelClass}`}
          >
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toastConfig.iconClass}`}
            >
              <ToastIcon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${toastConfig.eyebrowClass}`}
              >
                {toastConfig.eyebrow}
              </p>
              <p className="mt-1 text-sm font-medium leading-5 text-current">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {isSettingsOpen && (
        <div
          className="write-settings-overlay"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="write-settings-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="write-settings-title"
          >
            <span className="write-settings-glow" aria-hidden />

            <div className="write-settings-header">
              <div className="write-settings-heading">
                <span className="write-settings-kicker">Article Meta</span>
                <h2 id="write-settings-title">文章设置</h2>
                <p>
                  保存后会影响文章列表、分类与展示样式
                </p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="write-settings-close"
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>

            <div className="write-settings-body">
              <section className="write-settings-section">
                <h3 className="write-section-title">基础信息</h3>
                <div className="write-field-grid">
                  <label className="write-field">
                    <span>标题</span>
                    <input
                      placeholder="输入文章标题"
                      value={metadata.title}
                      onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                      className="write-input"
                    />
                  </label>

                  <div className="write-field-grid write-field-grid--2">
                    <label className="write-field">
                      <span>Slug</span>
                      <input
                        placeholder="例如 ai-usage-guide"
                        value={metadata.slug}
                        onChange={(e) => setMetadata({ ...metadata, slug: e.target.value })}
                        className="write-input"
                      />
                    </label>

                    <label className="write-field">
                      <span>日期</span>
                      <input
                        type="date"
                        value={metadata.date}
                        onChange={(e) => setMetadata({ ...metadata, date: e.target.value })}
                        className="write-input"
                      />
                    </label>
                  </div>

                  <label className="write-field">
                    <span>描述</span>
                    <input
                      placeholder="用于文章简介与分享摘要"
                      value={metadata.description}
                      onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                      className="write-input"
                    />
                  </label>
                </div>
              </section>

              <section className="write-settings-section">
                <h3 className="write-section-title">标签与分类</h3>
                <div className="write-field-grid">
                  <label className="write-field">
                    <span>标签</span>
                    <input
                      placeholder="标签 (逗号分隔)"
                      value={metadata.tags}
                      onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                      className="write-input"
                    />
                  </label>

                  <div className="write-category-box">
                    <label className="write-field">
                      <span>分类</span>
                      <select
                        value={selectedCategory}
                        onChange={(e) =>
                          setMetadata((prev) => ({
                            ...prev,
                            tags: applyCategoryToTags(prev.tags, e.target.value),
                          }))
                        }
                        className="write-input write-select"
                      >
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="write-help">分类会写入标签，用于博客页筛选展示。</p>
                  </div>
                </div>
              </section>

              <section className="write-settings-section">
                <h3 className="write-section-title">视觉信息</h3>
                <div className="write-field-grid">
                  <label className="write-field">
                    <span>封面图 URL</span>
                    <input
                      placeholder="https://..."
                      value={metadata.cover}
                      onChange={(e) => setMetadata({ ...metadata, cover: e.target.value })}
                      className="write-input"
                    />
                  </label>

                  {hasCoverPreview ? (
                    <div
                      className="write-cover-preview"
                      style={{ backgroundImage: `url(${normalizedCover})` }}
                    >
                      <div className="write-cover-preview-mask" />
                      <span>封面预览</span>
                    </div>
                  ) : null}
                </div>
              </section>

              <p className="write-settings-note">
                建议标题控制在 20~32 字，描述控制在 80~140 字，能提升列表页与搜索展示效果。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative min-h-0">
        <Editor
              value={content}
              plugins={plugins}
              onChange={setContent}
              uploadImages={uploadImages}
              placeholder="输入文章标题..."
              locale={bytemdZhHans}
            />
      </div>
    </div>
  );
}
