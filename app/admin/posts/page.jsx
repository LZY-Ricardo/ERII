"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/src/components/Toast";
import {
  inferCategoryFromText,
  normalizeCategoryValue,
  POST_CATEGORY_OPTIONS,
} from "@/src/lib/postTaxonomy";
import {
  FileText,
  ExternalLink,
  MessageSquare,
  Pencil,
  Loader2,
  Search,
} from "lucide-react";

const STATUS_LABEL = {
  published: "已发布",
  draft: "草稿",
};

const STATUS_COLOR = {
  published: "bg-emerald-50 text-emerald-700",
  draft: "bg-gray-100 text-gray-500",
};

const DRAFT_KIND_LABEL = {
  working: "已发布文章修改稿",
};

function fmtDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("zh-CN");
}

function normalizeTagsArray(tags) {
  if (!Array.isArray(tags)) return [];
  const result = [];
  for (const raw of tags) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    if (!result.includes(value)) result.push(value);
  }
  return result;
}

function getCategoryFromPost(post) {
  const title = String(post?.title ?? "").trim();
  const tags = normalizeTagsArray(post?.tags);
  const explicit = tags.map((tag) => normalizeCategoryValue(tag)).find(Boolean);
  if (explicit) return explicit;
  return inferCategoryFromText(title, tags.join(" "));
}

function applyCategoryToTags(tags, category) {
  const normalizedCategory = normalizeCategoryValue(category) || "未分类";
  const baseTags = normalizeTagsArray(tags).filter(
    (tag) => !normalizeCategoryValue(tag)
  );

  if (normalizedCategory !== "未分类") {
    baseTags.unshift(normalizedCategory);
  }

  return baseTags;
}

function getRowKey(post) {
  return `${post.draftKind || post.status}:${post.editorLookupSlug || post.slug}:${post.slug}`;
}

function AdminPostsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [savingMap, setSavingMap] = useState({});
  const activeTab = useMemo(() => {
    const tab = String(searchParams.get("tab") || "").toLowerCase();
    return tab === "draft" ? "draft" : "published";
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/admin/posts")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setPosts(data.posts ?? []);
        else setError(data.error || "加载失败");
      })
      .catch(() => setError("网络错误"))
      .finally(() => setLoading(false));
  }, []);

  const saveCategory = async (post, nextCategory) => {
    const rowKey = getRowKey(post);
    if (savingMap[rowKey]) return;

    const requestSlug = post.editorLookupSlug || post.slug;
    const nextTags = applyCategoryToTags(post.tags, nextCategory);
    const prevTags = normalizeTagsArray(post.tags);

    // Optimistic update.
    setPosts((prev) =>
      prev.map((item) => (getRowKey(item) === rowKey ? { ...item, tags: nextTags } : item))
    );
    setSavingMap((prev) => ({ ...prev, [rowKey]: true }));

    try {
      const res = await fetch("/api/admin/posts/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: requestSlug,
          draftKind: post.draftKind || null,
          category: nextCategory,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        // Rollback.
        setPosts((prev) =>
          prev.map((item) => (getRowKey(item) === rowKey ? { ...item, tags: prevTags } : item))
        );
        toast.error(data?.error || "更新分类失败");
        return;
      }

      // Trust the server's normalized tags if provided.
      if (Array.isArray(data.tags)) {
        setPosts((prev) =>
          prev.map((item) => (getRowKey(item) === rowKey ? { ...item, tags: data.tags } : item))
        );
      }
    } catch (e) {
      // Rollback.
      setPosts((prev) =>
        prev.map((item) => (getRowKey(item) === rowKey ? { ...item, tags: prevTags } : item))
      );
      toast.error("更新分类失败");
    } finally {
      setSavingMap((prev) => {
        const next = { ...prev };
        delete next[rowKey];
        return next;
      });
    }
  };

  const { publishedCount, draftCount } = useMemo(() => {
    let published = 0;
    let draft = 0;
    for (const post of posts) {
      if (post.status === "published") published += 1;
      if (post.status === "draft") draft += 1;
    }
    return { publishedCount: published, draftCount: draft };
  }, [posts]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (activeTab === "published" && post.status !== "published") return false;
      if (activeTab === "draft" && post.status !== "draft") return false;
      if (!query) return true;
      return (
        post.title?.toLowerCase().includes(query) ||
        post.slug?.toLowerCase().includes(query) ||
        post.publishedSlug?.toLowerCase().includes(query) ||
        post.tags?.some((t) => t.toLowerCase().includes(query))
      );
    });
  }, [posts, activeTab, search]);

  const updateTab = (nextTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "draft") {
      params.set("tab", "draft");
    } else {
      params.delete("tab");
    }
    const query = params.toString();
    router.replace(query ? `/admin/posts?${query}` : "/admin/posts");
  };

  if (loading) {
    return (
      <div className="admin-loading">加载中…</div>
    );
  }

  if (error) {
    return (
      <div className="admin-loading text-rose-600">{error}</div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Posts</p>
          <h1>文章管理</h1>
          <p>这里统一处理已发布文章、草稿和修改稿。高频动作是继续编辑、快速切换分类和定位当前发布状态。</p>
        </div>
        <Link href="/write" className="admin-button-primary">
          <Pencil size={15} />
          新建或继续写作
        </Link>
      </div>

      <div className="admin-panel is-strong">
        <div className="admin-toolbar">
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateTab("published")}
            className={`admin-badge min-h-10 px-4 text-sm transition-colors ${
              activeTab === "published"
                ? "bg-rose-50 text-rose-700"
                : "bg-white text-[var(--admin-text-soft)]"
            }`}
          >
            文章 ({publishedCount})
          </button>
          <button
            type="button"
            onClick={() => updateTab("draft")}
            className={`admin-badge min-h-10 px-4 text-sm transition-colors ${
              activeTab === "draft"
                ? "bg-rose-50 text-rose-700"
                : "bg-white text-[var(--admin-text-soft)]"
            }`}
          >
            草稿箱 ({draftCount})
          </button>
        </div>

          <label className="admin-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题、slug 或标签…"
            />
          </label>

          <span className="ml-auto text-xs text-[var(--admin-text-soft)]">
            当前视图 {filtered.length} 篇
          </span>
        </div>
      </div>

      <div className="admin-panel is-strong admin-table-wrap">
        {filtered.length === 0 ? (
          <div className="admin-empty">未找到文章</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>标题</th>
                <th className="w-28">日期</th>
                <th className="w-44 text-center">
                  分类
                </th>
                <th className="w-32 text-center">
                  状态
                </th>
                <th className="w-14 text-center">
                  评论
                </th>
                <th className="w-32 text-right">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={getRowKey(post)}>
                  <td className="min-w-[420px]">
                    <div className="flex items-center gap-2">
                      <FileText
                        size={15}
                        className="shrink-0 text-gray-300"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {post.title || "无标题"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--admin-text-soft)]">
                          <p className="truncate">/{post.slug}</p>
                          {post.draftKind === "working" && post.publishedSlug ? (
                            <p className="truncate text-amber-600">
                              线上：/{post.publishedSlug}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs whitespace-nowrap text-[var(--admin-text-soft)]">
                    {fmtDate(post.updatedAt || post.date)}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <select
                        value={getCategoryFromPost(post)}
                        onChange={(e) => saveCategory(post, e.target.value)}
                        disabled={Boolean(savingMap[getRowKey(post)])}
                        className="admin-select w-36 min-w-[9rem] px-3 text-sm leading-5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {POST_CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {savingMap[getRowKey(post)] ? (
                        <Loader2 size={14} className="animate-spin text-gray-300" />
                      ) : null}
                    </div>
                  </td>
                  <td className="text-center">
                    <span
                      className={`admin-badge ${
                        STATUS_COLOR[post.status] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATUS_LABEL[post.status] || post.status}
                    </span>
                    {post.draftKind ? (
                      <span className="admin-badge ml-1 bg-amber-50 text-amber-700">
                        {DRAFT_KIND_LABEL[post.draftKind] || post.draftKind}
                      </span>
                    ) : null}
                  </td>
                  <td className="text-center">
                    {post.commentCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--admin-text-soft)]">
                        <MessageSquare size={13} />
                        {post.commentCount}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/write?slug=${post.editorLookupSlug || post.slug}`}
                        className="admin-icon-button h-9 w-9"
                        title="编辑"
                      >
                        <Pencil size={14} className="text-gray-400" />
                      </Link>
                      {post.status === "published" && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="admin-icon-button h-9 w-9"
                          title="查看"
                        >
                          <ExternalLink
                            size={14}
                            className="text-gray-400"
                          />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AdminPostsPageFallback() {
  return (
    <div className="flex h-64 items-center justify-center text-gray-400 text-sm">
      加载中…
    </div>
  );
}

export default function AdminPostsPage() {
  return (
    <Suspense fallback={<AdminPostsPageFallback />}>
      <AdminPostsPageContent />
    </Suspense>
  );
}
