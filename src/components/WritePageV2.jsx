"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Editor } from "@bytemd/react";
import gfm from "@bytemd/plugin-gfm";
import highlight from "@bytemd/plugin-highlight";
import frontmatter from "@bytemd/plugin-frontmatter";
import {
  CheckCircle2,
  CircleAlert,
  Home,
  ImagePlus,
  Info,
  Loader2,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import bytemdZhHans from "bytemd/locales/zh_Hans.json";
import gfmZhHans from "@bytemd/plugin-gfm/locales/zh_Hans.json";
import {
  inferCategoryFromText,
  normalizeCategoryValue,
  POST_CATEGORY_OPTIONS,
} from "@/src/lib/postTaxonomy";
import "bytemd/dist/index.css";
import "./WritePageV2.css";

const plugins = [gfm({ locale: gfmZhHans }), highlight(), frontmatter()];

function createEmptyMetadata() {
  return {
    slug: "",
    title: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    tags: "",
    cover: "",
  };
}

function createEmptySourceMeta() {
  return {
    editorSource: "",
    sourceRef: "",
    sourceUpdatedAt: "",
  };
}

function createDraftSignature(payload) {
  return JSON.stringify({
    originalSlug: payload?.originalSlug || "",
    slug: payload?.slug || "",
    title: payload?.title || "",
    date: payload?.date || "",
    description: payload?.description || "",
    tags: payload?.tags || "",
    cover: payload?.cover || "",
    content: payload?.content || "",
  });
}

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

function getCategoryFromDraft(title, rawTags) {
  const tags = parseTagsInput(rawTags);
  const explicitCategory = tags.map((tag) => normalizeCategoryValue(tag)).find(Boolean);
  if (explicitCategory) return explicitCategory;
  return inferCategoryFromText(title, tags.join(" "));
}

function applyCategoryToTags(rawTags, category) {
  const normalizedCategory = normalizeCategoryValue(category) || "未分类";
  const tags = parseTagsInput(rawTags).filter((tag) => !normalizeCategoryValue(tag));

  if (normalizedCategory !== "未分类") {
    tags.unshift(normalizedCategory);
  }

  return formatTagsInput(tags);
}

function getJuejinImportStatusMeta(status) {
  if (status === "imported") {
    return {
      label: "已导入",
      pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      helperClass: "text-emerald-700/80",
    };
  }

  if (status === "skipped") {
    return {
      label: "已跳过",
      pillClass: "bg-amber-50 text-amber-700 border-amber-200/80",
      helperClass: "text-amber-700/80",
    };
  }

  return {
    label: "失败",
    pillClass: "bg-rose-50 text-rose-700 border-rose-200/80",
    helperClass: "text-rose-700/80",
  };
}

export default function WritePageV2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSlug = searchParams.get("slug") || "";

  const [content, setContent] = useState("");
  const [metadata, setMetadata] = useState(createEmptyMetadata);
  const [sourceMeta, setSourceMeta] = useState(createEmptySourceMeta);
  const [originalSlug, setOriginalSlug] = useState("");
  const [postStatus, setPostStatus] = useState("draft");
  const [hasWorkingDraft, setHasWorkingDraft] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isJuejinImportOpen, setIsJuejinImportOpen] = useState(false);
  const [juejinImportMode, setJuejinImportMode] = useState("profile");
  const [juejinProfileInput, setJuejinProfileInput] = useState("");
  const [juejinArticleInput, setJuejinArticleInput] = useState("");
  const [isJuejinImporting, setIsJuejinImporting] = useState(false);
  const [juejinImportResult, setJuejinImportResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverLocalPreview, setCoverLocalPreview] = useState("");
  const [autoSaveState, setAutoSaveState] = useState("idle");
  const [autoSaveAt, setAutoSaveAt] = useState("");
  const autoSaveTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const autoSaveInFlightRef = useRef(false);
  const pendingAutoSaveRef = useRef(false);
  const lastSavedSignatureRef = useRef("");
  const coverFileInputRef = useRef(null);

  const resetEditor = useCallback(() => {
    setContent("");
    setMetadata(createEmptyMetadata());
    setSourceMeta(createEmptySourceMeta());
    setOriginalSlug("");
    setPostStatus("draft");
    setHasWorkingDraft(false);
    setIsCoverUploading(false);
    setCoverLocalPreview("");
    setAutoSaveState("idle");
    setAutoSaveAt("");
    lastSavedSignatureRef.current = "";
  }, []);

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
      originalSlug: originalSlug || undefined,
      slug: metadata.slug,
      title: metadata.title,
      date: metadata.date,
      description: metadata.description,
      tags: metadata.tags,
      cover: metadata.cover,
      editorSource: sourceMeta.editorSource || undefined,
      sourceRef: sourceMeta.sourceRef || undefined,
      sourceUpdatedAt: sourceMeta.sourceUpdatedAt || undefined,
      content,
    }),
    [content, metadata, originalSlug, sourceMeta]
  );

  const hasDraftContent = useCallback(() => {
    const title = String(metadata.title ?? "").trim();
    const body = String(content ?? "").trim();
    return Boolean(title || body);
  }, [metadata.title, content]);

  const isPublishedPost = postStatus === "published";
  const saveTargetLabel = isPublishedPost ? "修改稿" : "草稿";
  const autoSaveHint = isPublishedPost
    ? "修改会自动保存到草稿箱，线上文章暂不受影响"
    : "文章将自动保存至草稿箱";

  const applySavedDraft = useCallback(
    (payload, data, { updateAutoSave } = {}) => {
      const savedSlug = data?.slug || data?.post?.slug || payload.slug || "";
      const responseOriginalSlug =
        data?.originalSlug || data?.post?.originalSlug || payload.originalSlug || savedSlug;
      const editorLookupSlug =
        data?.editorLookupSlug ||
        data?.post?.editorLookupSlug ||
        savedSlug ||
        responseOriginalSlug;
      const savedStatus = data?.post?.status || data?.status || "";
      const nextHasWorkingDraft = Boolean(
        data?.post?.hasWorkingDraft ?? data?.hasWorkingDraft ?? false
      );
      if (savedSlug && savedSlug !== metadata.slug) {
        setMetadata((prev) => ({ ...prev, slug: savedSlug }));
      }
      setSourceMeta({
        editorSource:
          data?.post?.editorSource || data?.editorSource || payload.editorSource || "",
        sourceRef: data?.post?.sourceRef || data?.sourceRef || payload.sourceRef || "",
        sourceUpdatedAt:
          data?.post?.sourceUpdatedAt ||
          data?.sourceUpdatedAt ||
          payload.sourceUpdatedAt ||
          "",
      });
      setOriginalSlug(responseOriginalSlug || "");
      if (savedStatus) {
        setPostStatus(savedStatus);
      }
      setHasWorkingDraft(nextHasWorkingDraft);
      if (editorLookupSlug && editorLookupSlug !== urlSlug) {
        router.replace(`/write?slug=${editorLookupSlug}`);
      }
      const signaturePayload = {
        ...payload,
        originalSlug: responseOriginalSlug || payload.originalSlug,
        slug: savedSlug || payload.slug,
      };
      lastSavedSignatureRef.current = createDraftSignature(signaturePayload);
      if (updateAutoSave) {
        setAutoSaveAt(
          new Date().toLocaleTimeString("zh-CN", { hour12: false })
        );
        setAutoSaveState("saved");
      }
    },
    [metadata.slug, router, urlSlug]
  );

  const postDraft = useCallback(async (payload, { keepalive = false } = {}) => {
    const res = await fetch("/api/write/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || "保存失败" };
    }
    return { ok: true, data };
  }, []);

  const postWorkingDraft = useCallback(
    async (payload, { keepalive = false } = {}) => {
      const publishedSlug = payload.originalSlug || originalSlug || payload.slug;
      if (!publishedSlug) {
        return { ok: false, error: "缺少已发布文章 slug" };
      }

      const res = await fetch(
        `/api/write/posts/${encodeURIComponent(publishedSlug)}/working-draft`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive,
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        return { ok: false, error: data?.error || "保存失败" };
      }
      return { ok: true, data };
    },
    [originalSlug]
  );

  const persistEditorState = useCallback(
    async (payload, options = {}) => {
      if (isPublishedPost) {
        return postWorkingDraft(payload, options);
      }
      return postDraft(payload, options);
    },
    [isPublishedPost, postDraft, postWorkingDraft]
  );

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

  useEffect(() => {
    return () => {
      if (coverLocalPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverLocalPreview);
      }
    };
  }, [coverLocalPreview]);

  useEffect(() => {
    if (!isAuthed || urlSlug) return;
    resetEditor();
  }, [isAuthed, resetEditor, urlSlug]);

  useEffect(() => {
    setJuejinImportResult(null);
  }, [juejinImportMode]);

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
          setSourceMeta({
            editorSource: post.editorSource || "",
            sourceRef: post.sourceRef || "",
            sourceUpdatedAt: post.sourceUpdatedAt || "",
          });
          setOriginalSlug(post.originalSlug || post.slug || "");
          const nextContent = post.content || "";
          setContent(nextContent);
          setPostStatus(post.status || "draft");
          setHasWorkingDraft(Boolean(post.hasWorkingDraft));
          setAutoSaveState("idle");
          setAutoSaveAt("");
          lastSavedSignatureRef.current = createDraftSignature({
            originalSlug: post.originalSlug || post.slug || "",
            ...nextMeta,
            content: nextContent,
          });
          showToast(post.hasWorkingDraft ? "已恢复未发布修改" : "文章已加载", "info");
        }
      } catch {
        showToast("加载失败", "error");
      }
    },
    [showToast]
  );

  const hasUnsavedChanges = useCallback(() => {
    if (!hasDraftContent()) return false;

    return createDraftSignature(buildDraftPayload()) !== lastSavedSignatureRef.current;
  }, [buildDraftPayload, hasDraftContent]);

  const confirmLeavingCurrentDraft = useCallback(
    (message) => {
      if (!hasUnsavedChanges()) return true;
      return window.confirm(
        message || "当前编辑器有未保存修改，继续会切换到另一篇草稿。确定继续吗？"
      );
    },
    [hasUnsavedChanges]
  );

  const openEditorSlug = useCallback(
    (slug, { confirmIfDirty = true } = {}) => {
      if (!slug) return;
      if (
        confirmIfDirty &&
        !confirmLeavingCurrentDraft("当前编辑器有未保存修改，继续会切换到导入草稿。确定继续吗？")
      ) {
        return;
      }

      setIsJuejinImportOpen(false);
      router.replace(`/write?slug=${encodeURIComponent(slug)}`);
    },
    [confirmLeavingCurrentDraft, router]
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
      const result = await persistEditorState(payload);
      if (!result.ok) {
        showToast(result.error || "保存失败", "error");
        return;
      }
      applySavedDraft(payload, result.data);
      showToast(`${saveTargetLabel}已保存`, "success");
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
      const payload = buildDraftPayload();
      const res = await fetch("/api/write/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        applySavedDraft(payload, data);
        setPostStatus("published");
        setHasWorkingDraft(false);
        showToast(isPublishedPost ? "文章已更新" : "发布成功", "success");
      } else {
        showToast(data?.error || "发布失败", "error");
      }
    } catch {
      showToast("发布失败", "error");
    } finally {
      setIsBusy(false);
    }
  };

  const uploadAsset = useCallback(async (file, prefix) => {
    const formData = new FormData();
    formData.append("file", file);
    if (prefix) {
      formData.append("prefix", prefix);
    }

    const res = await fetch("/api/write/assets", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok || !data?.url) {
      return { ok: false, error: data?.error || "上传失败" };
    }

    return { ok: true, url: data.url };
  }, []);

  const uploadImages = async (files) => {
    const uploaded = [];
    for (const file of files) {
      try {
        const result = await uploadAsset(file);
        if (result.ok) {
          uploaded.push({ url: result.url, alt: file.name });
        }
      } catch {}
    }
    return uploaded;
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("请选择图片文件", "error");
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setCoverLocalPreview(localPreviewUrl);
    setIsCoverUploading(true);

    try {
      const result = await uploadAsset(file, "covers");
      if (!result.ok) {
        setCoverLocalPreview("");
        showToast(result.error || "封面上传失败", "error");
        return;
      }

      setMetadata((prev) => ({ ...prev, cover: result.url }));
      setCoverLocalPreview("");
      showToast("封面已上传", "success");
    } catch {
      setCoverLocalPreview("");
      showToast("封面上传失败", "error");
    } finally {
      setIsCoverUploading(false);
    }
  };

  const handleRemoveCover = () => {
    setCoverLocalPreview("");
    setMetadata((prev) => ({ ...prev, cover: "" }));

    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = "";
    }

    showToast("已移除封面", "info");
  };

  const closeJuejinImport = useCallback(() => {
    if (isJuejinImporting) return;
    setIsJuejinImportOpen(false);
  }, [isJuejinImporting]);

  const handleJuejinImport = useCallback(async () => {
    const isProfileMode = juejinImportMode === "profile";
    const rawValue = isProfileMode ? juejinProfileInput : juejinArticleInput;

    if (!rawValue.trim()) {
      showToast(isProfileMode ? "请输入作者主页链接或用户 ID" : "请输入文章链接或文章 ID", "error");
      return;
    }

    if (
      !isProfileMode &&
      !confirmLeavingCurrentDraft("当前编辑器有未保存修改，继续导入并切换文章可能会打断当前编辑。确定继续吗？")
    ) {
      return;
    }

    setIsJuejinImporting(true);
    setJuejinImportResult(null);

    try {
      const response = await fetch("/api/write/import/juejin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isProfileMode
            ? {
                mode: "profile",
                profileUrl: juejinProfileInput.trim(),
              }
            : {
                mode: "single",
                url: juejinArticleInput.trim(),
              }
        ),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        showToast(data?.error || "导入失败", "error");
        return;
      }

      setJuejinImportResult(data);

      if (!isProfileMode && data?.slug) {
        showToast(data.skipped ? "文章已存在，正在打开已有草稿" : "掘金文章已导入", "success");
        openEditorSlug(data.slug, { confirmIfDirty: false });
        return;
      }

      const summary = data?.summary ?? {};
      if (!summary.scanned) {
        showToast("没有扫描到可导入的公开文章", "info");
        return;
      }

      const tone = summary.failed ? "info" : "success";
      showToast(
        `批量导入完成：新增 ${summary.imported || 0}，跳过 ${summary.skipped || 0}，失败 ${summary.failed || 0}`,
        tone
      );
    } catch {
      showToast("导入失败", "error");
    } finally {
      setIsJuejinImporting(false);
    }
  }, [
    confirmLeavingCurrentDraft,
    juejinArticleInput,
    juejinImportMode,
    juejinProfileInput,
    openEditorSlug,
    showToast,
  ]);

  const performAutoSave = useCallback(async () => {
    if (!isAuthed || !hasDraftContent()) return;
    const payload = buildDraftPayload();
    const signature = createDraftSignature(payload);
    if (signature === lastSavedSignatureRef.current) return;

    if (autoSaveInFlightRef.current) {
      pendingAutoSaveRef.current = true;
      return;
    }

    autoSaveInFlightRef.current = true;
    setAutoSaveState("saving");
    const result = await persistEditorState(payload);
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
  }, [applySavedDraft, buildDraftPayload, hasDraftContent, isAuthed, persistEditorState]);

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

    const signature = createDraftSignature(buildDraftPayload());
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

  const flushUnsavedChanges = useCallback(() => {
    if (!isAuthed || !hasDraftContent()) return;
    const payload = buildDraftPayload();
    const signature = createDraftSignature(payload);
    if (signature === lastSavedSignatureRef.current) return;
    void persistEditorState(payload, { keepalive: true });
  }, [buildDraftPayload, hasDraftContent, isAuthed, persistEditorState]);

  useEffect(() => {
    if (!isAuthed) return undefined;

    const handlePageHide = () => {
      flushUnsavedChanges();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushUnsavedChanges();
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flushUnsavedChanges();
    };
  }, [flushUnsavedChanges, isAuthed]);

  const autoSaveLabel = (() => {
    if (!isAuthed || !hasDraftContent()) return "";
    if (autoSaveState === "saving") return "自动保存中…";
    if (autoSaveState === "saved") {
      return autoSaveAt ? `已自动保存${saveTargetLabel} ${autoSaveAt}` : `已自动保存${saveTargetLabel}`;
    }
    if (autoSaveState === "error") return `自动保存${saveTargetLabel}失败`;
    return "";
  })();

  const selectedCategory = getCategoryFromDraft(metadata.title, metadata.tags);
  const normalizedCover = String(metadata.cover ?? "").trim();
  const coverPreviewUrl = coverLocalPreview || normalizedCover;
  const hasCoverPreview = Boolean(coverPreviewUrl);
  const publishButtonLabel =
    postStatus === "published" ? "更新文章" : "发布文章";
  const juejinImportItems = Array.isArray(juejinImportResult?.results)
    ? juejinImportResult.results
    : [];
  const juejinImportSummary = juejinImportResult?.summary ?? null;
  const isProfileImportMode = juejinImportMode === "profile";

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
            {autoSaveHint}
          </span>
          {isPublishedPost ? (
            <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
              {hasWorkingDraft ? "存在未发布修改" : "线上文章保持不变"}
            </span>
          ) : null}
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
            type="button"
            onClick={() => {
              setIsSettingsOpen(false);
              setIsJuejinImportOpen(true);
            }}
            disabled={isJuejinImporting}
            className="rounded-full border border-wafu-sumi/10 bg-white/60 px-3 py-1.5 text-[11px] text-wafu-sumi/70 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            导入掘金
          </button>
          <button
            onClick={() => {
              if (isJuejinImporting) return;
              setIsJuejinImportOpen(false);
              setIsSettingsOpen(!isSettingsOpen);
            }}
            disabled={isJuejinImporting}
            className="text-wafu-sumi/55 hover:text-erii-red disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={handlePublish}
            disabled={isBusy}
            className="rounded-full bg-[#e11d48] px-5 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-[#e11d48]/40 transition hover:bg-[#be123c] hover:shadow-md disabled:opacity-60"
          >
            {publishButtonLabel}
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

      {isJuejinImportOpen && (
        <div className="write-import-overlay" onClick={closeJuejinImport}>
          <div
            className="write-import-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="write-import-title"
          >
            <div className="write-import-header">
              <div className="write-import-heading">
                <span className="write-settings-kicker">Juejin Import</span>
                <h2 id="write-import-title">导入掘金文章</h2>
                <p>
                  支持按作者主页批量导入公开文章，也支持用单篇链接快速补录。
                </p>
              </div>
              <button
                type="button"
                onClick={closeJuejinImport}
                className="write-settings-close"
                disabled={isJuejinImporting}
                aria-label="关闭掘金导入面板"
              >
                <X size={16} />
              </button>
            </div>

            <div className="write-import-body">
              <div className="write-import-mode-switch" role="tablist" aria-label="掘金导入模式">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isProfileImportMode}
                  className={`write-import-mode-button${isProfileImportMode ? " is-active" : ""}`}
                  onClick={() => setJuejinImportMode("profile")}
                  disabled={isJuejinImporting}
                >
                  批量导入
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isProfileImportMode}
                  className={`write-import-mode-button${!isProfileImportMode ? " is-active" : ""}`}
                  onClick={() => setJuejinImportMode("single")}
                  disabled={isJuejinImporting}
                >
                  单篇导入
                </button>
              </div>

              <section className="write-import-panel">
                <label className="write-field">
                  <span>{isProfileImportMode ? "作者主页 / 用户 ID" : "文章链接 / 文章 ID"}</span>
                  <input
                    value={isProfileImportMode ? juejinProfileInput : juejinArticleInput}
                    onChange={(event) =>
                      isProfileImportMode
                        ? setJuejinProfileInput(event.target.value)
                        : setJuejinArticleInput(event.target.value)
                    }
                    placeholder={
                      isProfileImportMode
                        ? "例如 https://juejin.cn/user/312692511089736/posts"
                        : "例如 https://juejin.cn/post/7250317954993897528"
                    }
                    className="write-input"
                    disabled={isJuejinImporting}
                  />
                </label>

                <p className="write-help">
                  {isProfileImportMode
                    ? "批量模式会扫描该作者的全部公开文章，自动跳过已经导入过的内容。"
                    : "单篇模式适合补录某一篇文章；导入成功后会直接打开对应草稿。"}
                </p>

                <div className="write-import-actions">
                  <button
                    type="button"
                    className="write-import-submit"
                    onClick={handleJuejinImport}
                    disabled={isJuejinImporting}
                  >
                    {isJuejinImporting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        {isProfileImportMode ? "正在批量导入…" : "正在导入…"}
                      </>
                    ) : (
                      isProfileImportMode ? "开始批量导入" : "开始导入文章"
                    )}
                  </button>
                </div>
              </section>

              {juejinImportSummary ? (
                <section className="write-import-report">
                  <div className="write-import-report-grid">
                    <div className="write-import-stat">
                      <strong>{juejinImportSummary.scanned || 0}</strong>
                      <span>扫描文章</span>
                    </div>
                    <div className="write-import-stat">
                      <strong>{juejinImportSummary.imported || 0}</strong>
                      <span>新增草稿</span>
                    </div>
                    <div className="write-import-stat">
                      <strong>{juejinImportSummary.skipped || 0}</strong>
                      <span>已跳过</span>
                    </div>
                    <div className="write-import-stat">
                      <strong>{juejinImportSummary.failed || 0}</strong>
                      <span>失败</span>
                    </div>
                  </div>

                  {juejinImportResult?.profile ? (
                    <p className="write-help">
                      已扫描 {juejinImportResult.profile.userId}，共访问{" "}
                      {juejinImportResult.profile.pagesVisited || 0} 个分页。
                    </p>
                  ) : null}

                  {juejinImportItems.length ? (
                    <ul className="write-import-result-list">
                      {juejinImportItems.map((item) => {
                        const statusMeta = getJuejinImportStatusMeta(item.status);

                        return (
                          <li key={`${item.articleId}-${item.status}`} className="write-import-result-item">
                            <div className="write-import-result-copy">
                              <div className="write-import-result-head">
                                <p className="write-import-result-title">
                                  {item.title || item.articleId}
                                </p>
                                <span className={`write-import-result-pill ${statusMeta.pillClass}`}>
                                  {statusMeta.label}
                                </span>
                              </div>
                              <p className="write-import-result-meta">
                                {item.articleId}
                                {item.slug ? ` · ${item.slug}` : ""}
                              </p>
                              {item.error ? (
                                <p className={`write-import-result-helper ${statusMeta.helperClass}`}>
                                  {item.error}
                                </p>
                              ) : item.status === "skipped" ? (
                                <p className={`write-import-result-helper ${statusMeta.helperClass}`}>
                                  已存在相同来源，未重复创建草稿。
                                </p>
                              ) : (
                                <p className={`write-import-result-helper ${statusMeta.helperClass}`}>
                                  可直接进入编辑器继续整理。
                                </p>
                              )}
                            </div>
                            {item.slug ? (
                              <button
                                type="button"
                                className="write-import-open"
                                onClick={() => openEditorSlug(item.slug)}
                              >
                                打开草稿
                              </button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </section>
              ) : null}
            </div>
          </div>
        </div>
      )}

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
                        {POST_CATEGORY_OPTIONS.map((option) => (
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
                    <span>上传封面图</span>
                    <div className="write-cover-upload">
                      <input
                        ref={coverFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="sr-only"
                      />

                      <button
                        type="button"
                        onClick={() => coverFileInputRef.current?.click()}
                        disabled={isCoverUploading}
                        className="write-cover-upload-trigger"
                      >
                        <span className="write-cover-upload-icon" aria-hidden>
                          {isCoverUploading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <ImagePlus size={16} />
                          )}
                        </span>
                        <span className="write-cover-upload-copy">
                          <strong>
                            {isCoverUploading
                              ? "正在上传封面图…"
                              : normalizedCover
                                ? "更换本地封面图"
                                : "选择本地图片文件"}
                          </strong>
                          <small>选择后会自动上传并写入文章封面</small>
                        </span>
                      </button>

                      <div className="write-cover-upload-actions">
                        <button
                          type="button"
                          onClick={() => coverFileInputRef.current?.click()}
                          disabled={isCoverUploading}
                          className="write-cover-upload-button"
                        >
                          {isCoverUploading ? "上传中…" : normalizedCover ? "重新选择" : "上传图片"}
                        </button>

                        {normalizedCover ? (
                          <button
                            type="button"
                            onClick={handleRemoveCover}
                            disabled={isCoverUploading}
                            className="write-cover-upload-button is-secondary"
                          >
                            <Trash2 size={14} />
                            移除封面
                          </button>
                        ) : null}
                      </div>

                      <p className="write-help">
                        支持 JPG、PNG、WEBP 等常见图片格式，上传成功后会自动用于文章列表和详情页封面。
                      </p>
                    </div>
                  </label>

                  {hasCoverPreview ? (
                    <div
                      className={`write-cover-preview${isCoverUploading ? " is-uploading" : ""}`}
                      style={{ backgroundImage: `url(${coverPreviewUrl})` }}
                    >
                      <div className="write-cover-preview-mask" />
                      <span>{isCoverUploading ? "上传中" : "封面预览"}</span>
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
