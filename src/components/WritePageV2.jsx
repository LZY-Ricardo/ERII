"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (urlSlug && isAuthed) {
      loadDraft(urlSlug);
    }
  }, [urlSlug, isAuthed]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/write/session");
      setIsAuthed(res.ok);
    } catch {
      setIsAuthed(false);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loadDraft = async (slug) => {
    try {
      const res = await fetch(`/api/write/posts/${slug}`);
      if (res.ok) {
        const data = await res.json();
        const post = data.post || data;
        setMetadata({
          slug: post.slug || "",
          title: post.title || "",
          date: post.date || new Date().toISOString().split("T")[0],
          description: post.description || "",
          tags: post.tags || "",
          cover: post.cover || "",
        });
        setContent(post.content || "");
        setPostStatus(post.status || "draft");
        showToast("草稿已加载");
      }
    } catch (err) {
      showToast("加载失败");
    }
  };

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const handleSave = async () => {
    if (!metadata.slug || !metadata.title) {
      showToast("请填写 slug 和标题");
      return;
    }
    setIsBusy(true);
    try {
      const res = await fetch("/api/write/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...metadata, content }),
      });
      if (res.ok) {
        showToast("草稿已保存");
        router.replace(`/write?slug=${metadata.slug}`);
      } else {
        showToast("保存失败");
      }
    } catch {
      showToast("保存失败");
    } finally {
      setIsBusy(false);
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

  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center">加载中...</div>;
  }

  if (!isAuthed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4">请先登录</p>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-md bg-wafu-sumi px-4 py-2 text-wafu-paper"
          >
            打开设置
          </button>
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
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="text-wafu-sumi/55 hover:text-erii-red"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={handleSave}
            disabled={isBusy}
            className="rounded-full border border-wafu-sumi/10 bg-white/60 px-4 py-2 text-xs text-wafu-sumi/70 hover:bg-white/80 disabled:opacity-60"
          >
            草稿
          </button>
          <button
            onClick={handlePublish}
            disabled={isBusy}
            className="rounded-md bg-wafu-sumi px-4 py-2 text-xs text-wafu-paper hover:opacity-90 disabled:opacity-60"
          >
            发布
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
