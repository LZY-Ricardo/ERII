"use client";

import { useEffect, useState } from "react";
import { TrendingSidebar } from "@/src/components/TrendingSidebar";

const STORAGE_KEY = "nh-trending-lang";

const WIDGET_TEXT = {
  zh: { title: "GitHub 热点", toggle: "EN" },
  en: { title: "GitHub Trending", toggle: "中文" },
};

function formatRelativeTime(isoString, lang) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (lang === "zh") {
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const date = new Date(isoString);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function RightbarTrendingWidget() {
  const [lang, setLang] = useState("zh");
  const [trendingFetchedAt, setTrendingFetchedAt] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") setLang(saved);
    } catch {}
  }, []);

  const t = WIDGET_TEXT[lang] || WIDGET_TEXT.zh;
  const titleExtra = formatRelativeTime(trendingFetchedAt, lang);

  function toggleLang() {
    const next = lang === "zh" ? "en" : "zh";
    setLang(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  return (
    <section className="nh-widget nh-card">
      <div className="nh-widget-title-row">
        <h3 className="nh-widget-title">{t.title}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {titleExtra ? <span className="nh-widget-title-extra">{titleExtra}</span> : null}
          <button
            type="button"
            className="nh-trending-lang-toggle"
            onClick={toggleLang}
            title={lang === "zh" ? "Switch to English" : "切换为中文"}
          >
            {t.toggle}
          </button>
        </div>
      </div>
      <TrendingSidebar limit={3} onDataLoaded={setTrendingFetchedAt} lang={lang} />
    </section>
  );
}
