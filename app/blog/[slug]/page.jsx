import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import Header from "@/src/components/Header";
import PostEditLink from "@/src/components/PostEditLink";
import SecretTrigger from "@/src/components/SecretTrigger";
import { getPostData } from "@/src/lib/posts";

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPostData(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 pb-20">
        <Header />

        <article className="mt-10 rounded-3xl border border-wafu-sumi/10 bg-wafu-paper/80 p-8 shadow-sm backdrop-blur">
          <header>
            <h1 className="font-serif text-4xl text-wafu-sumi">
              {post.frontmatter.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="font-sans text-sm text-wafu-shu/70">
                {post.frontmatter.date}
              </p>
              <PostEditLink slug={post.slug} />
            </div>
            {post.frontmatter.description ? (
              <p className="mt-3 text-base text-wafu-sumi/70">
                {post.frontmatter.description}
              </p>
            ) : null}
          </header>

          <div className="my-6 border-t border-dashed border-wafu-sumi/15" />

          <div className="prose max-w-none prose-slate prose-headings:font-serif prose-headings:text-wafu-sumi prose-a:text-wafu-shu prose-strong:text-wafu-sumi">
            <MDXRemote source={post.content} />
          </div>
        </article>
      </div>

      <SecretTrigger />
    </div>
  );
}
