"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "首页", href: "/", type: "home", title: "查看全部文章与最新更新" },
  {
    label: "技术文章",
    href: "/blog?topic=tech",
    type: "topic",
    topic: "tech",
    title: "前端与 AI 相关技术内容",
  },
  {
    label: "TeamSpeak",
    href: "/blog?category=TeamSpeak",
    type: "category",
    category: "TeamSpeak",
    title: "语音工具与频道使用相关内容",
  },
  {
    label: "电脑技巧",
    href: "/blog?category=电脑技巧",
    type: "category",
    category: "电脑技巧",
    title: "系统、软件和效率技巧",
  },
  {
    label: "直播动态",
    href: "/blog?category=直播",
    type: "category",
    category: "直播",
    title: "直播相关更新与操作记录",
  },
  {
    label: "游戏记录",
    href: "/blog?category=游戏",
    type: "category",
    category: "游戏",
    title: "游戏体验与实战笔记",
  },
  { label: "关于本站", href: "/about", type: "about", title: "了解站点定位与更新计划" },
];

function isItemActive(item, pathname, currentCategory, currentTag, currentTopic) {
  if (item.type === "home") return pathname === "/";
  if (item.type === "about") return pathname === "/about";
  if (item.type === "blog") return pathname === "/blog" && !currentCategory;
  if (item.type === "category") return pathname === "/blog" && currentCategory === item.category;
  if (item.type === "tag") return pathname === "/blog" && currentTag === item.tag;
  if (item.type === "topic") return pathname === "/blog" && currentTopic === item.topic;
  return false;
}

export default function ArgonNavbar({ activeCategory = "", activeTag = "", activeTopic = "" }) {
  const pathname = usePathname();
  const currentCategory = String(activeCategory ?? "").trim();
  const currentTag = String(activeTag ?? "").trim();
  const currentTopic = String(activeTopic ?? "").trim().toLowerCase();

  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const sync = () => {
      const y = window.scrollY;
      const nextScrolled = y > 24;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const nextProgress = Math.min(100, (y / maxScroll) * 100);

      setIsScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
      setScrollProgress((prev) => (Math.abs(prev - nextProgress) < 0.25 ? prev : nextProgress));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        sync();
      });
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const openSearchPanel = () => {
    window.dispatchEvent(new CustomEvent("nh:open-panel", { detail: { panelId: "search" } }));
  };

  return (
    <header className="nh-header">
      <nav className={`nh-navbar ${isScrolled ? "is-scrolled" : "is-top"}`} aria-label="站点导航">
        <div className="nh-navbar-inner">
          <Link href="/" className="nh-brand" aria-label="回到首页">
            <Image src="/sakura.png" alt="" width={26} height={26} priority />
            <span>ERII · 前端与 AI 博客</span>
          </Link>

          <ul className="nh-nav-list">
            {navItems.map((item) => (
              <li key={`${item.label}:${item.href}`}>
                <Link
                  href={item.href}
                  className={`nh-nav-link ${isItemActive(
                    item,
                    pathname,
                    currentCategory,
                    currentTag,
                    currentTopic
                  ) ? "is-active" : ""}`}
                  title={item.title}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="nh-nav-search"
                aria-label="站内搜索"
                title="打开站内搜索面板"
                onClick={openSearchPanel}
              >
                站内搜索
              </button>
            </li>
          </ul>
        </div>
        <div className="nh-navbar-progress" aria-hidden="true">
          <span style={{ width: `${scrollProgress}%` }} />
        </div>
      </nav>
    </header>
  );
}
