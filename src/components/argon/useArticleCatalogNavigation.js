"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeTocItems } from "@/src/lib/articleToc";

const DEFAULT_COLLAPSE_THRESHOLD = 10;
const DEFAULT_SCROLL_OFFSET = 140;

function attachHeadingParents(items) {
  let currentLevel1Id = "";
  let currentLevel2Id = "";

  return items.map((item) => {
    const nextItem = { ...item, parentId: "" };

    if (item.level === 1) {
      currentLevel1Id = item.id;
      currentLevel2Id = "";
      return nextItem;
    }

    if (item.level === 2) {
      currentLevel2Id = item.id;
      return nextItem;
    }

    if (item.level === 3) {
      nextItem.parentId = currentLevel2Id || currentLevel1Id || "";
    }

    return nextItem;
  });
}

function resolveExpandedParentId(items, activeHeadingId) {
  const activeItem = items.find((item) => item.id === activeHeadingId);

  if (activeItem?.level === 3 && activeItem.parentId) {
    return activeItem.parentId;
  }

  if (activeItem?.level === 2 && activeItem.id) {
    return activeItem.id;
  }

  return items.find((item) => item.level === 3 && item.parentId)?.parentId ?? "";
}

export function useArticleCatalogNavigation(
  tocItems,
  { collapseThreshold = DEFAULT_COLLAPSE_THRESHOLD, scrollOffset = DEFAULT_SCROLL_OFFSET } = {}
) {
  const catalogItems = useMemo(() => attachHeadingParents(normalizeTocItems(tocItems)), [tocItems]);
  const [activeHeadingId, setActiveHeadingId] = useState("");

  const resolvedActiveHeadingId = useMemo(() => {
    if (catalogItems.some((item) => item.id === activeHeadingId)) {
      return activeHeadingId;
    }

    return catalogItems.find((item) => item.id)?.id ?? "";
  }, [activeHeadingId, catalogItems]);

  const expandedParentId = useMemo(
    () => resolveExpandedParentId(catalogItems, resolvedActiveHeadingId),
    [catalogItems, resolvedActiveHeadingId]
  );

  const shouldCollapseNested = useMemo(
    () => catalogItems.length >= collapseThreshold && catalogItems.some((item) => item.level === 3 && item.parentId),
    [catalogItems, collapseThreshold]
  );

  const visibleItems = useMemo(() => {
    if (!shouldCollapseNested) return catalogItems;

    return catalogItems.filter(
      (item) => item.level !== 3 || !item.parentId || item.parentId === expandedParentId
    );
  }, [catalogItems, expandedParentId, shouldCollapseNested]);

  const jumpToHeading = (id, { onAfterJump } = {}) => (event) => {
    if (!id || typeof window === "undefined") return;

    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    window.history.pushState(null, "", `#${encodeURIComponent(id)}`);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveHeadingId(id);
    onAfterJump?.();
  };

  useEffect(() => {
    if (!catalogItems.length || typeof window === "undefined") return undefined;

    let frameId = 0;

    const updateActiveHeading = () => {
      frameId = 0;
      const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      let nextActive = "";

      for (const item of catalogItems) {
        if (!item.id) continue;
        const element = document.getElementById(item.id);
        if (!element) continue;

        if (element.getBoundingClientRect().top <= scrollOffset) {
          nextActive = item.id;
          continue;
        }

        break;
      }

      if (!nextActive && hashId && catalogItems.some((item) => item.id === hashId)) {
        nextActive = hashId;
      }

      if (!nextActive) {
        nextActive = catalogItems.find((item) => item.id)?.id ?? "";
      }

      setActiveHeadingId((current) => (current === nextActive ? current : nextActive));
    };

    const requestUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateActiveHeading);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("hashchange", requestUpdate);
    };
  }, [catalogItems, scrollOffset]);

  return {
    catalogItems,
    visibleItems,
    activeHeadingId: resolvedActiveHeadingId,
    expandedParentId,
    shouldCollapseNested,
    jumpToHeading,
  };
}
