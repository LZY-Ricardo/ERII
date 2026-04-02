"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useToast } from "@/src/components/Toast";
import { useSearchParams } from "next/navigation";
import { Trash2, Check, AlertCircle, Eye, RefreshCw } from "lucide-react";

const STATUS_LABELS = {
  approved: "已批准",
  pending: "待审核",
  spam: "垃圾评论",
  deleted: "已删除",
};

const STATUS_COLORS = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  spam: "bg-red-100 text-red-800",
  deleted: "bg-gray-100 text-gray-800",
};

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString("zh-CN");
}

function AdminCommentsPageContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [comments, setComments] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [newCount, setNewCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/comments");
      const data = await response.json();

      if (data.ok) {
        setComments(data.comments || []);
        setNewCount(data.comments?.filter((c) => c.isNew).length || 0);
      } else {
        toast.error(data.error || "加载评论失败");
      }
    } catch (error) {
      console.error("Load comments error:", error);
      toast.error("加载评论失败");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const filteredComments =
    statusFilter === "all"
      ? comments
      : comments.filter((c) => c.status === statusFilter);

  const handleDelete = async (commentId) => {
    if (isDeleting) return;

    setIsDeleting(commentId);
    try {
      const response = await fetch(`/api/admin/comments/${commentId}/delete`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success("评论已删除");
        if (selectedComment?.id === commentId) {
          setSelectedComment(null);
        }
      } else {
        toast.error(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("删除失败");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleApprove = async (commentId) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, status: "approved" } : c
          )
        );
        toast.success("评论已批准");
      } else {
        toast.error(data.error || "批准失败");
      }
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("批准失败");
    }
  };

  const handleSpam = async (commentId) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}/spam`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, status: "spam" } : c
          )
        );
        toast.success("已标记为垃圾评论");
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Spam error:", error);
      toast.error("操作失败");
    }
  };

  if (loading) {
    return <div className="admin-loading">加载中…</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Comments</p>
          <h1>评论管理</h1>
          <p>把审核、详情查看和垃圾标记收敛到同一条决策流中，避免在列表和弹窗之间来回跳转。</p>
        </div>
        <button onClick={loadComments} className="admin-button-subtle">
          <RefreshCw size={15} />
          刷新列表
        </button>
      </div>

      <div className="admin-panel is-strong">
        <div className="admin-toolbar">
          <label className="text-sm text-[var(--admin-text-soft)]">状态</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select max-w-[180px]"
          >
            <option value="all">全部</option>
            <option value="approved">已批准</option>
            <option value="pending">待审核</option>
            <option value="spam">垃圾评论</option>
          </select>

          {newCount > 0 && (
            <span className="admin-badge bg-blue-50 text-blue-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              {newCount} 条新评论
            </span>
          )}

          <span className="ml-auto text-xs text-[var(--admin-text-soft)]">
            共 {filteredComments.length} 条
          </span>
          <button
            onClick={loadComments}
            className="admin-icon-button h-10 w-10"
            title="刷新"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="admin-panel is-strong">
        {filteredComments.length === 0 ? (
          <div className="admin-empty">暂无评论</div>
        ) : (
          <div className="admin-list">
            {filteredComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isDeleting={isDeleting === comment.id}
                onDelete={() => handleDelete(comment.id)}
                onApprove={() => handleApprove(comment.id)}
                onSpam={() => handleSpam(comment.id)}
                onView={() => setSelectedComment(comment)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selectedComment && (
        <CommentDetailModal
          comment={selectedComment}
          onClose={() => setSelectedComment(null)}
        />
      )}
    </div>
  );
}

function AdminCommentsPageFallback() {
  return (
    <div className="admin-loading">加载中…</div>
  );
}

export default function AdminCommentsPage() {
  return (
    <Suspense fallback={<AdminCommentsPageFallback />}>
      <AdminCommentsPageContent />
    </Suspense>
  );
}

function CommentItem({ comment, isDeleting, onDelete, onApprove, onSpam, onView }) {
  return (
    <div className={`admin-list-item ${comment.isNew ? "bg-blue-50/40" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {comment.isNew && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
            )}
            <span className="text-sm font-medium text-gray-800">
              {comment.authorName}
            </span>
            {comment.isPrivate && (
              <span className="admin-badge bg-purple-50 text-purple-600">
                私密
              </span>
            )}
            <span
              className={`admin-badge ${
                STATUS_COLORS[comment.status]
              }`}
            >
              {STATUS_LABELS[comment.status]}
            </span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-1">
            {comment.contentPreview}
          </p>

          <p className="text-xs text-gray-400">
            《{comment.postTitle}》 · {formatDate(comment.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onView}
            className="admin-icon-button h-9 w-9"
            title="查看详情"
          >
            <Eye size={16} className="text-gray-400" />
          </button>
          {comment.status !== "approved" && (
            <button
              onClick={onApprove}
              className="admin-icon-button h-9 w-9"
              title="批准"
            >
              <Check size={16} className="text-green-600" />
            </button>
          )}
          <button
            onClick={onSpam}
            className="admin-icon-button h-9 w-9"
            title="标记垃圾"
          >
            <AlertCircle size={16} className="text-yellow-600" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="admin-icon-button h-9 w-9 disabled:opacity-50"
            title="删除"
          >
            <Trash2 size={16} className="text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentDetailModal({ comment, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-[28px] border border-[var(--admin-border)] bg-[rgba(255,252,248,0.96)] shadow-[var(--admin-shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-800">
              评论详情
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ✕
            </button>
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-gray-400 mb-0.5">评论者</dt>
              <dd className="text-gray-800">{comment.authorName}</dd>
            </div>

            {comment.authorLink && (
              <div>
                <dt className="text-gray-400 mb-0.5">网站</dt>
                <dd>
                  <a
                    href={comment.authorLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-600 hover:underline"
                  >
                    {comment.authorLink}
                  </a>
                </dd>
              </div>
            )}

            <div>
              <dt className="text-gray-400 mb-0.5">内容</dt>
              <dd className="text-gray-800 whitespace-pre-wrap">
                {comment.contentPreview}
              </dd>
            </div>

            <div>
              <dt className="text-gray-400 mb-0.5">文章</dt>
              <dd className="text-gray-800">《{comment.postTitle}》</dd>
            </div>

            <div>
              <dt className="text-gray-400 mb-0.5">时间</dt>
              <dd className="text-gray-800">
                {formatDate(comment.createdAt)}
              </dd>
            </div>

            <div>
              <dt className="text-gray-400 mb-0.5">状态</dt>
              <dd>
                <span
                  className={`admin-badge ${
                    STATUS_COLORS[comment.status]
                  }`}
                >
                  {STATUS_LABELS[comment.status]}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
