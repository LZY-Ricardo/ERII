"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import SpotifyEmbedPlayer from "@/src/components/argon/SpotifyEmbedPlayer";
import {
  getAllPlaylists,
  getMusicDockPlaylists,
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
  const allPlaylists = useMemo(() => getAllPlaylists(), []);
  const [expanded, setExpanded] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(
    () => getMusicDockPlaylists({ playlists: allPlaylists, limit: 3 })[0] ?? null
  );
  const [playSignal, setPlaySignal] = useState(0);
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const playlists = useMemo(
    () => getMusicDockPlaylists({ playlists: allPlaylists, limit: 3 }),
    [allPlaylists]
  );
  const activePlaylist = selectedPlaylist ?? playlists[0] ?? null;

  if (shouldHideDock(pathname) || !activePlaylist) {
    return null;
  }

  const coverUrl = getPlaylistCover(activePlaylist);
  const playlistUrl = getPlaylistUrl(activePlaylist);

  const requestPlayback = () => {
    setPlaySignal((current) => current + 1);
  };

  const handleSelectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setExpanded(true);
    requestPlayback();
  };

  const setHiddenState = (nextHidden) => {
    setHidden(nextHidden);
    setExpanded(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextHidden ? "1" : "0");
    } catch {}
  };

  const handlePrimaryAction = () => {
    setExpanded(true);
    requestPlayback();
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
            <span>点开后可直接播放</span>
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

          <div className="nh-music-dock-embed">
            <SpotifyEmbedPlayer playlist={activePlaylist} playSignal={playSignal} />
          </div>

          <div className="nh-music-dock-actions">
            <a href={playlistUrl} target="_blank" rel="noreferrer" className="nh-music-dock-open">
              在 Spotify 中打开
            </a>
          </div>

          <div className="nh-music-dock-switcher" role="list" aria-label="切换歌单">
            {playlists.map((playlist) => {
              const isActive = playlist.id === activePlaylist.id;

              return (
                <button
                  key={playlist.id}
                  type="button"
                  className={`nh-music-dock-chip ${isActive ? "is-active" : ""}`}
                  onClick={() => handleSelectPlaylist(playlist)}
                  style={{ "--platform-color": "#1DB954" }}
                >
                  <span>{playlist.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
