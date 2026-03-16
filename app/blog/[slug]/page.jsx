import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import ArgonCommentShell from "@/src/components/argon/ArgonCommentShell";
import ArgonSharePanel from "@/src/components/argon/ArgonSharePanel";
import ArgonShell from "@/src/components/argon/ArgonShell";
import PostEditLink from "@/src/components/PostEditLink";
import TeamSpeakJoinButton from "@/src/components/TeamSpeakJoinButton";
import { extractArticleHeadings } from "@/src/lib/articleToc";
import { listRecentCommentSummariesByPostSlug } from "@/src/lib/comments";
import { getPostData, getSortedPostsData } from "@/src/lib/posts";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostData(slug);

  if (!post) {
    return {
      title: "文章不存在 | 象龟的水坑",
    };
  }

  return {
    title: `${post.frontmatter.title} | 象龟的水坑`,
    description: post.frontmatter.description || "分享前端开发与 AI 实践的个人博客。",
  };
}

function createHeadingComponent(level, allHeadings, headingIndexRef) {
  const Tag = `h${level}`;

  return function HeadingWithAnchor({ children, ...props }) {
    const currentHeading = allHeadings[headingIndexRef.current];
    const headingId = currentHeading?.level === level ? currentHeading.id : String(props.id ?? "").trim();

    if (currentHeading?.level === level) {
      headingIndexRef.current += 1;
    }

    return (
      <Tag {...props} id={headingId || undefined}>
        {children}
      </Tag>
    );
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPostData(slug);
  if (!post) notFound();

  const posts = await getSortedPostsData();
  const articleBody = post.renderBody || post.content || "";
  const { allHeadings, tocItems } = extractArticleHeadings(articleBody);
  const recentComments = await listRecentCommentSummariesByPostSlug({
    slug: post.slug,
    limit: 3,
  });
  const headingIndexRef = { current: 0 };
  const mdxComponents = {
    h1: createHeadingComponent(1, allHeadings, headingIndexRef),
    h2: createHeadingComponent(2, allHeadings, headingIndexRef),
    h3: createHeadingComponent(3, allHeadings, headingIndexRef),
    TeamSpeakJoinButton,
  };

  return (
    <ArgonShell
      posts={posts}
      tocItems={tocItems}
      articleSidebar={{ recentComments }}
    >
      <article className="nh-article nh-card">
        {post.frontmatter.cover ? (
          <div className="nh-article-cover">
            <Image
              src={post.frontmatter.cover}
              alt={post.frontmatter.title}
              width={1200}
              height={675}
              sizes="(max-width: 768px) 100vw, 940px"
              priority
              unoptimized
              className="w-full h-auto"
            />
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
          <MDXRemote source={articleBody} components={mdxComponents} />
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
