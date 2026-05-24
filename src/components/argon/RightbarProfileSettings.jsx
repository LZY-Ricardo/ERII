"use client";

import { useState } from "react";
import RightbarAppearancePanel from "@/src/components/argon/RightbarAppearancePanel";

function Tabs({ value, onChange, items }) {
  return (
    <div className="nh-tabs nh-tabs-switch" role="tablist" aria-label="切换选项">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nh-tab-btn ${value === item.id ? "is-active" : ""}`}
          onClick={() => onChange(item.id)}
          role="tab"
          aria-selected={value === item.id}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function OverviewPanel({ postCount, categoryCount, tagCount }) {
  return (
    <div className="nh-profile">
      <p className="nh-profile-name">Ricardo</p>
      <p className="nh-profile-status">前端、AI 与开发学习记录</p>
      <div className="nh-profile-stats">
        <span>{postCount} 篇文章</span>
        <span>{categoryCount} 个分类</span>
        <span>{tagCount} 个标签</span>
      </div>
    </div>
  );
}

export default function RightbarProfileSettings({ postCount = 0, categoryCount = 0, tagCount = 0 }) {
  const [switcherTab, setSwitcherTab] = useState("overview");

  return (
    <section className="nh-widget nh-card">
      <Tabs
        value={switcherTab}
        onChange={setSwitcherTab}
        items={[
          { id: "overview", label: "站点" },
          { id: "tool", label: "设置" },
        ]}
      />
      <div className="nh-switcher-body">
        {switcherTab === "tool" ? (
          <RightbarAppearancePanel />
        ) : (
          <OverviewPanel postCount={postCount} categoryCount={categoryCount} tagCount={tagCount} />
        )}
      </div>
    </section>
  );
}
