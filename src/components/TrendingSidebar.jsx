"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getTrendingDescriptionByLang } from "@/src/lib/trendingDescriptions.mjs";

const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Vue: "#41b883",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
};

function getLangColor(lang) {
  return LANGUAGE_COLORS[lang] || "#888";
}

const UI_TEXT = {
  zh: { empty: "暂无热点数据", starsTitle: "总 stars", periodTitle: "本周新增", more: "查看更多 →" },
  en: { empty: "No trending data", starsTitle: "Total stars", periodTitle: "This week", more: "View More →" },
};

export function TrendingSidebar({ limit = 3, onDataLoaded, lang = "zh" }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shouldFetch, setShouldFetch] = useState(false);
  const containerRef = useRef(null);
  const idleScheduleRef = useRef(null);
  const onDataLoadedRef = useRef(onDataLoaded);

  const t = UI_TEXT[lang] || UI_TEXT.zh;

  useEffect(() => {
    onDataLoadedRef.current = onDataLoaded;
  }, [onDataLoaded]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    if (typeof window.IntersectionObserver !== "function") {
      setShouldFetch(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          idleScheduleRef.current =
            typeof window.requestIdleCallback === "function"
              ? window.requestIdleCallback(() => setShouldFetch(true), { timeout: 1800 })
              : window.setTimeout(() => setShouldFetch(true), 800);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(container);
    return () => {
      observer.disconnect();

      const schedule = idleScheduleRef.current;
      if (schedule === null) return;

      if (typeof window.cancelIdleCallback === "function" && typeof schedule === "number") {
        window.cancelIdleCallback(schedule);
      } else {
        window.clearTimeout(schedule);
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldFetch) return undefined;

    let cancelled = false;

    fetch("/api/trending?period=weekly")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setRepos((data.repos || []).slice(0, limit));
        setLoading(false);
        if (onDataLoadedRef.current && data.fetchedAt) {
          onDataLoadedRef.current(data.fetchedAt);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [limit, shouldFetch]);

  if (loading) {
    return (
      <div ref={containerRef} className="nh-trending-sidebar-loading">
        <span className="nh-loading-skeleton" />
        <span className="nh-loading-skeleton" />
        <span className="nh-loading-skeleton" />
      </div>
    );
  }

  if (!repos.length) {
    return (
      <div ref={containerRef}>
        <p className="nh-muted">{t.empty}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="nh-trending-sidebar">
      <ul className="nh-trending-sidebar-list">
        {repos.map((repo, index) => {
          const description = getTrendingDescriptionByLang(repo, lang);

          return (
            <li key={repo.id} className="nh-trending-sidebar-item">
              <Link
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="nh-trending-sidebar-link"
              >
                <div className="nh-trending-sidebar-header">
                  <span className="nh-trending-sidebar-rank" data-rank={index + 1}>
                    {index + 1}
                  </span>
                  <div className="nh-trending-sidebar-info">
                    <span className="nh-trending-sidebar-name">
                      {repo.owner}/<strong>{repo.name}</strong>
                    </span>
                    {repo.language && (
                      <span className="nh-trending-sidebar-lang">
                        <span
                          className="nh-lang-dot"
                          style={{ background: getLangColor(repo.language) }}
                        />
                        {repo.language}
                      </span>
                    )}
                  </div>
                </div>
                {description && <p className="nh-trending-sidebar-desc">{description}</p>}
                <div className="nh-trending-sidebar-stats">
                  <span className="nh-trending-sidebar-stat" title={t.starsTitle}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                    </svg>
                    {formatNumber(repo.stars)}
                  </span>
                  {repo.periodStars > 0 && (
                    <span className="nh-trending-sidebar-period" title={t.periodTitle}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M8 12a.75.75 0 01-.75-.75V4.56L4.03 7.78a.75.75 0 11-1.06-1.06l4.5-4.5a.75.75 0 011.06 0l4.5 4.5a.75.75 0 11-1.06 1.06L8.75 4.56v6.69A.75.75 0 018 12z" />
                      </svg>
                      +{formatNumber(repo.periodStars)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <a
        href="https://github.com/trending"
        target="_blank"
        rel="noreferrer"
        className="nh-trending-sidebar-more"
      >
        {t.more}
      </a>
    </div>
  );
}
