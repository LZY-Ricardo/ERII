"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { label: "首页", href: "/", type: "home", title: "查看全部文章与最新更新" },
  {
    label: "技术分享",
    href: "/blog?topic=tech",
    type: "topic",
    topic: "tech",
    title: "前端与 AI 技术分享内容",
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const searchInputRef = useRef(null);
  const searchShellRef = useRef(null);

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

  useEffect(() => {
    if (!isSearchOpen) return;
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const handlePointerDown = (event) => {
      if (searchShellRef.current?.contains(event.target)) return;
      setIsSearchOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isSearchOpen]);

  const openSearchPanel = (keyword = "") => {
    window.dispatchEvent(
      new CustomEvent("nh:open-panel", { detail: { panelId: "search", keyword: String(keyword ?? "") } })
    );
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    openSearchPanel(searchKeyword.trim());
  };

  const handleSearchToggle = () => {
    if (!isSearchOpen) {
      setIsSearchOpen(true);
      return;
    }
    if (searchKeyword.trim()) {
      openSearchPanel(searchKeyword.trim());
      return;
    }
    setIsSearchOpen(false);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setSearchKeyword("");
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="nh-header">
      <nav className={`nh-navbar ${isScrolled ? "is-scrolled" : "is-top"}`} aria-label="站点导航">
        <div className="nh-navbar-inner">
          <Link href="/" className="nh-brand" aria-label="回到首页" onClick={() => setIsSearchOpen(false)}>
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
                  onClick={() => setIsSearchOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <form
                ref={searchShellRef}
                className={`nh-nav-search-shell ${isSearchOpen ? "is-open" : ""}`}
                role="search"
                aria-label="站内搜索"
                onSubmit={handleSearchSubmit}
              >
                <button
                  type="button"
                  className="nh-nav-search-toggle"
                  aria-label={isSearchOpen ? "执行搜索" : "展开搜索"}
                  title={isSearchOpen ? "执行搜索" : "展开搜索"}
                  onClick={handleSearchToggle}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M15.5 14h-.79l-.28-.27a6 6 0 1 0-.71.71l.27.28v.79L20 21.5 21.5 20l-6-6zm-5.5 0A4.5 4.5 0 1 1 10 5a4.5 4.5 0 0 1 0 9z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <input
                  ref={searchInputRef}
                  type="search"
                  className="nh-nav-search-input"
                  placeholder="搜索什么..."
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  tabIndex={isSearchOpen ? 0 : -1}
                  aria-hidden={!isSearchOpen}
                />
              </form>
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
