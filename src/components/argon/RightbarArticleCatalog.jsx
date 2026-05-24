"use client";

import ArticleCatalogList from "@/src/components/argon/ArticleCatalogList";
import { useArticleCatalogNavigation } from "@/src/components/argon/useArticleCatalogNavigation";

export default function RightbarArticleCatalog({ tocItems = [] }) {
  const {
    catalogItems,
    visibleItems,
    activeHeadingId,
    expandedParentId,
    shouldCollapseNested,
    jumpToHeading,
  } = useArticleCatalogNavigation(tocItems);

  if (!catalogItems.length) return null;

  return (
    <ArticleCatalogList
      items={visibleItems}
      activeHeadingId={activeHeadingId}
      expandedParentId={expandedParentId}
      shouldCollapseNested={shouldCollapseNested}
      createJumpHandler={jumpToHeading}
    />
  );
}
