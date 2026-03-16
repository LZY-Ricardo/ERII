"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ExternalLink,
  MessageSquare,
  Pencil,
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

function AdminPostsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
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
      <div className="flex h-64 items-center justify-center text-gray-400 text-sm">
        加载中…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateTab("published")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "published"
                ? "bg-rose-50 text-rose-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            文章 ({publishedCount})
          </button>
          <button
            type="button"
            onClick={() => updateTab("draft")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "draft"
                ? "bg-rose-50 text-rose-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            草稿箱 ({draftCount})
          </button>
        </div>
        {/* Search */}
        <div className="relative flex-1 min-w-45">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题、slug 或标签…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm
              text-gray-700 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <span className="text-xs text-gray-400 ml-auto">
          共 {filtered.length} 篇
        </span>
      </div>

      {/* Posts table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">
            未找到文章
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                <th className="px-5 py-3 font-medium">标题</th>
                <th className="px-3 py-3 font-medium w-24">日期</th>
                <th className="px-3 py-3 font-medium w-20 text-center">
                  状态
                </th>
                <th className="px-3 py-3 font-medium w-16 text-center">
                  评论
                </th>
                <th className="px-3 py-3 font-medium w-24 text-right">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((post) => (
                <tr
                  key={`${post.draftKind || post.status}:${post.editorLookupSlug || post.slug}:${post.slug}`}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText
                        size={15}
                        className="shrink-0 text-gray-300"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {post.title || "无标题"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
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
                  <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {fmtDate(post.updatedAt || post.date)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        STATUS_COLOR[post.status] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATUS_LABEL[post.status] || post.status}
                    </span>
                    {post.draftKind ? (
                      <span className="ml-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        {DRAFT_KIND_LABEL[post.draftKind] || post.draftKind}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {post.commentCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare size={13} />
                        {post.commentCount}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/write?slug=${post.editorLookupSlug || post.slug}`}
                        className="p-1.5 rounded-md hover:bg-gray-200/60 transition-colors"
                        title="编辑"
                      >
                        <Pencil size={14} className="text-gray-400" />
                      </Link>
                      {post.status === "published" && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-md hover:bg-gray-200/60 transition-colors"
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
