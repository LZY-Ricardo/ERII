"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { shouldEnableSiteScrollbar } from "@/src/lib/siteScrollbar";

const ENABLED_CLASS = "nh-site-scrollbar-enabled";
const DESKTOP_SCROLLBAR_QUERY = "(pointer: fine) and (min-width: 900px)";

function toggleScrollbarClass(enabled) {
  document.documentElement.classList.toggle(ENABLED_CLASS, enabled);
  document.body.classList.toggle(ENABLED_CLASS, enabled);
}

export default function SiteScrollbar() {
  const pathname = usePathname() || "/";

  useLayoutEffect(() => {
    let isDisposed = false;
    let scrollbar = null;
    let updateFrame = 0;
    let resizeObserver = null;

    const mediaQuery = window.matchMedia(DESKTOP_SCROLLBAR_QUERY);

    const cancelScheduledUpdate = () => {
      if (!updateFrame) return;
      window.cancelAnimationFrame(updateFrame);
      updateFrame = 0;
    };

    const scheduleUpdate = () => {
      if (!scrollbar || updateFrame) return;
      updateFrame = window.requestAnimationFrame(() => {
        updateFrame = 0;
        scrollbar?.update();
      });
    };

    const stopWatchingSize = () => {
      resizeObserver?.disconnect();
      resizeObserver = null;
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("load", scheduleUpdate);
    };

    const destroyScrollbar = () => {
      stopWatchingSize();
      cancelScheduledUpdate();
      scrollbar?.destroy();
      scrollbar = null;
      toggleScrollbarClass(false);
    };

    const watchSizeChanges = () => {
      window.addEventListener("resize", scheduleUpdate, { passive: true });
      window.addEventListener("load", scheduleUpdate, { passive: true });

      if (!("ResizeObserver" in window)) return;

      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(document.documentElement);
      resizeObserver.observe(document.body);
    };

    const setupScrollbar = async () => {
      destroyScrollbar();

      if (!shouldEnableSiteScrollbar(pathname) || !mediaQuery.matches) return;

      const { DumoguScrollbar } = await import("dumogu-scrollbar");
      if (isDisposed || !shouldEnableSiteScrollbar(pathname) || !mediaQuery.matches) return;

      scrollbar = new DumoguScrollbar({
        keepShow: false,
        stopClickPropagation: true,
      });
      scrollbar.scrollbarEl.classList.add("nh-site-scrollbar");
      scrollbar.bind();
      scrollbar.mount();

      toggleScrollbarClass(true);
      watchSizeChanges();
      scheduleUpdate();
    };

    const handleMediaChange = () => {
      setupScrollbar();
    };

    setupScrollbar();
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      isDisposed = true;
      mediaQuery.removeEventListener("change", handleMediaChange);
      destroyScrollbar();
    };
  }, [pathname]);

  return null;
}
