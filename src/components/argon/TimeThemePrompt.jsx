"use client";

import { useEffect, useRef, useState } from "react";

const NIGHT_START = 20;
const NIGHT_END = 7;
const SHOW_DELAY_MS = 1500;
const AUTO_HIDE_MS = 8000;
const FADE_OUT_MS = 420;
const COOLDOWN_MS = 8 * 60 * 60 * 1000;

const STORAGE_KEY = "nh:time-theme-prompt:dismissed-at";

function isNighttime() {
  const h = new Date().getHours();
  return h >= NIGHT_START || h < NIGHT_END;
}

function readDismissedAt() {
  if (typeof window === "undefined") return 0;
  const v = Number(window.localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function writeDismissedAt() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

function readInitialDarkMode() {
  if (typeof document === "undefined") return false;
  return document.body.classList.contains("nh-dark");
}

export default function TimeThemePrompt() {
  const [phase, setPhase] = useState("hidden");
  const [currentDarkMode, setCurrentDarkMode] = useState(readInitialDarkMode);
  const [suggestedTheme, setSuggestedTheme] = useState(null);
  const closeTimerRef = useRef(null);

  const closePrompt = () => {
    setPhase((p) => (p === "visible" ? "fading" : p));
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setPhase("hidden"), FADE_OUT_MS);
  };

  // Sync with appearance state changes
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail && typeof e.detail.darkMode === "boolean") {
        setCurrentDarkMode(e.detail.darkMode);
      }
    };
    window.addEventListener("nh:appearance-state", handler);
    return () => window.removeEventListener("nh:appearance-state", handler);
  }, []);

  // Show logic
  useEffect(() => {
    const night = isNighttime();
    const mismatch = (night && !currentDarkMode) || (!night && currentDarkMode);
    if (!mismatch) return;

    const timer = setTimeout(() => {
      const last = readDismissedAt();
      if (last > 0 && Date.now() - last < COOLDOWN_MS) return;
      setSuggestedTheme(night ? "dark" : "light");
      setPhase("visible");
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [currentDarkMode]);

  // Auto hide
  useEffect(() => {
    if (phase !== "visible") return;
    const timer = setTimeout(closePrompt, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    []
  );

  const handleAccept = () => {
    window.dispatchEvent(
      new CustomEvent("nh:set-appearance", {
        detail: { darkMode: suggestedTheme === "dark" },
      })
    );
    writeDismissedAt();
    closePrompt();
  };

  const handleDismiss = () => {
    writeDismissedAt();
    closePrompt();
  };

  if (phase === "hidden") return null;

  const isNight = suggestedTheme === "dark";

  return (
    <section
      className={`nh-time-theme-prompt ${phase === "visible" ? "is-visible" : "is-fading"}`}
      aria-label="主题切换提示"
    >
      <button type="button" className="nh-time-theme-close" onClick={handleDismiss} aria-label="关闭提示">
        <span aria-hidden="true">×</span>
      </button>

      <p className="nh-time-theme-title">{isNight ? "夜深了" : "天亮了"}</p>
      <p className="nh-time-theme-copy">
        {isNight
          ? "当前是深色时段，是否切换到深色模式以保护眼睛？"
          : "当前是白天时段，是否切换到浅色模式？"}
      </p>

      <div className="nh-time-theme-actions">
        <button type="button" className="nh-time-theme-cta" onClick={handleAccept}>
          {isNight ? "切换到深色模式" : "切换到浅色模式"}
        </button>
        <button type="button" className="nh-time-theme-dismiss" onClick={handleDismiss}>
          暂不切换
        </button>
      </div>
    </section>
  );
}
