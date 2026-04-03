export const DARK_MODE_STORAGE_KEY = "nh:theme:dark-mode";
export const CLEAN_BACKGROUND_STORAGE_KEY = "nh:theme:clean-background";

export function normalizeCardTransparency(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 25;
  return Math.min(65, Math.max(0, Math.round(numeric)));
}

export function buildCardBackground(transparency, darkMode) {
  const safeTransparency = normalizeCardTransparency(transparency);
  const alpha = Number((1 - safeTransparency / 100).toFixed(3));
  const solidAlpha = Number((1 - (safeTransparency / 100) * 0.85).toFixed(3));

  if (darkMode) {
    return {
      bg: `rgba(38, 28, 31, ${alpha})`,
      solid: `rgba(44, 30, 34, ${solidAlpha})`,
    };
  }

  return {
    bg: `rgba(255, 249, 242, ${alpha})`,
    solid: `rgba(255, 250, 245, ${solidAlpha})`,
  };
}

export function buildBackgroundTheme({ darkMode = false, cleanBackground = false } = {}) {
  if (cleanBackground) {
    return {
      background: darkMode ? "#000000" : "#ffffff",
      image: "none",
      overlayTop: darkMode ? "rgba(0, 0, 0, 0)" : "rgba(255, 255, 255, 0)",
      overlayBottom: darkMode ? "rgba(0, 0, 0, 0)" : "rgba(255, 255, 255, 0)",
    };
  }

  if (darkMode) {
    return {
      background: "#131013",
      image: 'url("/images/longzu-bg.png")',
      overlayTop: "rgba(9, 7, 8, 0.36)",
      overlayBottom: "rgba(9, 7, 8, 0.62)",
    };
  }

  return {
    background: "#f3ece3",
    image: 'url("/images/longzu-bg.png")',
    overlayTop: "rgba(255, 255, 255, 0)",
    overlayBottom: "rgba(255, 255, 255, 0)",
  };
}

export function applyBackgroundTheme(root, { darkMode = false, cleanBackground = false } = {}) {
  if (!root?.style) return;

  const theme = buildBackgroundTheme({ darkMode, cleanBackground });
  root.style.setProperty("--nh-bg", theme.background);
  root.style.setProperty("--nh-bg-image", theme.image);
  root.style.setProperty("--nh-bg-overlay-top", theme.overlayTop);
  root.style.setProperty("--nh-bg-overlay-bottom", theme.overlayBottom);
}
