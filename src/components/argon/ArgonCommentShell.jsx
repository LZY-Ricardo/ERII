"use client";

import dynamic from "next/dynamic";
import { forwardRef, useEffect, useRef, useState } from "react";

const CommentSection = dynamic(() => import("@/src/components/comments/CommentSection"), {
  ssr: false,
  loading: () => <CommentPlaceholder loading />,
});

function isCommentIntentHash(hash) {
  return (
    hash === "#comments" ||
    hash === "#post_comment" ||
    hash === "#comments_navigation" ||
    hash.startsWith("#comment-")
  );
}

export default function ArgonCommentShell({ postSlug }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const placeholderRef = useRef(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (isCommentIntentHash(hash)) {
      setShouldLoad(true);
      return undefined;
    }

    const placeholder = placeholderRef.current;
    if (!placeholder) return undefined;

    if (typeof window.IntersectionObserver !== "function") {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(placeholder);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      if (isCommentIntentHash(window.location.hash)) {
        setShouldLoad(true);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!shouldLoad) return undefined;

    const targetId = window.location.hash.slice(1);
    if (!targetId) return undefined;

    let attempts = 0;
    const timer = window.setInterval(() => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.clearInterval(timer);
        return;
      }

      attempts += 1;
      if (attempts >= 12) {
        window.clearInterval(timer);
      }
    }, 180);

    return () => window.clearInterval(timer);
  }, [shouldLoad]);

  if (shouldLoad) {
    return <CommentSection postSlug={postSlug} />;
  }

  return <CommentPlaceholder ref={placeholderRef} />;
}

const CommentPlaceholder = forwardRef(function CommentPlaceholder({ loading = false }, ref) {
  return (
    <section
      ref={ref}
      id="comments"
      className="comments-area card shadow-sm nh-card comments-loading"
      aria-label="评论列表"
      aria-busy={loading}
    >
      <div className="card-body">
        <p className="nh-comment-hint">{loading ? "评论加载中..." : "评论区"}</p>
      </div>
    </section>
  );
});
