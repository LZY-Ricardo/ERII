"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import SpotifyEmbedPlayer from "@/src/components/argon/SpotifyEmbedPlayer";
import {
  formatPlaybackTime,
  getAllPlaylists,
  getPlaybackProgress,
  getMusicDockPlaylists,
  getPlaylistCover,
  getPlaylistUrl,
} from "@/src/lib/music";

const HIDDEN_PREFIXES = ["/admin", "/write"];
const STORAGE_KEY = "nh:music-dock:hidden";
const INITIAL_PLAYBACK_STATE = {
  hasPlayback: false,
  playingURI: "",
  isPlaying: false,
  isPaused: true,
  isBuffering: false,
  position: 0,
  duration: 0,
  updatedAt: 0,
};

function shouldHideDock(pathname) {
  if (!pathname) return false;
  if (pathname === "/music") return true;
  return HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function MusicDock() {
  const pathname = usePathname();
  const allPlaylists = useMemo(() => getAllPlaylists(), []);
  const playlists = useMemo(
    () => getMusicDockPlaylists({ playlists: allPlaylists, limit: 3 }),
    [allPlaylists]
  );
  const [expanded, setExpanded] = useState(false);
  const [hasMountedPlayer, setHasMountedPlayer] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playSignal, setPlaySignal] = useState(0);
  const [controlSignal, setControlSignal] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playbackState, setPlaybackState] = useState(INITIAL_PLAYBACK_STATE);
  const [metaState, setMetaState] = useState({
    uri: "",
    title: "",
    subtitle: "",
    coverUrl: "",
  });
  const [now, setNow] = useState(() => Date.now());
  const metadataCacheRef = useRef(new Map());
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const activePlaylist = selectedPlaylist ?? playlists[0] ?? null;
  const hasMiniPlayback = playbackState.hasPlayback;
  const shouldShowSwitcher = playlists.length > 1;
  const coverUrl = activePlaylist ? getPlaylistCover(activePlaylist) : "";
  const playlistUrl = activePlaylist ? getPlaylistUrl(activePlaylist) : "#";

  const requestPlayback = () => {
    setPlaySignal((current) => current + 1);
  };

  const ensurePlayerMounted = () => {
    setHasMountedPlayer(true);
  };

  const sendControlSignal = (type) => {
    setControlSignal((current) => ({
      type,
      nonce: (current?.nonce ?? 0) + 1,
    }));
  };

  const handleSelectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    ensurePlayerMounted();
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
    ensurePlayerMounted();
    setExpanded(true);
  };

  const handleMiniPlay = () => {
    ensurePlayerMounted();
    setExpanded(true);
    requestPlayback();
  };

  const handleMiniToggle = () => {
    if (!hasMiniPlayback) {
      handleMiniPlay();
      return;
    }

    if (!playerReady) {
      setExpanded(true);
      requestPlayback();
      return;
    }

    sendControlSignal(playbackState.isPlaying ? "pause" : "resume");
  };

  useEffect(() => {
    if (!playbackState.playingURI) {
      return;
    }

    const cached = metadataCacheRef.current.get(playbackState.playingURI);
    if (cached) {
      setMetaState(cached);
      return;
    }

    let cancelled = false;

    async function loadTrackMeta() {
      try {
        const response = await fetch(
          `/api/music/spotify-meta?uri=${encodeURIComponent(playbackState.playingURI)}`,
          { cache: "force-cache" }
        );
        if (!response.ok) {
          throw new Error(`Failed to resolve Spotify metadata: ${response.status}`);
        }

        const payload = await response.json();
        if (cancelled) {
          return;
        }

        const nextMeta = {
          uri: playbackState.playingURI,
          title: payload?.title || "",
          subtitle: payload?.subtitle || "",
          coverUrl: payload?.coverUrl || "",
        };

        metadataCacheRef.current.set(playbackState.playingURI, nextMeta);
        setMetaState(nextMeta);
      } catch {
        if (cancelled) {
          return;
        }

        setMetaState({
          uri: playbackState.playingURI,
          title: "",
          subtitle: "",
          coverUrl: "",
        });
      }
    }

    loadTrackMeta();

    return () => {
      cancelled = true;
    };
  }, [playbackState.playingURI]);

  useEffect(() => {
    if (!hasMiniPlayback || !playbackState.isPlaying || playbackState.isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 500);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasMiniPlayback, playbackState.isPaused, playbackState.isPlaying]);

  const elapsedSinceUpdate =
    playbackState.isPlaying && !playbackState.isPaused
      ? Math.max(0, now - playbackState.updatedAt)
      : 0;
  const livePosition = Math.min(
    playbackState.duration || 0,
    (playbackState.position || 0) + elapsedSinceUpdate
  );
  const progressRatio = getPlaybackProgress(livePosition, playbackState.duration);
  const trackTitle = metaState.title || "正在播放此歌单";
  const trackSubtitle = metaState.subtitle || activePlaylist?.name || "";
  const displayCoverUrl = metaState.coverUrl || coverUrl;
  const progressLabel = `${formatPlaybackTime(livePosition)} / ${formatPlaybackTime(playbackState.duration)}`;

  if (shouldHideDock(pathname) || !activePlaylist) {
    return null;
  }

  return (
    <section
      className={`nh-music-dock ${expanded ? "is-expanded" : "is-collapsed"} ${hidden ? "is-hidden" : ""}`}
      aria-label="音乐播放器入口"
    >
      {hidden ? (
        <button
          type="button"
          className="nh-music-dock-reveal"
          onClick={() => setHiddenState(false)}
          aria-label="展开音乐入口"
        >
          <span aria-hidden="true">♪</span>
          <small>音乐</small>
        </button>
      ) : !expanded ? (
        <div className="nh-music-dock-collapsed-shell">
          <button
            type="button"
            className="nh-music-dock-trigger"
            onClick={handlePrimaryAction}
            aria-expanded={expanded}
          >
            <span className="nh-music-dock-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayCoverUrl} alt="" />
            </span>
            <span className="nh-music-dock-copy">
              {hasMiniPlayback ? (
                <>
                  <span className="nh-music-dock-eyebrow">Spotify 正在播放</span>
                  <strong>{trackTitle}</strong>
                  <span>{trackSubtitle}</span>
                  <span className="nh-music-dock-progress-meta">{progressLabel}</span>
                  <span
                    className="nh-music-dock-progress-bar"
                    role="progressbar"
                    aria-label="当前播放进度"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progressRatio * 100)}
                  >
                    <span style={{ width: `${progressRatio * 100}%` }} />
                  </span>
                </>
              ) : (
                <>
                  <span className="nh-music-dock-eyebrow">今日陪伴歌单</span>
                  <strong>{activePlaylist.name}</strong>
                  <span>收起后会继续播放</span>
                </>
              )}
            </span>
          </button>

          <button
            type="button"
            className="nh-music-dock-play"
            onClick={hasMiniPlayback ? handleMiniToggle : handleMiniPlay}
            aria-label={hasMiniPlayback ? (playbackState.isPlaying ? "暂停播放" : "继续播放") : "展开并播放"}
            title={hasMiniPlayback ? (playbackState.isPlaying ? "暂停播放" : "继续播放") : "展开并播放"}
          >
            <span aria-hidden="true">{hasMiniPlayback && playbackState.isPlaying ? "❚❚" : "▶"}</span>
          </button>

          <button
            type="button"
            className="nh-music-dock-hide"
            onClick={() => setHiddenState(true)}
            aria-label="隐藏音乐入口"
            title="隐藏音乐入口"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      ) : null}

      <div className={`nh-music-dock-panel-shell ${expanded ? "is-expanded" : ""}`}>
        <div className="nh-music-dock-panel">
          <header className="nh-music-dock-head">
            <div className="nh-music-dock-head-copy">
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
            {hasMountedPlayer ? (
              <SpotifyEmbedPlayer
                playlist={activePlaylist}
                playSignal={playSignal}
                controlSignal={controlSignal}
                onReadyChange={setPlayerReady}
                onPlaybackChange={(nextState) =>
                  setPlaybackState((current) => ({
                    ...current,
                    ...nextState,
                  }))
                }
              />
            ) : (
              <div className="nh-music-dock-embed-placeholder" aria-hidden="true" />
            )}
          </div>

          <div className="nh-music-dock-actions">
            <a href={playlistUrl} target="_blank" rel="noreferrer" className="nh-music-dock-open">
              在 Spotify 中打开
            </a>
          </div>

          {shouldShowSwitcher ? (
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
          ) : null}
        </div>
      </div>
    </section>
  );
}
