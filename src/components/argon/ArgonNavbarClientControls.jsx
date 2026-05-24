"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buildBlogSearchHref, normalizeSearchKeyword } from "@/src/lib/postSearch";

export default function ArgonNavbarClientControls({ activeSearchQuery = "" }) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(normalizeSearchKeyword(activeSearchQuery));
  const searchInputRef = useRef(null);
  const searchShellRef = useRef(null);

  useEffect(() => {
    setSearchKeyword(normalizeSearchKeyword(activeSearchQuery));
  }, [activeSearchQuery]);

  useEffect(() => {
    let frame = 0;
    const navbar = document.querySelector("[data-nh-navbar]");
    const progressBar = document.querySelector("[data-nh-navbar-progress]");

    const sync = () => {
      const y = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(100, (y / maxScroll) * 100);

      navbar?.classList.toggle("is-scrolled", y > 24);
      navbar?.classList.toggle("is-top", y <= 24);
      if (progressBar) progressBar.style.width = `${progress}%`;
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
    if (!isSearchOpen) return undefined;
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return undefined;

    const handlePointerDown = (event) => {
      if (searchShellRef.current?.contains(event.target)) return;
      setIsSearchOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isSearchOpen]);

  const openSearchPanel = (keyword = "") => {
    window.dispatchEvent(
      new CustomEvent("nh:open-panel", {
        detail: { panelId: "search", keyword: String(keyword ?? "") },
      })
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
    if (submitSearch()) return;
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
        name="keyword"
        className="nh-nav-search-input"
        placeholder="搜索什么..."
        value={searchKeyword}
        onChange={(event) => setSearchKeyword(event.target.value)}
        onKeyDown={handleSearchKeyDown}
        tabIndex={isSearchOpen ? 0 : -1}
        aria-hidden={!isSearchOpen}
      />
    </form>
  );
}
