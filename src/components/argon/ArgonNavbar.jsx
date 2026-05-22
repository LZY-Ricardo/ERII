"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buildBlogSearchHref, normalizeSearchKeyword } from "@/src/lib/postSearch";

const navItems = [
  { label: "首页", href: "/", type: "home", title: "查看全部文章与最新更新" },
  {
    label: "前端",
    href: "/blog?category=前端",
    type: "category",
    category: "前端",
    title: "查看前端与 JavaScript 相关文章",
  },
  {
    label: "AI",
    href: "/blog?category=AI",
    type: "category",
    category: "AI",
    title: "查看 AI、大模型与智能体相关文章",
  },
  {
    label: "后端",
    href: "/blog?category=后端",
    type: "category",
    category: "后端",
    title: "查看 Node、Java 与服务端相关文章",
  },
  {
    label: "算法",
    href: "/blog?category=算法",
    type: "category",
    category: "算法",
    title: "查看算法与数据结构相关文章",
  },
  {
    label: "TeamSpeak",
    href: "/blog?category=TeamSpeak",
    type: "category",
    category: "TeamSpeak",
    title: "查看 TeamSpeak 相关内容",
  },
  {
    label: "电脑技巧",
    href: "/blog?category=电脑技巧",
    type: "category",
    category: "电脑技巧",
    title: "查看系统、软件和效率技巧",
  },
  {
    label: "音乐",
    href: "/music",
    type: "music",
    title: "精选音乐歌单分享",
  },
  {
    label: "直播",
    href: "/blog?category=直播",
    type: "category",
    category: "直播",
    title: "查看直播相关内容",
  },
  {
    label: "游戏",
    href: "/blog?category=游戏",
    type: "category",
    category: "游戏",
    title: "查看游戏相关内容",
  },
  {
    label: "资源库",
    href: "/resources",
    type: "resources",
    title: "查看我常用的 AI、开发、网络与效率资源",
  },
  {
    label: "项目",
    href: "/projects",
    type: "projects",
    title: "查看我的项目简介、技术栈与链接",
  },
  { label: "关于本站", href: "/about", type: "about", title: "了解站点定位与更新计划" },
  {
    label: "Cassell",
    href: "https://cassellcollege.com/",
    type: "external",
    title: "卡塞尔学院守夜人论坛 — 哪怕是普通人，也有想守护的东西",
  },
];

function isItemActive(item, pathname, currentCategory, currentTag, currentTopic) {
  if (item.type === "home") return pathname === "/";
  if (item.type === "projects") return pathname === "/projects";
  if (item.type === "resources") return pathname === "/resources";
  if (item.type === "about") return pathname === "/about";
  if (item.type === "music") return pathname === "/music";
  if (item.type === "blog") return pathname === "/blog" && !currentCategory;
  if (item.type === "category") return pathname === "/blog" && currentCategory === item.category;
  if (item.type === "tag") return pathname === "/blog" && currentTag === item.tag;
  if (item.type === "topic") return pathname === "/blog" && currentTopic === item.topic;
  return false;
}

export default function ArgonNavbar({
  activeCategory = "",
  activeTag = "",
  activeTopic = "",
  activeSearchQuery = "",
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentCategory = String(activeCategory ?? "").trim();
  const currentTag = String(activeTag ?? "").trim();
  const currentTopic = String(activeTopic ?? "").trim().toLowerCase();

  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(normalizeSearchKeyword(activeSearchQuery));
  const searchInputRef = useRef(null);
  const searchShellRef = useRef(null);

  useEffect(() => {
    setSearchKeyword(normalizeSearchKeyword(activeSearchQuery));
  }, [activeSearchQuery]);

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

  const submitSearch = () => {
    const keyword = normalizeSearchKeyword(searchKeyword);
    if (!keyword) return false;

    router.push(buildBlogSearchHref(keyword));
    setIsSearchOpen(false);
    return true;
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (submitSearch()) return;
    openSearchPanel("");
  };

  const handleSearchToggle = () => {
    if (!isSearchOpen) {
      setIsSearchOpen(true);
      return;
    }
    if (submitSearch()) {
      return;
    }
    openSearchPanel("");
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
          <div className="nh-navbar-left">
            <Link href="/" className="nh-brand" aria-label="回到首页" onClick={() => setIsSearchOpen(false)}>
              <Image src="/sakura.png" alt="" width={26} height={26} priority />
            </Link>

            <ul className="nh-nav-list">
              {navItems.map((item) => (
                <li key={`${item.label}:${item.href}`}>
                  {item.type === "external" ? (
                    <a
                      href={item.href}
                      className="nh-nav-link is-external"
                      title={item.title}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Image
                        src="/cassel-crest.png"
                        alt=""
                        width={18}
                        height={18}
                        className="nh-nav-cassel-icon"
                      />
                      {item.label}
                    </a>
                  ) : (
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
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="nh-navbar-right">
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
          </div>
        </div>
        <div className="nh-navbar-progress" aria-hidden="true">
          <span style={{ width: `${scrollProgress}%` }} />
        </div>
      </nav>
    </header>
  );
}
