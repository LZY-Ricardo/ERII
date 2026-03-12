import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import ArgonCommentShell from "@/src/components/argon/ArgonCommentShell";
import ArgonSharePanel from "@/src/components/argon/ArgonSharePanel";
import ArgonShell from "@/src/components/argon/ArgonShell";
import PostEditLink from "@/src/components/PostEditLink";
import { getPostData, getSortedPostsData } from "@/src/lib/posts";

function extractTocItems(content) {
  return String(content ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^#{1,3}\s+/.test(line))
    .map((line) => line.replace(/^#{1,3}\s+/, "").trim())
    .filter(Boolean)
    .slice(0, 12);
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPostData(slug);
  if (!post) notFound();

  const posts = await getSortedPostsData();
  const articleBody = post.renderBody || post.content || "";
  const tocItems = extractTocItems(articleBody);

  return (
    <ArgonShell posts={posts} tocItems={tocItems}>
      <article className="nh-article nh-card">
        {post.frontmatter.cover ? (
          <div className="nh-article-cover">
            <img src={post.frontmatter.cover} alt={post.frontmatter.title} />
          </div>
        ) : null}
        <header className="nh-article-head">
          <h1>{post.frontmatter.title}</h1>
          <div className="nh-article-meta">
            <p>{post.frontmatter.date}</p>
            <PostEditLink slug={post.slug} />
          </div>
          {post.frontmatter.description ? (
            <p className="nh-article-desc">{post.frontmatter.description}</p>
          ) : null}
        </header>

        <div className="nh-divider" />

        <div className="nh-article-content prose max-w-none prose-slate prose-headings:font-serif prose-strong:text-slate-800">
          <MDXRemote source={articleBody} />
        </div>

        {Array.isArray(post.frontmatter.tags) && post.frontmatter.tags.length ? (
          <footer className="nh-article-tags">
            {post.frontmatter.tags.map((tag) => (
              <span key={tag} className="nh-chip">
                {tag}
              </span>
            ))}
          </footer>
        ) : null}
      </article>

      <ArgonCommentShell postSlug={post.slug} />
      <ArgonSharePanel post={post} />
    </ArgonShell>
  );
}
