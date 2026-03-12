"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNav } from "./adminNav";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={`
        flex flex-col border-r border-gray-200 bg-white
        transition-[width] duration-200 ease-in-out
        ${collapsed ? "w-16" : "w-56"}
      `}
    >
      {/* Logo / Brand */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        {!collapsed && (
          <Link href="/admin" className="text-base font-semibold text-gray-800 truncate">
            Erii Admin
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`
            ml-auto flex h-7 w-7 items-center justify-center rounded
            text-gray-400 hover:bg-gray-100 hover:text-gray-600
            transition-colors
            ${collapsed ? "mx-auto" : ""}
          `}
          title={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {adminNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
                transition-colors mb-0.5
                ${
                  active
                    ? "bg-rose-50 text-rose-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
                ${collapsed ? "justify-center px-0" : ""}
              `}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Back to site */}
      <div className="border-t border-gray-200 p-2">
        <Link
          href="/"
          className={`
            flex items-center gap-2 rounded-md px-3 py-2 text-xs text-gray-400
            hover:text-gray-600 transition-colors
            ${collapsed ? "justify-center px-0" : ""}
          `}
          title="返回站点"
        >
          {!collapsed && <span>← 返回站点</span>}
          {collapsed && <span className="text-base">←</span>}
        </Link>
      </div>
    </aside>
  );
}
