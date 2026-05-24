"use client";

import { useState } from "react";
import { TrendingSidebar } from "@/src/components/TrendingSidebar";

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const date = new Date(isoString);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export default function RightbarTrendingWidget() {
  const [trendingFetchedAt, setTrendingFetchedAt] = useState(null);
  const titleExtra = formatRelativeTime(trendingFetchedAt);

  return (
    <section className="nh-widget nh-card">
      <div className="nh-widget-title-row">
        <h3 className="nh-widget-title">GitHub 热点</h3>
        {titleExtra ? <span className="nh-widget-title-extra">{titleExtra}</span> : null}
      </div>
      <TrendingSidebar limit={3} onDataLoaded={setTrendingFetchedAt} />
    </section>
  );
}
