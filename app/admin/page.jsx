"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Clock,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color, href }) {
  const colorMap = {
    rose: "bg-rose-50 text-rose-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-100 text-gray-500",
  };

  const inner = (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color] || colorMap.gray}`}
        >
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-800">
            {value ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

const STATUS_LABELS = {
  pending: "待审核",
  approved: "已通过",
  spam: "垃圾",
};

const STATUS_COLORS = {
  pending: "text-amber-600 bg-amber-50",
  approved: "text-emerald-600 bg-emerald-50",
  spam: "text-red-600 bg-red-50",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  return `${days} 天前`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStats(data.stats);
          setRecent(data.recentComments ?? []);
        } else {
          setError(data.error || "加载失败");
        }
      })
      .catch(() => setError("网络错误"))
      .finally(() => setLoading(false));
  }, []);

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
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="文章总数"
          value={stats?.totalPosts}
          color="blue"
          href="/admin/posts"
        />
        <StatCard
          icon={MessageSquare}
          label="评论总数"
          value={stats?.totalComments}
          color="rose"
          href="/admin/comments"
        />
        <StatCard
          icon={Clock}
          label="待审核"
          value={stats?.pendingComments}
          color="amber"
          href="/admin/comments?status=pending"
        />
        <StatCard
          icon={ShieldAlert}
          label="垃圾评论"
          value={stats?.spamComments}
          color="red"
          href="/admin/comments?status=spam"
        />
      </div>

      {/* Recent comments */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700">最近评论</h2>
          <Link
            href="/admin/comments"
            className="text-xs text-rose-600 hover:underline"
          >
            查看全部 →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            暂无评论
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recent.map((c) => (
              <li key={c.id} className="flex items-start gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {c.authorName}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-500"}`}
                    >
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {c.contentPreview}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-300">
                    {c.postSlug} · {timeAgo(c.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
