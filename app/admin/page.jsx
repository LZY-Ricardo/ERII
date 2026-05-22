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
  Pencil,
  Settings,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color, href }) {
  const inner = (
    <div className="admin-stat-card">
      <div className="admin-stat-card__icon">
        <Icon size={20} />
      </div>
      <span className="admin-stat-card__value">{value ?? "—"}</span>
      <span className="admin-stat-card__label">{label}</span>
      <span className="mt-4 inline-flex text-xs font-medium text-[var(--admin-text-soft)]">
        {color === "amber"
          ? "需要优先关注"
          : color === "red"
            ? "建议及时清理"
            : "进入对应工作区"}
      </span>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function PendingItem({ icon: Icon, title, description, href, tone = "neutral" }) {
  const toneClass =
    tone === "warning"
      ? "bg-amber-50 text-amber-700"
      : tone === "danger"
        ? "bg-rose-50 text-rose-700"
        : "bg-stone-100 text-stone-700";

  return (
    <Link href={href} className="admin-list-item">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--admin-text)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--admin-text-soft)]">{description}</p>
        </div>
      </div>
      <span className="text-xs font-medium text-[var(--admin-accent)]">查看</span>
    </Link>
  );
}

function ShortcutLink({ icon: Icon, title, meta, href }) {
  return (
    <Link href={href} className="admin-list-item">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--admin-text)]">{title}</p>
          <p className="mt-1 text-xs text-[var(--admin-text-soft)]">{meta}</p>
        </div>
      </div>
      <span className="text-xs font-medium text-[var(--admin-accent)]">进入</span>
    </Link>
  );
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
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Overview</p>
          <h1>控制台概览</h1>
          <p>审核、写作、项目与站点配置。</p>
        </div>
        <div className="admin-panel">
          <div className="admin-panel__body flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-[var(--admin-text)]">后台在线</p>
              <p className="text-xs text-[var(--admin-text-soft)]">统计与评论接口可用</p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-stat-grid">
        <StatCard
          icon={FileText}
          label="内容总量"
          value={stats?.totalPosts}
          color="blue"
          href="/admin/posts"
        />
        <StatCard
          icon={MessageSquare}
          label="公开评论"
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

      <div className="admin-section-grid">
        <section className="admin-panel is-strong">
          <div className="admin-panel__body">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="admin-kicker">Pending</p>
                <h2 className="m-0 text-xl font-semibold text-[var(--admin-text)]">待处理事项</h2>
              </div>
              <span className="admin-badge bg-stone-100 text-stone-700">今日工作流</span>
            </div>

            <div className="admin-list">
              <PendingItem
                icon={Clock}
                title={`待审核评论 ${stats?.pendingComments ?? 0} 条`}
                description="新评论审核"
                href="/admin/comments?status=pending"
                tone="warning"
              />
              <PendingItem
                icon={AlertCircle}
                title={`垃圾评论 ${stats?.spamComments ?? 0} 条`}
                description="可疑内容清理"
                href="/admin/comments?status=spam"
                tone="danger"
              />
              <PendingItem
                icon={FileText}
                title="继续处理文章草稿"
                description="草稿与修改稿"
                href="/admin/posts?tab=draft"
              />
            </div>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__body">
            <div className="mb-4">
              <p className="admin-kicker">Shortcuts</p>
              <h2 className="m-0 text-xl font-semibold text-[var(--admin-text)]">快捷入口</h2>
            </div>
            <div className="admin-list">
              <ShortcutLink icon={Pencil} title="写作台" meta="新建、导入、发布" href="/write" />
              <ShortcutLink icon={FileText} title="项目展示" meta="精选位与排序" href="/admin/projects" />
              <ShortcutLink icon={Settings} title="站点配置" meta="评论、主题、播放器" href="/admin/settings" />
            </div>
          </div>
        </section>
      </div>

      <section className="admin-panel is-strong">
        <div className="admin-panel__body">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="admin-kicker">Activity</p>
              <h2 className="m-0 text-xl font-semibold text-[var(--admin-text)]">最近评论动态</h2>
            </div>
            <Link href="/admin/comments" className="admin-button-subtle">
              查看全部
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="admin-empty">暂无评论动态</div>
          ) : (
            <div className="admin-list">
              {recent.map((c) => (
                <div key={c.id} className="admin-list-item">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--admin-text)] truncate">
                        {c.authorName}
                      </span>
                      <span
                        className={`admin-badge ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                    </div>
                    <p className="truncate text-sm text-[var(--admin-text-soft)]">{c.contentPreview}</p>
                    <p className="mt-1 text-xs text-[var(--admin-text-soft)]">
                      {c.postSlug} · {timeAgo(c.createdAt)}
                    </p>
                  </div>
                  <Link href="/admin/comments" className="admin-button-subtle">
                    处理
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
