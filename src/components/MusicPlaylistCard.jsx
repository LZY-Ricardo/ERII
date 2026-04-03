"use client";

import { useState } from "react";
import { getMusicPlaybackMode, getPlaylistUrl } from "@/src/lib/music";

function getPlatformLabel(platform) {
  if (platform === "spotify") return "Spotify";
  if (platform === "qq") return "QQ 音乐";
  if (platform === "netease") return "网易云音乐";
  return "音乐";
}

export default function MusicPlaylistCard({ playlist, isActive, onPlay }) {
  const [imageError, setImageError] = useState(false);
  const canPlayInPage = getMusicPlaybackMode(playlist) === "spotify-sdk" && playlist.allowEmbeddedPlayer !== false;
  const platformLabel = getPlatformLabel(playlist.platform);

  const getPlaceholder = (name) => {
    const svg = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="#1DB954"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="24" fill="white">
          ${name}
        </text>
      </svg>
    `.trim().replace(/\s+/g, " ");
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const coverUrl = playlist.coverUrl || getPlaceholder(playlist.name);

  return (
    <article className={`nh-music-card nh-card ${isActive ? "is-active" : ""}`}>
      <div
        className={`nh-music-cover-wrap ${canPlayInPage ? "is-clickable" : ""}`}
        onClick={canPlayInPage ? () => onPlay?.(playlist) : undefined}
      >
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

        {canPlayInPage ? (
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
        ) : null}

        {canPlayInPage && isActive ? (
          <span className="nh-music-playing-badge">
            <span></span>
            <span></span>
            <span></span>
          </span>
        ) : null}
      </div>

      <div className="nh-music-body">
        <div className="nh-music-title-row">
          <h3 className="nh-music-title">{playlist.name}</h3>
          <span className="nh-music-platform-pill">{platformLabel}</span>
        </div>
        <p className="nh-music-description">{playlist.description}</p>

        <div className="nh-music-actions">
          {canPlayInPage ? (
            <button className="nh-music-play-link" onClick={() => onPlay?.(playlist)}>
              {isActive ? "切换到播放器" : "在页面播放"}
            </button>
          ) : (
            <span className="nh-music-action-note">仅提供歌单分享</span>
          )}
          <a
            href={getPlaylistUrl(playlist)}
            target="_blank"
            rel="noreferrer"
            className="nh-music-external-link"
            aria-label={`在 ${platformLabel} 打开 ${playlist.name}`}
            title={`在 ${platformLabel} 中打开`}
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
