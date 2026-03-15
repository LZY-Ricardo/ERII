"use client";

export default function ArticleCatalogList({
  items = [],
  activeHeadingId = "",
  expandedParentId = "",
  shouldCollapseNested = false,
  createJumpHandler,
  onAfterJump,
  emptyText = "当前页面暂无章节目录。",
}) {
  if (!items.length) {
    return <p className="nh-muted">{emptyText}</p>;
  }

  return (
    <ol className={`nh-catalog-list ${shouldCollapseNested ? "is-condensed" : ""}`.trim()}>
      {items.map((item) => {
        const isActive = activeHeadingId === item.id;
        const isActiveParent = !isActive && item.id && item.id === expandedParentId;
        const linkClassName = [
          "nh-catalog-link",
          isActive ? "is-active" : "",
          isActiveParent ? "is-active-parent" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <li key={`${item.id || item.text}-${item.index}`} className="nh-catalog-item" data-level={item.level}>
            {item.id ? (
              <a
                href={`#${item.id}`}
                className={linkClassName}
                onClick={createJumpHandler?.(item.id, { onAfterJump })}
                aria-current={isActive ? "location" : undefined}
                title={item.text}
              >
                <span>{item.text}</span>
              </a>
            ) : (
              <span className="nh-catalog-link is-static">
                <span>{item.text}</span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
