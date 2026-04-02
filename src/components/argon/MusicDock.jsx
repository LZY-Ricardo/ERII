"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  PLATFORM_CONFIG,
  getMusicDockPlaylists,
  getMusicEmbedUrl,
  getPlaylistCover,
  getPlaylistUrl,
} from "@/src/lib/music";

const HIDDEN_PREFIXES = ["/admin", "/write"];
const STORAGE_KEY = "nh:music-dock:hidden";

function shouldHideDock(pathname) {
  if (!pathname) return false;
  if (pathname === "/music") return true;
  return HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function MusicDock() {
  const pathname = usePathname();
  const playlists = useMemo(() => getMusicDockPlaylists({ limit: 3 }), []);
  const [expanded, setExpanded] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState(playlists[0] ?? null);
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (shouldHideDock(pathname) || !activePlaylist) {
    return null;
  }

  const platform = PLATFORM_CONFIG[activePlaylist.platform || "qq"] ?? PLATFORM_CONFIG.qq;
  const coverUrl = getPlaylistCover(activePlaylist);
  const embedUrl = getMusicEmbedUrl(activePlaylist);
  const playlistUrl = getPlaylistUrl(activePlaylist);

  const handleSelectPlaylist = (playlist) => {
    setActivePlaylist(playlist);
    setExpanded(true);
  };

  const setHiddenState = (nextHidden) => {
    setHidden(nextHidden);
    setExpanded(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextHidden ? "1" : "0");
    } catch {}
  };

  const handlePrimaryAction = () => {
    if (embedUrl) {
      setExpanded(true);
      return;
    }

    window.open(playlistUrl, "_blank", "noopener,noreferrer");
  };

  if (hidden) {
    return (
      <section className="nh-music-dock is-hidden" aria-label="音乐播放器入口">
        <button
          type="button"
          className="nh-music-dock-reveal"
          onClick={() => setHiddenState(false)}
          aria-label="展开音乐入口"
        >
          <span aria-hidden="true">♪</span>
          <small>音乐</small>
        </button>
      </section>
    );
  }

  return (
    <section
      className={`nh-music-dock ${expanded ? "is-expanded" : "is-collapsed"}`}
      aria-label="音乐播放器入口"
    >
      <div className="nh-music-dock-collapsed-shell">
        <button
          type="button"
          className="nh-music-dock-trigger"
          onClick={() => (expanded ? setExpanded(false) : handlePrimaryAction())}
          aria-expanded={expanded}
        >
          <span className="nh-music-dock-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="" />
          </span>
          <span className="nh-music-dock-copy">
            <span className="nh-music-dock-eyebrow">今日陪伴歌单</span>
            <strong>{activePlaylist.name}</strong>
            <span>{embedUrl ? "点开后可直接播放" : `在${platform.name}中打开`}</span>
          </span>
          <span className="nh-music-dock-play" aria-hidden="true">
            {expanded ? "×" : "▶"}
          </span>
        </button>

        {!expanded ? (
          <button
            type="button"
            className="nh-music-dock-hide"
            onClick={() => setHiddenState(true)}
            aria-label="隐藏音乐入口"
            title="隐藏音乐入口"
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className="nh-music-dock-panel">
          <header className="nh-music-dock-head">
            <div>
              <p className="nh-music-dock-title">{activePlaylist.name}</p>
              <p className="nh-music-dock-meta">
                <span
                  className="nh-music-dock-platform"
                  style={{ "--platform-color": platform.color }}
                >
                  {platform.name}
                </span>
                <span>{activePlaylist.description}</span>
              </p>
            </div>
            <button
              type="button"
              className="nh-music-dock-close"
              onClick={() => setExpanded(false)}
              aria-label="关闭音乐面板"
            >
              ×
            </button>
          </header>

          {embedUrl ? (
            <div className="nh-music-dock-embed">
              <iframe
                src={embedUrl}
                title={`${activePlaylist.name} 播放器`}
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
            </div>
          ) : (
            <div className="nh-music-dock-external">
              <p>这个歌单平台不支持站内嵌入播放。</p>
              <a href={playlistUrl} target="_blank" rel="noreferrer" className="nh-music-dock-open">
                去 {platform.name} 播放
              </a>
            </div>
          )}

          <div className="nh-music-dock-actions">
            <button
              type="button"
              className="nh-music-dock-link is-secondary"
              onClick={() => setHiddenState(true)}
            >
              隐藏入口
            </button>
            <a href={playlistUrl} target="_blank" rel="noreferrer" className="nh-music-dock-link">
              在 {platform.name} 打开
            </a>
            <a href="/music" className="nh-music-dock-link is-secondary">
              查看全部歌单
            </a>
          </div>

          <div className="nh-music-dock-switcher" role="list" aria-label="切换歌单">
            {playlists.map((playlist) => {
              const isActive = playlist.id === activePlaylist.id;
              const itemPlatform =
                PLATFORM_CONFIG[playlist.platform || "qq"] ?? PLATFORM_CONFIG.qq;

              return (
                <button
                  key={playlist.id}
                  type="button"
                  className={`nh-music-dock-chip ${isActive ? "is-active" : ""}`}
                  onClick={() => handleSelectPlaylist(playlist)}
                  style={{ "--platform-color": itemPlatform.color }}
                >
                  <span>{playlist.name}</span>
                  <small>{itemPlatform.name}</small>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
