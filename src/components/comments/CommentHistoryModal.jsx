import { formatTime } from "@/src/components/comments/commentHelpers";

export default function CommentHistoryModal({
  open,
  loading,
  error,
  comment,
  history,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="nh-modal-backdrop" role="dialog" aria-modal="true" aria-label="评论编辑历史">
      <div id="comment_edit_history" className="nh-modal">
        <div className="nh-modal-head">
          <h4 className="modal-title">评论 #{comment?.id ?? "-"} 的编辑记录</h4>
          <button type="button" className="close" aria-label="关闭" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="nh-modal-body">
          {loading ? <p>正在加载编辑历史...</p> : null}
          {!loading && error ? <p className="nh-form-error">{error}</p> : null}
          {!loading && !error && history.length === 0 ? <p>暂无编辑记录。</p> : null}
          {!loading && !error && history.length > 0 ? (
            <div className="comment-edit-history-list">
              {history.map((item) => (
                <article key={item.id} className="comment-edit-history-item">
                  <header>
                    <span>#{item.id}</span>
                    <time>{formatTime(item.editedAt)}</time>
                  </header>
                  <p>{item.contentRaw}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
