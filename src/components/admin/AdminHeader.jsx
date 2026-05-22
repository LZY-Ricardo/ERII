"use client";

import { usePathname, useRouter } from "next/navigation";
import { adminNav } from "./adminNav";
import { LogOut, Menu, Search, BellDot } from "lucide-react";

export default function AdminHeader({ onOpenSidebar }) {
  const pathname = usePathname();
  const router = useRouter();

  // Resolve current page title from nav
  const current = adminNav.find((item) =>
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href)
  );
  const title = current?.label ?? "管理后台";

  async function handleLogout() {
    try {
      await fetch("/api/admin/login", {
        method: "DELETE",
      });
    } catch {}
    router.push("/admin-login");
    router.refresh();
  }

  return (
    <header className="admin-header">
      <div className="admin-header__title">
        <button
          type="button"
          className="admin-icon-button admin-header__menu"
          onClick={onOpenSidebar}
          aria-label="打开侧边导航"
        >
          <Menu size={18} />
        </button>
        <div>
          <p className="admin-kicker">Admin Workspace</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="admin-header__actions">
        <div className="admin-header__search">
          <Search size={16} />
          <span>内容、评论、项目</span>
        </div>
        <button type="button" className="admin-icon-button" aria-label="通知">
          <BellDot size={17} />
        </button>
        <button onClick={handleLogout} className="admin-button-subtle">
          <LogOut size={15} />
          <span>登出</span>
        </button>
      </div>
    </header>
  );
}
