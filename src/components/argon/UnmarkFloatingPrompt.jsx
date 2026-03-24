"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const UNMARK_BASE_URL = "https://unmark.ricardoiyu.top/";
const AUTO_HIDE_MS = 5000;
const FADE_OUT_MS = 420;
const SHOW_DELAY_MS = 700;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 一天内不再展示

const STORAGE_KEYS = {
  closeAt: "nh:unmark:floating:close-at",
  clickAt: "nh:unmark:click-at",
};

function readTimestamp(key) {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(key);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function writeTimestamp(key, value = Date.now()) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(value));
}

function buildCampaignUrl(campaign) {
  const url = new URL(UNMARK_BASE_URL);
  url.searchParams.set("utm_source", "erii_blog");
  url.searchParams.set("utm_medium", "floating_popup");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

export default function UnmarkFloatingPrompt() {
  const [phase, setPhase] = useState("hidden");
  const closeTimerRef = useRef(null);
  const openUrl = useMemo(() => buildCampaignUrl("unmark_trial"), []);

  const closePrompt = () => {
    setPhase((current) => (current === "visible" ? "fading" : current));
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setPhase("hidden");
      writeTimestamp(STORAGE_KEYS.closeAt);
    }, FADE_OUT_MS);
  };

  useEffect(() => {
    const showTimer = window.setTimeout(() => {
      const lastCloseAt = readTimestamp(STORAGE_KEYS.closeAt);
      const withinCooldown = lastCloseAt > 0 && Date.now() - lastCloseAt < COOLDOWN_MS;
      if (withinCooldown) return;
      setPhase("visible");
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (phase !== "visible") return;
    const autoHideTimer = window.setTimeout(() => {
      closePrompt();
    }, AUTO_HIDE_MS);

    return () => window.clearTimeout(autoHideTimer);
  }, [phase]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  const handleClick = () => {
    writeTimestamp(STORAGE_KEYS.clickAt);
  };

  if (phase === "hidden") return null;

  return (
    <section
      className={`nh-unmark-float ${phase === "visible" ? "is-visible" : "is-fading"}`}
      aria-label="Unmark 体验弹窗"
    >
      <button type="button" className="nh-unmark-float-close" onClick={closePrompt} aria-label="关闭提示">
        <span aria-hidden="true">×</span>
      </button>

      <p className="nh-unmark-float-title">试试 Unmark 多平台去水印工具</p>
      <p className="nh-unmark-float-copy">
        支持多平台视频与图集无水印解析下载。先免费体验，满意后可在项目内自愿赞助支持更新。
      </p>

      <a href={openUrl} target="_blank" rel="noreferrer" className="nh-unmark-float-cta" onClick={handleClick}>
        立即去体验
      </a>
    </section>
  );
}
