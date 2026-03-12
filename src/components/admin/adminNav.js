/**
 * Admin navigation configuration.
 * Single source of truth for sidebar items.
 */
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
} from "lucide-react";

export const adminNav = [
  {
    key: "dashboard",
    label: "仪表盘",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    key: "comments",
    label: "评论管理",
    href: "/admin/comments",
    icon: MessageSquare,
  },
  {
    key: "posts",
    label: "文章管理",
    href: "/admin/posts",
    icon: FileText,
  },
  {
    key: "settings",
    label: "设置",
    href: "/admin/settings",
    icon: Settings,
  },
];
