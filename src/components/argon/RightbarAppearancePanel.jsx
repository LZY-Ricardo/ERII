"use client";

import { useEffect, useState } from "react";
import {
  buildCardBackground,
  CLEAN_BACKGROUND_STORAGE_KEY,
  DARK_MODE_STORAGE_KEY,
  normalizeCardTransparency,
} from "@/src/lib/appearance";

function applyCardTransparencyPreview(value) {
  if (typeof document === "undefined") return;

  const safeTransparency = normalizeCardTransparency(value);
  const body = document.body;
  const darkMode = body.classList.contains("nh-dark");
  const { bg, solid } = buildCardBackground(safeTransparency, darkMode);

  body.style.setProperty("--nh-card-transparency", `${safeTransparency}`);
  body.style.setProperty("--nh-card-bg", bg);
  body.style.setProperty("--nh-card-bg-solid", solid);
}

export default function RightbarAppearancePanel() {
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem(DARK_MODE_STORAGE_KEY) === "dark"
  );
  const [cleanBackground, setCleanBackground] = useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem(CLEAN_BACKGROUND_STORAGE_KEY) === "true"
  );
  const [serifMode, setSerifMode] = useState(true);
  const [deepShadow, setDeepShadow] = useState(false);
  const [filterMode, setFilterMode] = useState("none");
  const [radius, setRadius] = useState(30);
  const [themeColor, setThemeColor] = useState("#89232e");
  const [cardTransparency, setCardTransparency] = useState(25);

  const emitAppearance = (patch) => {
    window.dispatchEvent(new CustomEvent("nh:set-appearance", { detail: patch }));
  };

  useEffect(() => {
    const onAppearanceState = (event) => {
      const detail = event?.detail ?? {};
      setDarkMode(Boolean(detail.darkMode));
      setCleanBackground(Boolean(detail.cleanBackground));
      setSerifMode(Boolean(detail.serifMode));
      setDeepShadow(Boolean(detail.deepShadow));
      setFilterMode(String(detail.filterMode ?? "none"));
      setRadius(Number(detail.radius ?? 30));
      setThemeColor(String(detail.themeColor ?? "#89232e"));
      if (Object.hasOwn(detail, "cardTransparency")) {
        setCardTransparency(normalizeCardTransparency(detail.cardTransparency));
      } else if (Object.hasOwn(detail, "cardOpacity")) {
        setCardTransparency(normalizeCardTransparency(100 - Number(detail.cardOpacity)));
      } else {
        setCardTransparency(25);
      }
    };

    window.addEventListener("nh:appearance-state", onAppearanceState);
    return () => window.removeEventListener("nh:appearance-state", onAppearanceState);
  }, []);

  useEffect(() => {
    applyCardTransparencyPreview(cardTransparency);
  }, [cardTransparency, darkMode]);

  return (
    <div className="nh-controls">
      <label className="nh-control-check">
        <span>深色模式</span>
        <input
          type="checkbox"
          name="rightbar-dark-mode"
          checked={darkMode}
          onChange={(event) => {
            const checked = event.target.checked;
            setDarkMode(checked);
            emitAppearance({ darkMode: checked });
          }}
        />
      </label>

      <label className="nh-control-check">
        <span>纯净背景</span>
        <input
          type="checkbox"
          name="rightbar-clean-background"
          checked={cleanBackground}
          onChange={(event) => {
            const checked = event.target.checked;
            setCleanBackground(checked);
            emitAppearance({ cleanBackground: checked });
          }}
        />
      </label>

      <label className="nh-control-check">
        <span>衬线字体</span>
        <input
          type="checkbox"
          name="rightbar-serif-mode"
          checked={serifMode}
          onChange={(event) => {
            const checked = event.target.checked;
            setSerifMode(checked);
            emitAppearance({ serifMode: checked });
          }}
        />
      </label>

      <label className="nh-control-check">
        <span>阴影增强</span>
        <input
          type="checkbox"
          name="rightbar-deep-shadow"
          checked={deepShadow}
          onChange={(event) => {
            const checked = event.target.checked;
            setDeepShadow(checked);
            emitAppearance({ deepShadow: checked });
          }}
        />
      </label>

      <label>
        滤镜
        <select
          name="rightbar-filter-mode"
          value={filterMode}
          onChange={(event) => {
            const next = event.target.value;
            setFilterMode(next);
            emitAppearance({ filterMode: next });
          }}
        >
          <option value="none">关闭</option>
          <option value="sunset">暖色</option>
          <option value="dim">暗化</option>
          <option value="gray">灰度</option>
        </select>
      </label>

      <label>
        圆角 {radius}px
        <input
          type="range"
          name="rightbar-radius"
          min="8"
          max="36"
          step="1"
          value={radius}
          onChange={(event) => {
            const next = Number(event.target.value);
            setRadius(next);
            emitAppearance({ radius: next });
          }}
        />
      </label>

      <label>
        主题色
        <input
          type="color"
          name="rightbar-theme-color"
          value={themeColor}
          onChange={(event) => {
            const next = event.target.value;
            setThemeColor(next);
            emitAppearance({ themeColor: next });
          }}
        />
      </label>

      <label>
        卡片透明度 {cardTransparency}%
        <input
          type="range"
          name="rightbar-card-transparency"
          min="0"
          max="65"
          step="1"
          value={cardTransparency}
          onChange={(event) => {
            const next = normalizeCardTransparency(event.target.value);
            setCardTransparency(next);
            applyCardTransparencyPreview(next);
            emitAppearance({ cardTransparency: next });
          }}
        />
      </label>
    </div>
  );
}
