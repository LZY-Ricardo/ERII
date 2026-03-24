"use client";

import { useState } from "react";
import { getPlaylistUrl, PLATFORM_CONFIG } from "@/src/lib/music";

export default function MusicPlaylistCard({ playlist, isActive, onPlay }) {
  const [imageError, setImageError] = useState(false);
  const platform = playlist.platform || "qq";
  const platformConfig = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.qq;

  // 优先使用服务端获取的coverUrl，否则使用占位图
  const getPlaceholder = (name, platform) => {
    const colors = {
      qq: "#31C27C",
      netease: "#C20C0C",
      spotify: "#1DB954",
    };
    const color = colors[platform] || "#888";
    const svg = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="${color}"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="24" fill="white">
          ${name}
        </text>
      </svg>
    `.trim().replace(/\s+/g, " ");
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const coverUrl = playlist.coverUrl || getPlaceholder(playlist.name, platform);

  return (
    <article className={`nh-music-card nh-card ${isActive ? "is-active" : ""}`}>
      <div className="nh-music-cover-wrap" onClick={() => onPlay?.(playlist)}>
        {imageError ? (
          <span className="nh-music-cover nh-music-cover-fallback" aria-hidden="true" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`${playlist.name} cover`}
            className="nh-music-cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* 平台标识 */}
        <span
          className="nh-music-platform-badge"
          title={platformConfig.name}
          dangerouslySetInnerHTML={{ __html: platformConfig.icon }}
        />

        <button
          className="nh-music-play-btn"
          aria-label={`播放 ${playlist.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onPlay?.(playlist);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        {isActive && (
          <span className="nh-music-playing-badge">
            <span></span>
            <span></span>
            <span></span>
          </span>
        )}
      </div>

      <div className="nh-music-body">
        <h3 className="nh-music-title">{playlist.name}</h3>
        <p className="nh-music-description">{playlist.description}</p>

        <div className="nh-music-actions">
          <button className="nh-music-play-link" onClick={() => onPlay?.(playlist)}>
            在线播放
          </button>
          <a
            href={getPlaylistUrl(playlist)}
            target="_blank"
            rel="noreferrer"
            className="nh-music-external-link"
            aria-label={`在${platformConfig.name}打开 ${playlist.name}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6" />
              <path d="M10 14L21 3" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
