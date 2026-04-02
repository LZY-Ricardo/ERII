/**
 * Admin navigation configuration.
 * Single source of truth for sidebar items.
 */
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Folder,
  Settings,
} from "lucide-react";

export const adminNav = [
  {
    key: "dashboard",
    label: "仪表盘",
    href: "/admin",
    icon: LayoutDashboard,
    description: "概览与待处理事项",
  },
  {
    key: "comments",
    label: "评论管理",
    href: "/admin/comments",
    icon: MessageSquare,
    description: "审核、垃圾标记与详情",
  },
  {
    key: "posts",
    label: "文章管理",
    href: "/admin/posts",
    icon: FileText,
    description: "草稿、发布与分类处理",
  },
  {
    key: "projects",
    label: "项目管理",
    href: "/admin/projects",
    icon: Folder,
    description: "项目展示与精选排序",
  },
  {
    key: "settings",
    label: "设置",
    href: "/admin/settings",
    icon: Settings,
    description: "站点配置与通知策略",
  },
];
