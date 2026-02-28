"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "首页", href: "/", type: "home" },
  { label: "执行部", href: "/blog?category=TeamSpeak", type: "category", category: "TeamSpeak" },
  { label: "装备部", href: "/blog?category=电脑技巧", type: "category", category: "电脑技巧" },
  { label: "夜航局", href: "/blog?category=直播", type: "category", category: "直播" },
  { label: "实战课", href: "/blog?category=游戏", type: "category", category: "游戏" },
  { label: "档案馆", href: "/blog", type: "blog" },
  { label: "关于", href: "/about", type: "about" },
];

function isItemActive(item, pathname, currentCategory) {
  if (item.type === "home") return pathname === "/";
  if (item.type === "about") return pathname === "/about";
  if (item.type === "blog") return pathname === "/blog" && !currentCategory;
  if (item.type === "category") return pathname === "/blog" && currentCategory === item.category;
  return false;
}

export default function ArgonNavbar({ activeCategory = "" }) {
  const pathname = usePathname();
  const currentCategory = String(activeCategory ?? "").trim();

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
            <span>ERII · 卡塞尔档案馆</span>
          </Link>

          <ul className="nh-nav-list">
            {navItems.map((item) => (
              <li key={`${item.label}:${item.href}`}>
                <Link
                  href={item.href}
                  className={`nh-nav-link ${isItemActive(item, pathname, currentCategory) ? "is-active" : ""}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="nh-nav-search"
                aria-label="搜索"
                onClick={openSearchPanel}
              >
                搜索
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
