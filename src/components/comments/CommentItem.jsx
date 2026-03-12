import { useMemo } from "react";
import { Clock3, Pencil, ThumbsUp } from "lucide-react";
import CommentBody from "@/src/components/comments/CommentBody";
import {
  avatarColor,
  formatTime,
  isSafeLink,
  safeText,
} from "@/src/components/comments/commentHelpers";

export default function CommentItem({
  comment,
  onReply,
  onEdit,
  onVote,
  onOpenHistory,
}) {
  const firstLetter = safeText(comment.authorName).trim().charAt(0) || "匿";
  const avatarStyle = useMemo(
    () => ({ backgroundColor: avatarColor(comment.authorName) }),
    [comment.authorName]
  );

  return (
    <li>
      <div id={`comment-${comment.id}`} className="comment-item">
        <div className="comment-item-left-wrapper">
          <div className="comment-item-avatar">
            <span className="avatar text-avatar" style={avatarStyle}>
              {firstLetter}
            </span>
          </div>
          <button
            type="button"
            className="comment-upvote"
            onClick={() => onVote(comment.id)}
            title="点赞"
          >
            <span className="btn-inner--icon">
              <ThumbsUp size={12} />
            </span>
            <span className="btn-inner--text">{comment.voteCount}</span>
          </button>
        </div>

        <div className="comment-item-inner">
          <div className="comment-item-title">
            {isSafeLink(comment.authorLink) ? (
              <a className="comment-name" href={comment.authorLink} target="_blank" rel="noreferrer">
                {comment.authorName}
              </a>
            ) : (
              <span className="comment-name">{comment.authorName}</span>
            )}

            {comment.isPrivate ? (
              <span className="badge-private-comment">私密评论</span>
            ) : null}
          </div>

          <div className="comment-item-text">
            <CommentBody comment={comment} />
          </div>

          <div className="comment-info">
            <div className="comment-time">
              <Clock3 size={12} />
              <span>{formatTime(comment.createdAt)}</span>
            </div>
            {comment.editedAt ? (
              <div
                className={`comment-edited ${comment.canViewHistory ? "comment-edithistory-accessible" : ""}`}
                role={comment.canViewHistory ? "button" : undefined}
                tabIndex={comment.canViewHistory ? 0 : undefined}
                onClick={comment.canViewHistory ? () => onOpenHistory(comment) : undefined}
                onKeyDown={
                  comment.canViewHistory
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenHistory(comment);
                        }
                      }
                    : undefined
                }
              >
                <Pencil size={12} />
                <span>已编辑</span>
              </div>
            ) : null}
          </div>

          <div className="comment-operations">
            <button type="button" className="comment-reply" onClick={() => onReply(comment)}>
              回复
            </button>
            {comment.canEdit ? (
              <button type="button" className="comment-edit" onClick={() => onEdit(comment)}>
                编辑
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="comment-divider" />

      {comment.children?.length ? (
        <ul className="children">
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              onReply={onReply}
              onEdit={onEdit}
              onVote={onVote}
              onOpenHistory={onOpenHistory}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
