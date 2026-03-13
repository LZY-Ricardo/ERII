"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Editor } from "@bytemd/react";
import gfm from "@bytemd/plugin-gfm";
import highlight from "@bytemd/plugin-highlight";
import frontmatter from "@bytemd/plugin-frontmatter";
import { Home, Settings } from "lucide-react";
import Link from "next/link";
import bytemdZhHans from "bytemd/locales/zh_Hans.json";
import gfmZhHans from "@bytemd/plugin-gfm/locales/zh_Hans.json";
import "bytemd/dist/index.css";

const plugins = [gfm({ locale: gfmZhHans }), highlight(), frontmatter()];

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
  const [toast, setToast] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState("idle");
  const [autoSaveAt, setAutoSaveAt] = useState("");
  const autoSaveTimerRef = useRef(null);
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

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const loadDraft = useCallback(
    async (slug) => {
      try {
        const res = await fetch(`/api/write/posts/${slug}`);
        if (res.ok) {
          const data = await res.json();
          const post = data.post || data;
          const nextMeta = {
            slug: post.slug || "",
            title: post.title || "",
            date: post.date || new Date().toISOString().split("T")[0],
            description: post.description || "",
            tags: post.tags || "",
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
          showToast("草稿已加载");
        }
      } catch {
        showToast("加载失败");
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
      showToast("请填写 slug 和标题");
      return;
    }
    setIsBusy(true);
    try {
      const payload = buildDraftPayload();
      const result = await postDraft(payload);
      if (!result.ok) {
        showToast(result.error || "保存失败");
        return;
      }
      applySavedDraft(payload, result.data);
      showToast("草稿已保存");
    } catch {
      showToast("保存失败");
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
      showToast("登录成功");
    } catch {
      setAuthError("网络错误，请重试");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePublish = async () => {
    if (!metadata.slug || !metadata.title) {
      showToast("请填写 slug 和标题");
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
        showToast("发布成功");
      } else {
        showToast("发布失败");
      }
    } catch {
      showToast("发布失败");
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

      {toast && (
        <div className="fixed right-6 top-16 z-50 rounded-full border border-wafu-sumi/10 bg-wafu-paper/90 px-4 py-2 text-xs shadow-lg">
          {toast}
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setIsSettingsOpen(false)}>
          <div className="absolute right-0 top-14 w-96 bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">文章设置</h2>
            <div className="space-y-4">
              <input
                placeholder="Slug"
                value={metadata.slug}
                onChange={(e) => setMetadata({ ...metadata, slug: e.target.value })}
                className="w-full rounded border p-2"
              />
              <input
                placeholder="标题"
                value={metadata.title}
                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                className="w-full rounded border p-2"
              />
              <input
                type="date"
                value={metadata.date}
                onChange={(e) => setMetadata({ ...metadata, date: e.target.value })}
                className="w-full rounded border p-2"
              />
              <input
                placeholder="描述"
                value={metadata.description}
                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                className="w-full rounded border p-2"
              />
              <input
                placeholder="标签 (逗号分隔)"
                value={metadata.tags}
                onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                className="w-full rounded border p-2"
              />
              <input
                placeholder="封面图 URL"
                value={metadata.cover}
                onChange={(e) => setMetadata({ ...metadata, cover: e.target.value })}
                className="w-full rounded border p-2"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative min-h-0" style={{
        position: 'relative'
      }}>
        <style jsx global>{`
          .bytemd {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            height: 100% !important;
          }
          .bytemd-body {
            height: calc(100% - 58px) !important;
          }
          .bytemd-editor, .bytemd-preview {
            height: 100% !important;
          }
          .CodeMirror {
            height: 100% !important;
          }
        `}</style>
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
