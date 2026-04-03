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
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

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
          setStatus("ready");
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

            controllerRef.current = controller;
            lastLoadedUriRef.current = uri;
            setStatus("ready");
          }
        );
      } catch {
        if (!cancelled) {
          setStatus("fallback");
        }
      }
    }

    setupPlayer();

    return () => {
      cancelled = true;
    };
  }, [playlist]);

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
      {status === "loading" ? <p className="nh-music-dock-player-tip">Spotify 播放器加载中...</p> : null}
      <div ref={containerRef} />
    </div>
  );
}
