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

export default function SpotifyEmbedPlayer({ playlist, playSignal = 0 }) {
  const containerRef = useRef(null);
  const controllerRef = useRef(null);
  const lastLoadedUriRef = useRef("");
  const lastPlaySignalRef = useRef(0);
  const playlistId = playlist?.id ?? "";
  const [playerState, setPlayerState] = useState(() => ({
    playlistId,
    status: "loading",
  }));
  const status = playerState.playlistId === playlistId ? playerState.status : "loading";

  useEffect(() => {
    let cancelled = false;

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !controllerRef.current) {
        setPlayerState({ playlistId, status: "fallback" });
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
            setPlayerState({ playlistId, status: "ready" });
          }
        );
      } catch {
        if (!cancelled) {
          window.clearTimeout(fallbackTimer);
          setPlayerState({ playlistId, status: "fallback" });
        }
      }
    }

    setupPlayer();

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, [playlist, playlistId]);

  useEffect(() => {
    if (!controllerRef.current || playSignal === 0 || playSignal === lastPlaySignalRef.current) {
      return;
    }

    const uri = getSpotifyEmbedUri(playlist);
    if (lastLoadedUriRef.current !== uri) {
      controllerRef.current.loadUri(uri);
      lastLoadedUriRef.current = uri;
    }

    lastPlaySignalRef.current = playSignal;
    controllerRef.current.play();
  }, [playSignal, playlist, status]);

  useEffect(() => {
    return () => {
      controllerRef.current?.destroy?.();
      controllerRef.current = null;
      lastLoadedUriRef.current = "";
    };
  }, []);

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
