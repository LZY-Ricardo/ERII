import Link from "next/link";

export default function PostCard({ post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative block bg-white p-3 pb-8 shadow-md transition-all duration-300 hover:-translate-y-1 hover:rotate-1 hover:shadow-xl border border-slate-100 before:absolute before:left-6 before:-top-2 before:h-6 before:w-16 before:rotate-[-6deg] before:rounded-sm before:bg-erii-duck/45 before:content-[''] after:absolute after:right-6 after:-top-2 after:h-6 after:w-16 after:rotate-[7deg] after:rounded-sm after:bg-erii-duck/35 after:content-['']"
    >
      <div className="relative mb-4 aspect-video w-full overflow-hidden bg-slate-100">
        {post.frontmatter.cover ? (
          <img
            src={post.frontmatter.cover}
            alt={post.frontmatter.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-erii-duck/20 transition-colors group-hover:bg-erii-duck/30" />
        )}
      </div>

      <h2 className="px-2 text-center font-hand text-2xl text-erii-ink group-hover:text-erii-red">
        {post.frontmatter.title}
      </h2>

      <div className="mt-2 text-center text-xs font-hand text-slate-400">
        {post.frontmatter.date}
      </div>
    </Link>
  );
}
