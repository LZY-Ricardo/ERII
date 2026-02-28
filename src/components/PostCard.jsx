import Link from "next/link";
import { getCategoryThemeLabel, inferCategoryFromPost } from "@/src/lib/postTaxonomy";

function hashNumber(input, min, max) {
  const raw = String(input ?? "");
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const safe = Math.abs(hash);
  return min + (safe % (max - min + 1));
}

export default function PostCard({ post }) {
  const title = String(post?.frontmatter?.title ?? "");
  const description = String(post?.frontmatter?.description ?? "");
  const tags = post?.frontmatter?.tags ?? [];
  const category = inferCategoryFromPost(post);
  const categoryLabel = getCategoryThemeLabel(category);
  const token = `${post?.slug ?? ""}:${title}`;
  const revealDelay = hashNumber(`${token}:delay`, 0, 8) * 45;

  const characterCount = Math.max(
    120,
    Math.round(
      (title.replace(/\s+/g, "").length + description.replace(/\s+/g, "").length) * 5.4
    )
  );
  const readMinutes = Math.max(1, Math.round(characterCount / 260));
  const views = hashNumber(token, 18, 320);
  const comments = hashNumber(`${token}:comment`, 0, 9);
  const density = ["is-tall", "is-medium", "is-compact"][
    hashNumber(`${token}:density`, 0, 2)
  ];

  return (
    <article
      className={`nh-post-card nh-card ${density}`}
      style={{ "--nh-reveal-delay": `${revealDelay}ms` }}
    >
      <Link href={`/blog/${post.slug}`} className="nh-post-cover-link" aria-label={title}>
        <span className="nh-post-cover-wrap">
          {post.frontmatter.cover ? (
            <img
              src={post.frontmatter.cover}
              alt={title}
              className="nh-post-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="nh-post-cover nh-post-cover-fallback" aria-hidden="true" />
          )}
        </span>
      </Link>

      <div className="nh-post-body">
        <h2 className="nh-post-title">
          <Link href={`/blog/${post.slug}`}>{title}</Link>
        </h2>

        {description ? <p className="nh-post-excerpt">{description}</p> : null}

        <div className="nh-post-meta">
          <span className="nh-post-meta-item">{post.frontmatter.date}</span>
          <span className="nh-meta-sep">|</span>
          <span className="nh-post-meta-item">阅 {views}</span>
          <span className="nh-meta-sep">|</span>
          <span className="nh-post-meta-item">评 {comments}</span>
          <span className="nh-meta-sep">|</span>
          <Link href={`/blog?category=${encodeURIComponent(category)}`} className="nh-post-meta-link">
            {categoryLabel}
          </Link>
          <span className="nh-post-meta-item">{characterCount} 字</span>
          <span className="nh-meta-sep">|</span>
          <span className="nh-post-meta-item">{readMinutes} 分钟</span>
        </div>

        {tags.length ? (
          <div className="nh-post-tags">
            {tags.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="nh-chip">
                {tag}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
