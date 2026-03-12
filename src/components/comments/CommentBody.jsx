import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isSafeLink } from "@/src/components/comments/commentHelpers";

export default function CommentBody({ comment }) {
  if (comment.isMaskedPrivate) {
    return <p className="comment-private-mask">{comment.contentRaw}</p>;
  }

  if (!comment.useMarkdown) {
    return <p className="comment-plain-body">{comment.contentRaw}</p>;
  }

  return (
    <div className="comment-markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const safeHref = isSafeLink(href) ? href : "";
            if (!safeHref) return <span>{children}</span>;
            return (
              <a href={safeHref} target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {comment.contentRaw}
      </ReactMarkdown>
    </div>
  );
}
