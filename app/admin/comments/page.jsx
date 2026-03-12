"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/src/components/Toast";
import { Trash2, Check, AlertCircle, Eye, LogOut, RefreshCw } from "lucide-react";

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

export default function AdminCommentsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [filteredComments, setFilteredComments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newCount, setNewCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const toast = useToast();

  // 检查登录状态
  useEffect(() => {
    checkAuth();
  }, []);

  // 加载评论
  useEffect(() => {
    if (isAuthenticated) {
      loadComments();
    }
  }, [isAuthenticated, loadComments]);

  // 筛选评论
  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredComments(comments);
    } else {
      setFilteredComments(comments.filter((c) => c.status === statusFilter));
    }
  }, [statusFilter, comments]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/comments");
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = useCallback(async () => {
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
    }
  }, [toast]);

  const handleLogin = async (password) => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.ok) {
        setIsAuthenticated(true);
        toast.success("登录成功");
      } else {
        toast.error(data.error || "登录失败");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("登录失败");
    }
  };

  const handleDelete = async (commentId) => {
    if (isDeleting) return;

    setIsDeleting(commentId);
    try {
      const response = await fetch(`/api/admin/comments/${commentId}/delete`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
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
        setComments(comments.map((c) => (c.id === commentId ? { ...c, status: "approved" } : c)));
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
        setComments(comments.map((c) => (c.id === commentId ? { ...c, status: "spam" } : c)));
        toast.success("已标记为垃圾评论");
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Spam error:", error);
      toast.error("操作失败");
    }
  };

  const handleLogout = () => {
    document.cookie = "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsAuthenticated(false);
    setComments([]);
    toast.success("已退出登录");
  };

  const formatDate = (dateString) => {
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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 头部 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">评论管理</h1>
              <p className="text-gray-600 mt-1">管理您博客上的所有评论</p>
            </div>
            <div className="flex items-center gap-3">
              {newCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  <span className="font-medium">{newCount} 条新评论</span>
                </div>
              )}
              <button
                onClick={loadComments}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="刷新"
              >
                <RefreshCw size={20} className="text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>退出</span>
              </button>
            </div>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-gray-700 font-medium">状态:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="approved">已批准</option>
                <option value="pending">待审核</option>
                <option value="spam">垃圾评论</option>
              </select>
            </div>
            <div className="ml-auto text-gray-600">
              共 {filteredComments.length} 条评论
            </div>
          </div>
        </div>

        {/* 评论列表 */}
        <div className="bg-white rounded-lg shadow-sm divide-y">
          {filteredComments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">暂无评论</div>
          ) : (
            filteredComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isDeleting={isDeleting === comment.id}
                onDelete={() => handleDelete(comment.id)}
                onApprove={() => handleApprove(comment.id)}
                onSpam={() => handleSpam(comment.id)}
                onView={() => setSelectedComment(comment)}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </div>

      {/* 详情弹窗 */}
      {selectedComment && (
        <CommentDetailModal comment={selectedComment} onClose={() => setSelectedComment(null)} formatDate={formatDate} />
      )}
    </div>
  );
}

function LoginForm({ onLogin }) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    await onLogin(password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">评论管理</h1>
          <p className="text-gray-600 mb-6">请输入管理员密码登录</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入密码"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? "登录中..." : "登录"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, isDeleting, onDelete, onApprove, onSpam, onView, formatDate }) {
  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${comment.isNew ? "bg-blue-50" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {comment.isNew && <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>}
            <span className="font-medium text-gray-900">{comment.authorName}</span>
            {comment.isPrivate && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">私密</span>
            )}
            <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[comment.status]}`}>
              {STATUS_LABELS[comment.status]}
            </span>
          </div>

          <p className="text-gray-700 mb-2 line-clamp-2">{comment.contentPreview}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>《{comment.postTitle}》</span>
            <span>{formatDate(comment.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="查看详情"
          >
            <Eye size={18} className="text-gray-600" />
          </button>
          {comment.status !== "approved" && (
            <button
              onClick={onApprove}
              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
              title="批准"
            >
              <Check size={18} className="text-green-600" />
            </button>
          )}
          <button
            onClick={onSpam}
            className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
            title="标记垃圾评论"
          >
            <AlertCircle size={18} className="text-yellow-600" />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            title="删除"
          >
            <Trash2 size={18} className="text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentDetailModal({ comment, onClose, formatDate }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">评论详情</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">评论者</label>
              <p className="text-gray-900">{comment.authorName}</p>
            </div>

            {comment.authorLink && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">网站</label>
                <a href={comment.authorLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {comment.authorLink}
                </a>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">评论内容</label>
              <p className="text-gray-900 whitespace-pre-wrap">{comment.contentPreview}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属文章</label>
              <p className="text-gray-900">《{comment.postTitle}》</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">评论时间</label>
              <p className="text-gray-900">{formatDate(comment.createdAt)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[comment.status]}`}>
                {STATUS_LABELS[comment.status]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
