"use client";

function formatRecentCommentTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;

  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

export default function RightbarRecentComments({ recentComments = [] }) {
  const jumpToComment = (commentId) => (event) => {
    if (!commentId || typeof window === "undefined") return;

    const targetId = `comment-${commentId}`;
    event.preventDefault();
    window.history.pushState(null, "", `#${targetId}`);

    const scrollToComment = (attempt = 0) => {
      const commentTarget = document.getElementById(targetId);
      if (commentTarget) {
        commentTarget.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (attempt === 0) {
        const commentsSection = document.getElementById("comments");
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      if (attempt < 10) {
        window.setTimeout(() => scrollToComment(attempt + 1), 180);
      }
    };

    scrollToComment();
  };

  const jumpToElement = (targetId, hash = targetId) => (event) => {
    if (!targetId || typeof window === "undefined") return;

    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    window.history.pushState(null, "", `#${hash}`);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!recentComments.length) {
    return (
      <div className="nh-recent-comments-empty">
        <p className="nh-muted">还没有评论，来抢个沙发吧。</p>
        <a href="#post_comment" className="nh-recent-comments-action" onClick={jumpToElement("post_comment")}>
          去评论
        </a>
      </div>
    );
  }

  return (
    <div className="nh-recent-comments-block">
      <ul className="nh-recent-comments-list">
        {recentComments.map((comment) => (
          <li key={comment.id} className="nh-recent-comments-item">
            <a
              href={`#comment-${comment.id}`}
              className="nh-recent-comment-link"
              onClick={jumpToComment(comment.id)}
            >
              <div className="nh-recent-comment-head">
                <div className="nh-recent-comment-meta">
                  <span className="nh-recent-comment-author">{comment.authorName}</span>
                  {comment.isPrivate ? <span className="nh-recent-comment-badge">私密</span> : null}
                </div>
                <time className="nh-recent-comment-time">{formatRecentCommentTime(comment.createdAt)}</time>
              </div>
              <p className="nh-recent-comment-preview" style={{ WebkitLineClamp: 2 }}>
                {comment.contentPreview}
              </p>
            </a>
          </li>
        ))}
      </ul>

      <a href="#comments" className="nh-recent-comments-action" onClick={jumpToElement("comments")}>
        去评论区
      </a>
    </div>
  );
}
