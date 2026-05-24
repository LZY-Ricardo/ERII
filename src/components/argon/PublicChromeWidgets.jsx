"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const UnmarkFloatingPrompt = dynamic(() => import("./UnmarkFloatingPrompt"), { ssr: false });
const TimeThemePrompt = dynamic(() => import("./TimeThemePrompt"), { ssr: false });
const MusicDock = dynamic(() => import("./MusicDock"), { ssr: false });

export default function PublicChromeWidgets() {
  const [ready, setReady] = useState(false);
  const [musicDockEnabled, setMusicDockEnabled] = useState(false);

  useEffect(() => {
    const schedule =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => setReady(true), { timeout: 1500 })
        : window.setTimeout(() => setReady(true), 400);

    return () => {
      if (typeof window.cancelIdleCallback === "function" && typeof schedule === "number") {
        window.cancelIdleCallback(schedule);
      } else {
        window.clearTimeout(schedule);
      }
    };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;

    let cancelled = false;

    async function loadMusicDockStatus() {
      try {
        const response = await fetch("/api/music/status", { cache: "no-store" });
        const data = await response.json();

        if (!cancelled) {
          setMusicDockEnabled(Boolean(response.ok && data?.ok && data.musicPlayerEnabled));
        }
      } catch {
        if (!cancelled) {
          setMusicDockEnabled(false);
        }
      }
    }

    loadMusicDockStatus();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <UnmarkFloatingPrompt />
      <TimeThemePrompt />
      {musicDockEnabled ? <MusicDock /> : null}
    </>
  );
}
