const LOCAL_PROJECT_COVER_WEBP_MAP = new Map(
  [
    "brainstorming-challenge-v2",
    "cassell-college-teamspeak",
    "chroma-study-v2",
    "dragon-game-v2",
    "erii",
    "file_1772469201085_918",
    "free-video-download",
    "ai-chat-notify-v2",
    "mind-nexus-v2",
    "pet",
    "react-playground-v2",
    "ricardo-low-code-platform-frontend-v2",
    "ricardo-notebook-v2",
    "time-sequence-v2",
    "unmark",
    "unmark-real-v2",
    "wardrobe-little-ai",
    "wardrobe-little-ai-real-v2",
    "zen-reader",
    "zen-reader-v2",
  ].map((name) => [`/images/projects/${name}.png`, `/images/projects/${name}.webp`])
);

export function optimizeProjectCoverUrl(cover) {
  const src = String(cover ?? "").trim();
  if (!src) return "";
  return LOCAL_PROJECT_COVER_WEBP_MAP.get(src) ?? src;
}
