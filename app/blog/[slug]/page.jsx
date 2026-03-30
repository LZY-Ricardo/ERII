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

const SITE_URL = "https://blog.sunandyu.top";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostData(slug);

  if (!post) {
    return {
      title: "文章不存在",
      robots: { index: false },
    };
  }

  const url = `${SITE_URL}/blog/${slug}`;
  const description =
    post.frontmatter.description ||
    "象龟的水坑 - Ricardo 的个人博客，分享前端开发、AI 应用与开发实践。";

  return {
    title: post.frontmatter.title,
    description,
    keywords: Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags : [],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.frontmatter.title,
      description,
      publishedTime: post.frontmatter.date,
      authors: ["Ricardo"],
      tags: Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags : [],
    },
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

  const articleUrl = `${SITE_URL}/blog/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.frontmatter.title,
    description: post.frontmatter.description || "",
    url: articleUrl,
    datePublished: post.frontmatter.date,
    dateModified: post.frontmatter.updatedAt || post.frontmatter.date,
    author: {
      "@type": "Person",
      name: "Ricardo",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: "Ricardo",
      url: SITE_URL,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    keywords: Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags.join(", ") : "",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArgonShell
        posts={posts}
        tocItems={tocItems}
        articleSidebar={{ recentComments }}
      >
      <article className="nh-article nh-card">
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
    </>
  );
}
