"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNav } from "./adminNav";
import { ChevronLeft, ChevronRight, PenSquare, Sparkles } from "lucide-react";

export default function AdminSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}) {
  const pathname = usePathname();

  function isActive(href) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={`admin-sidebar ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}
    >
      <div className="admin-sidebar__inner">
        <div className="admin-sidebar__brand">
          <Link href="/admin" className="admin-sidebar__logo" onClick={onCloseMobile}>
            <span className="admin-sidebar__logo-mark">ER</span>
            {!collapsed ? (
              <span className="admin-sidebar__logo-copy">
                <strong>Erii Console</strong>
                <small>内容与站点管理</small>
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="admin-sidebar__collapse"
            title={collapsed ? "展开侧边栏" : "收起侧边栏"}
          >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {!collapsed ? (
          <div className="admin-sidebar__spotlight">
            <div className="admin-sidebar__spotlight-icon">
              <Sparkles size={16} />
            </div>
            <div>
              <p>当前重点</p>
              <strong>先处理待审核评论，再继续文章草稿</strong>
            </div>
          </div>
        ) : null}

        <div className="admin-sidebar__section-label">{collapsed ? "导" : "导航"}</div>
        <nav className="admin-sidebar__nav">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`admin-nav-link ${active ? "is-active" : ""}`}
                onClick={onCloseMobile}
              >
                <span className="admin-nav-link__icon">
                  <Icon size={18} className="shrink-0" />
                </span>
                {!collapsed ? (
                  <span className="admin-nav-link__copy">
                    <strong>{item.label}</strong>
                    {item.description ? <small>{item.description}</small> : null}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <Link href="/write" className="admin-sidebar__quick-link" onClick={onCloseMobile}>
            <PenSquare size={16} />
            {!collapsed ? <span>继续写作</span> : null}
          </Link>
        <Link
          href="/"
          className="admin-sidebar__back-link"
          title="返回站点"
          onClick={onCloseMobile}
        >
          <span>←</span>
          {!collapsed ? <span>返回站点</span> : null}
        </Link>
        </div>
      </div>
    </aside>
  );
}
