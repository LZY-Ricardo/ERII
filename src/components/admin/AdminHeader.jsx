"use client";

import { usePathname, useRouter } from "next/navigation";
import { adminNav } from "./adminNav";
import { LogOut } from "lucide-react";

export default function AdminHeader() {
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
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>

      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-500
          hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <LogOut size={15} />
        <span>登出</span>
      </button>
    </header>
  );
}
