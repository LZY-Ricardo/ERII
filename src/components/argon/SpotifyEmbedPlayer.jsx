"use client";

import { useEffect, useRef, useState } from "react";
import { getSpotifyEmbedUri } from "@/src/lib/music";

let spotifyIframeApiPromise = null;

function loadSpotifyIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Spotify iFrame API requires a browser environment."));
  }

  if (window.SpotifyIFrameAPI) {
    return Promise.resolve(window.SpotifyIFrameAPI);
  }

  if (!spotifyIframeApiPromise) {
    spotifyIframeApiPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-spotify-iframe-api="true"]');

      const handleReady = (api) => {
        resolve(api);
      };

      const previousHandler = window.onSpotifyIframeApiReady;
      window.onSpotifyIframeApiReady = (api) => {
        previousHandler?.(api);
        handleReady(api);
      };

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://open.spotify.com/embed/iframe-api/v1";
        script.async = true;
        script.dataset.spotifyIframeApi = "true";
        script.onerror = () => reject(new Error("Failed to load Spotify iFrame API."));
        document.body.appendChild(script);
      }
    });
  }

  return spotifyIframeApiPromise;
}

export default function SpotifyEmbedPlayer({
  playlist,
  playSignal = 0,
  controlSignal = null,
  onReadyChange,
  onPlaybackChange,
}) {
  const containerRef = useRef(null);
  const controllerRef = useRef(null);
  const lastLoadedUriRef = useRef("");
  const lastPlaySignalRef = useRef(0);
  const lastControlSignalRef = useRef(0);
  const pendingPlaySignalRef = useRef(0);
  const playlistId = playlist?.id ?? "";
  const [playerState, setPlayerState] = useState(() => ({
    playlistId,
    status: "loading",
  }));
  const status = playerState.playlistId === playlistId ? playerState.status : "loading";

  const flushPendingPlay = () => {
    if (!controllerRef.current || pendingPlaySignalRef.current === 0) {
      return;
    }

    pendingPlaySignalRef.current = 0;
    controllerRef.current.play?.();
  };

  useEffect(() => {
    let cancelled = false;

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !controllerRef.current) {
        setPlayerState({ playlistId, status: "fallback" });
        onReadyChange?.(false);
      }
    }, 4500);

    async function setupPlayer() {
      try {
        const api = await loadSpotifyIframeApi();

        if (cancelled || !containerRef.current) {
          return;
        }

        const uri = getSpotifyEmbedUri(playlist);

        if (controllerRef.current) {
          if (lastLoadedUriRef.current !== uri) {
            controllerRef.current.loadUri(uri);
            lastLoadedUriRef.current = uri;
          }
          setPlayerState({ playlistId, status: "ready" });
          onReadyChange?.(true);
          return;
        }

        api.createController(
          containerRef.current,
          {
            uri,
            width: "100%",
            height: 352,
          },
          (controller) => {
            if (cancelled) {
              controller?.destroy?.();
              return;
            }

            window.clearTimeout(fallbackTimer);
            controllerRef.current = controller;
            lastLoadedUriRef.current = uri;
            controller.addListener?.("ready", () => {
              onReadyChange?.(true);
            });
            controller.addListener?.("playback_started", (event) => {
              const data = event?.data ?? {};
              onPlaybackChange?.({
                hasPlayback: true,
                playingURI: data.playingURI ?? "",
                isPaused: false,
                isPlaying: true,
                isBuffering: false,
                position: Number(data.position ?? 0),
                duration: Number(data.duration ?? 0),
                updatedAt: Date.now(),
              });
            });
            controller.addListener?.("playback_update", (event) => {
              const data = event?.data ?? {};
              onPlaybackChange?.({
                hasPlayback: Boolean(data.playingURI),
                playingURI: data.playingURI ?? "",
                isPaused: Boolean(data.isPaused),
                isPlaying: !data.isPaused,
                isBuffering: Boolean(data.isBuffering),
                position: Number(data.position ?? 0),
                duration: Number(data.duration ?? 0),
                updatedAt: Date.now(),
              });
            });
            setPlayerState({ playlistId, status: "ready" });
            onReadyChange?.(true);
            window.setTimeout(() => {
              flushPendingPlay();
            }, 0);
          }
        );
      } catch {
        if (!cancelled) {
          window.clearTimeout(fallbackTimer);
          setPlayerState({ playlistId, status: "fallback" });
          onReadyChange?.(false);
        }
      }
    }

    setupPlayer();

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, [onPlaybackChange, onReadyChange, playlist, playlistId]);

  useEffect(() => {
    if (playSignal === 0 || playSignal === lastPlaySignalRef.current) {
      return;
    }

    pendingPlaySignalRef.current = playSignal;
    lastPlaySignalRef.current = playSignal;

    if (!controllerRef.current) {
      return;
    }

    const uri = getSpotifyEmbedUri(playlist);
    if (lastLoadedUriRef.current !== uri) {
      controllerRef.current.loadUri(uri);
      lastLoadedUriRef.current = uri;
    }

    flushPendingPlay();
  }, [playSignal, playlist, status]);

  useEffect(() => {
    if (!controllerRef.current || !controlSignal?.type || !controlSignal?.nonce) {
      return;
    }

    if (lastControlSignalRef.current === controlSignal.nonce) {
      return;
    }

    lastControlSignalRef.current = controlSignal.nonce;

    if (controlSignal.type === "pause") {
      controllerRef.current.pause?.();
      return;
    }

    if (controlSignal.type === "resume") {
      controllerRef.current.resume?.();
      return;
    }

    if (controlSignal.type === "toggle") {
      controllerRef.current.togglePlay?.();
    }
  }, [controlSignal]);

  useEffect(() => {
    return () => {
      onReadyChange?.(false);
      controllerRef.current?.destroy?.();
      controllerRef.current = null;
      lastLoadedUriRef.current = "";
      pendingPlaySignalRef.current = 0;
    };
  }, [onReadyChange]);

  if (status === "fallback") {
    return (
      <iframe
        src={`https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator`}
        title={`${playlist.name} Spotify 播放器`}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    );
  }

  return (
    <div className="nh-music-dock-spotify-player">
      {status === "loading" ? (
        <div className="nh-spotify-player-skeleton" aria-hidden="true">
          <div className="nh-spotify-player-skeleton__badge">
            <span className="nh-spotify-player-skeleton__badge-dot" />
            <span className="nh-spotify-player-skeleton__badge-text">Spotify</span>
          </div>
          <div className="nh-spotify-player-skeleton__disc" />
          <div className="nh-spotify-player-skeleton__lines">
            <span className="is-title" />
            <span />
            <span className="is-short" />
          </div>
          <div className="nh-spotify-player-skeleton__wave">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}
      <div ref={containerRef} />
    </div>
  );
}
