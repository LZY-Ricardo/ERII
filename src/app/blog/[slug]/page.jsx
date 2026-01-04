import { MDXRemote } from "next-mdx-remote/rsc";
import Header from "../../../components/Header";
import SecretTrigger from "../../../components/SecretTrigger";
import { getPostData } from "../../../lib/posts";

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostData(slug);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 pb-20">
        <Header />

        <article className="mt-10 rounded-3xl border border-erii-red/10 bg-white/80 p-8 shadow-sm">
          <header>
            <h1 className="font-hand text-4xl text-erii-ink">
              {post.frontmatter.title}
            </h1>
            <p className="mt-2 font-hand text-sm text-erii-red/70">
              {post.frontmatter.date}
            </p>
            {post.frontmatter.description ? (
              <p className="mt-3 text-base text-erii-ink/70">
                {post.frontmatter.description}
              </p>
            ) : null}
          </header>

          <div className="my-6 border-t border-dashed border-erii-red/30" />

          <div className="prose max-w-none prose-slate prose-headings:font-hand prose-headings:text-erii-ink prose-a:text-erii-red prose-strong:text-erii-ink">
            <MDXRemote source={post.content} />
          </div>
        </article>
      </div>

      <SecretTrigger />
    </div>
  );
}
