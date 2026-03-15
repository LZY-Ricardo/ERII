"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Clock3,
  KeyRound,
  Link as LinkIcon,
  Mail,
  MessageCircle,
  Pencil,
  Send,
  Smile,
  UserCircle2,
  X,
} from "lucide-react";
import CommentItem from "@/src/components/comments/CommentItem";
import CommentHistoryModal from "@/src/components/comments/CommentHistoryModal";
import { COMMENT_EMOTION_GROUPS } from "@/src/components/comments/commentEmotions";
import {
  cloneAndUpdateVote,
  PAGE_SIZE,
  safeText,
  toPreview,
} from "@/src/components/comments/commentHelpers";
import { useToast } from "@/src/components/Toast";

function getStoredProfile() {
  try {
    const raw = localStorage.getItem("erii-comment-profile");
    if (!raw) return null;
    const profile = JSON.parse(raw);
    if (!profile || typeof profile !== "object") return null;
    return {
      name: safeText(profile.name).slice(0, 48),
      email: safeText(profile.email).slice(0, 120),
      link: safeText(profile.link).slice(0, 255),
    };
  } catch {
    return null;
  }
}

export default function CommentSection({ postSlug }) {
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalTopLevel, setTotalTopLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [captchaSeed, setCaptchaSeed] = useState("");
  const [captchaEquation, setCaptchaEquation] = useState("12 + 3 =");

  const [draft, setDraft] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorLink, setAuthorLink] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [useMarkdown, setUseMarkdown] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);
  const [showExtraInput, setShowExtraInput] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [emotionOpen, setEmotionOpen] = useState(false);
  const [emotionTab, setEmotionTab] = useState(0);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyComment, setHistoryComment] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);

  const textareaRef = useRef(null);
  const emotionBtnRef = useRef(null);
  const emotionKeyboardRef = useRef(null);

  const loadComments = useCallback(
    async (nextPage, append = false) => {
      const targetPage = Math.max(1, Number(nextPage) || 1);
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const response = await fetch(
          `/api/comments?slug=${encodeURIComponent(postSlug)}&page=${targetPage}&pageSize=${PAGE_SIZE}`,
          { cache: "no-store" }
        );
        const data = await response.json();
        if (!response.ok || !data?.ok) {
          throw new Error(safeText(data?.error) || "加载评论失败。");
        }

        const nextComments = Array.isArray(data.comments) ? data.comments : [];
        setComments((prev) => (append ? [...prev, ...nextComments] : nextComments));
        setPage(targetPage);
        setHasMore(Boolean(data?.pagination?.hasMore));
        setTotalTopLevel(Number(data?.pagination?.totalTopLevel ?? 0));
        setCaptchaSeed(safeText(data?.captcha?.seed));
        setCaptchaEquation(safeText(data?.captcha?.equation) || "12 + 3 =");
      } catch (fetchError) {
        toast.error(fetchError instanceof Error ? fetchError.message : "加载评论失败。");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [postSlug, toast]
  );

  useEffect(() => {
    loadComments(1);
    const stored = getStoredProfile();
    if (stored) {
      setAuthorName(stored.name);
      setAuthorEmail(stored.email);
      setAuthorLink(stored.link);
    }
  }, [loadComments]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(80, el.scrollHeight)}px`;
  }, [draft]);

  useEffect(() => {
    if (!emotionOpen) return undefined;
    const onDocumentClick = (event) => {
      const target = event.target;
      if (!target) return;
      if (emotionBtnRef.current?.contains(target)) return;
      if (emotionKeyboardRef.current?.contains(target)) return;
      setEmotionOpen(false);
    };
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [emotionOpen]);

  const resetEditorState = () => {
    setDraft("");
    setReplyTo(null);
    setEditingComment(null);
    setCaptchaAnswer("");
    setPrivateMode(false);
  };

  const onReply = (comment) => {
    setEditingComment(null);
    setReplyTo({
      id: comment.id,
      name: comment.authorName,
      preview: toPreview(comment.contentRaw),
    });
    setDraft("");
  };

  const onEdit = (comment) => {
    setReplyTo(null);
    setEditingComment(comment);
    setDraft(comment.contentRaw || "");
    setUseMarkdown(Boolean(comment.useMarkdown));
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setDraft("");
  };

  const openHistory = async (comment) => {
    setHistoryOpen(true);
    setHistoryComment(comment);
    setHistoryItems([]);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const response = await fetch(`/api/comments/${comment.id}/history`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(safeText(data?.error) || "加载编辑历史失败。");
      }
      setHistoryItems(Array.isArray(data.history) ? data.history : []);
    } catch (fetchError) {
      setHistoryError(fetchError instanceof Error ? fetchError.message : "加载编辑历史失败。");
    } finally {
      setHistoryLoading(false);
    }
  };

  const onVote = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(safeText(data?.error) || "点赞失败。");
      }
      setComments((prev) => cloneAndUpdateVote(prev, commentId, Number(data.voteCount ?? 0)));
    } catch (voteError) {
      toast.error(voteError instanceof Error ? voteError.message : "点赞失败。");
    }
  };

  const submitComment = async () => {
    const payload = {
      slug: postSlug,
      content: draft,
      useMarkdown,
      authorName,
      authorEmail,
      authorLink,
      captcha: captchaAnswer,
      captchaSeed,
      isPrivate: privateMode,
      parentId: replyTo?.id ?? null,
    };

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    console.log("API Response:", { ok: response.ok, status: response.status, data });

    if (!response.ok || !data?.ok) {
      const errorMessage = safeText(data?.error) || "评论发送失败。";
      console.log("Throwing error:", errorMessage);
      throw new Error(errorMessage);
    }

    localStorage.setItem(
      "erii-comment-profile",
      JSON.stringify({
        name: authorName,
        email: authorEmail,
        link: authorLink,
      })
    );

    setCaptchaSeed(safeText(data?.captcha?.seed));
    setCaptchaEquation(safeText(data?.captcha?.equation) || "12 + 3 =");
    resetEditorState();
    toast.success("评论发送成功！");
    await loadComments(1);
  };

  const submitEdit = async () => {
    const response = await fetch(`/api/comments/${editingComment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: draft,
        useMarkdown,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data?.ok) {
      throw new Error(safeText(data?.error) || "评论编辑失败。");
    }
    resetEditorState();
    toast.success("评论编辑成功！");
    await loadComments(1);
  };

  const onSubmit = async () => {
    if (formSubmitting) return;
    setFormSubmitting(true);

    try {
      if (editingComment) await submitEdit();
      else await submitComment();
    } catch (submitError) {
      console.log("Caught error in onSubmit:", submitError);
      const errorMessage = submitError instanceof Error ? submitError.message : "提交失败。";
      console.log("Showing toast error:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setFormSubmitting(false);
    }
  };

  const postCommentClass = [
    "card",
    "shadow-sm",
    "nh-card",
    editingComment ? "editing" : "",
    showExtraInput ? "show-extra-input" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <section id="comments" className="comments-area card shadow-sm nh-card" aria-label="评论列表">
        <div className="card-body">
          {loading ? <p className="nh-comment-hint">评论加载中...</p> : null}

          {!loading && comments.length > 0 ? (
            <>
              <h2 className="comments-title">
                <MessageCircle size={18} />
                <span>{`评论 (${totalTopLevel})`}</span>
              </h2>
              <ol className="comment-list">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={onReply}
                    onEdit={onEdit}
                    onVote={onVote}
                    onOpenHistory={openHistory}
                  />
                ))}
              </ol>
              {hasMore ? (
                <div id="comments_navigation" className="comments-navigation-more">
                  <button
                    id="comments_more"
                    className="btn btn-lg btn-primary rounded-circle"
                    type="button"
                    onClick={() => loadComments(page + 1, true)}
                    disabled={loadingMore}
                  >
                    <span className="btn-inner--icon">
                      <ChevronDown size={20} />
                    </span>
                    <span className="btn-inner--text">{loadingMore ? "加载中..." : "加载更多"}</span>
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {!loading && comments.length === 0 ? <span>暂无评论</span> : null}
        </div>
      </section>

      <section id="post_comment" className={postCommentClass} aria-label="发送评论">
        <div className="card-body">
          <h2 className="post-comment-title">
            <MessageCircle size={18} />
            <span className={editingComment ? "hide-on-comment-editing" : ""}>发送评论</span>
            <span className={editingComment ? "" : "hide-on-comment-not-editing"}>编辑评论</span>
          </h2>

          <div
            id="post_comment_reply_info"
            className="post-comment-reply"
            style={{ display: replyTo ? "block" : "none" }}
          >
            <span>
              正在回复 <b><span id="post_comment_reply_name">{replyTo?.name ?? ""}</span></b> 的评论 :
            </span>
            <div id="post_comment_reply_preview" className="post-comment-reply-preview">
              {replyTo?.preview ?? ""}
            </div>
            <button id="post_comment_reply_cancel" className="btn btn-outline-primary btn-sm" type="button" onClick={() => setReplyTo(null)}>
              取消回复
            </button>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <CommentForm
              textareaRef={textareaRef}
              draft={draft}
              setDraft={setDraft}
              authorName={authorName}
              setAuthorName={setAuthorName}
              authorEmail={authorEmail}
              setAuthorEmail={setAuthorEmail}
              authorLink={authorLink}
              setAuthorLink={setAuthorLink}
              captchaAnswer={captchaAnswer}
              setCaptchaAnswer={setCaptchaAnswer}
              captchaEquation={captchaEquation}
              useMarkdown={useMarkdown}
              setUseMarkdown={setUseMarkdown}
              privateMode={privateMode}
              setPrivateMode={setPrivateMode}
              showExtraInput={showExtraInput}
              setShowExtraInput={setShowExtraInput}
              editingComment={editingComment}
              formSubmitting={formSubmitting}
              emotionOpen={emotionOpen}
              setEmotionOpen={setEmotionOpen}
              emotionTab={emotionTab}
              setEmotionTab={setEmotionTab}
              emotionBtnRef={emotionBtnRef}
              emotionKeyboardRef={emotionKeyboardRef}
              onCancelEdit={cancelEdit}
              onInsertEmotion={(value) => setDraft((prev) => `${prev}${value}`)}
            />
          </form>
        </div>
      </section>

      <CommentHistoryModal
        open={historyOpen}
        loading={historyLoading}
        error={historyError}
        comment={historyComment}
        history={historyItems}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}

function CommentForm({
  textareaRef,
  draft,
  setDraft,
  authorName,
  setAuthorName,
  authorEmail,
  setAuthorEmail,
  authorLink,
  setAuthorLink,
  captchaAnswer,
  setCaptchaAnswer,
  captchaEquation,
  useMarkdown,
  setUseMarkdown,
  privateMode,
  setPrivateMode,
  showExtraInput,
  setShowExtraInput,
  editingComment,
  formSubmitting,
  emotionOpen,
  setEmotionOpen,
  emotionTab,
  setEmotionTab,
  emotionBtnRef,
  emotionKeyboardRef,
  onCancelEdit,
  onInsertEmotion,
}) {
  return (
    <>
      <div className="row">
        <div className="col-md-12">
          <textarea
            ref={textareaRef}
            id="post_comment_content"
            className="form-control form-control-alternative"
            placeholder="评论内容"
            name="comment"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={formSubmitting}
            rows={4}
          />
        </div>
      </div>
      <div className={`row hide-on-comment-editing ${editingComment ? "d-none" : ""}`}>
        <FieldGroup id="post_comment_name" icon={<UserCircle2 size={16} />} placeholder="昵称" value={authorName} onChange={setAuthorName} disabled={formSubmitting} />
        <FieldGroup id="post_comment_email" icon={<Mail size={16} />} placeholder="邮箱" type="email" value={authorEmail} onChange={setAuthorEmail} disabled={formSubmitting} colClass="col-md-5" />
        <CaptchaField captchaEquation={captchaEquation} value={captchaAnswer} onChange={setCaptchaAnswer} disabled={formSubmitting} />
      </div>
      <div className={`row hide-on-comment-editing ${editingComment ? "d-none" : ""}`} id="post_comment_extra_input" style={{ display: showExtraInput ? "flex" : "none" }}>
        <div className="col-md-12">
          <div className="form-group">
            <div className="input-group input-group-alternative mb-4 post-comment-link-container">
              <div className="input-group-prepend">
                <span className="input-group-text">
                  <LinkIcon size={16} />
                </span>
              </div>
              <input id="post_comment_link" className="form-control" placeholder="网站" type="text" value={authorLink} onChange={(event) => setAuthorLink(event.target.value)} disabled={formSubmitting} />
            </div>
          </div>
        </div>
      </div>
      <div className={`row hide-on-comment-editing ${editingComment ? "d-none" : ""}`} style={{ marginTop: 10 }}>
        <div className="col-md-12">
          <button id="post_comment_toggle_extra_input" type="button" className="btn btn-icon btn-outline-primary btn-sm" onClick={() => setShowExtraInput((prev) => !prev)}>
            <span className="btn-inner--icon">
              <ChevronDown size={15} />
            </span>
          </button>
        </div>
      </div>
      <div className="row" style={{ marginTop: 5, marginBottom: 10 }}>
        <div className="col-md-12">
          <Checkbox id="comment_post_use_markdown" label="Markdown" checked={useMarkdown} onChange={setUseMarkdown} disabled={formSubmitting} className="comment-post-use-markdown" />
          <Checkbox id="comment_post_privatemode" label="私密评论" checked={privateMode} onChange={setPrivateMode} disabled={formSubmitting} className="comment-post-privatemode" />

          <button id="post_comment_send" className="btn btn-icon btn-primary comment-btn pull-right mr-0" type="submit" disabled={formSubmitting}>
            <span className={`btn-inner--icon ${editingComment ? "hide-on-comment-editing" : ""}`}>{formSubmitting ? <Clock3 size={15} className="spin" /> : <Send size={15} />}</span>
            <span className={`btn-inner--icon ${editingComment ? "" : "hide-on-comment-not-editing"}`}>{formSubmitting ? <Clock3 size={15} className="spin" /> : <Pencil size={15} />}</span>
            <span className={`btn-inner--text ${editingComment ? "hide-on-comment-editing" : ""}`}>{formSubmitting ? "发送中" : "发送"}</span>
            <span className={`btn-inner--text ${editingComment ? "" : "hide-on-comment-not-editing"}`}>{formSubmitting ? "编辑中" : "编辑"}</span>
          </button>
          <button id="post_comment_edit_cancel" className={`btn btn-icon btn-danger comment-btn pull-right ${editingComment ? "" : "hide-on-comment-not-editing"}`} type="button" onClick={onCancelEdit} disabled={formSubmitting}>
            <span className="btn-inner--icon">
              <X size={15} />
            </span>
            <span className="btn-inner--text">取消</span>
          </button>

          <button ref={emotionBtnRef} id="comment_emotion_btn" className={`btn btn-icon pull-right ${emotionOpen ? "comment-emotion-keyboard-open" : ""}`} type="button" title="表情" onClick={() => setEmotionOpen((prev) => !prev)}>
            <Smile size={20} />
          </button>
          <div ref={emotionKeyboardRef} id="emotion_keyboard" className="emotion-keyboard card shadow-sm bg-white">
            <div className="emotion-keyboard-content">
              {COMMENT_EMOTION_GROUPS.map((group, groupIndex) => (
                <div key={group.key} className={`emotion-group ${emotionTab === groupIndex ? "" : "d-none"}`} index={groupIndex}>
                  {group.items.map((item) => (
                    <button key={`${group.key}:${item}`} type="button" className="emotion-item" onClick={() => onInsertEmotion(item)} title={item}>
                      {item}
                    </button>
                  ))}
                  {group.description ? <div className="emotion-group-description">{group.description}</div> : null}
                </div>
              ))}
            </div>
            <div className="emotion-keyboard-bar">
              {COMMENT_EMOTION_GROUPS.map((group, groupIndex) => (
                <button key={group.key} type="button" className={`emotion-group-name ${emotionTab === groupIndex ? "active" : ""}`} onClick={() => setEmotionTab(groupIndex)}>
                  {group.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FieldGroup({
  id,
  icon,
  placeholder,
  value,
  onChange,
  disabled,
  type = "text",
  colClass = "col-md-4",
}) {
  return (
    <div className={colClass}>
      <div className="form-group">
        <div className="input-group input-group-alternative mb-4">
          <div className="input-group-prepend">
            <span className="input-group-text">{icon}</span>
          </div>
          <input id={id} className="form-control" placeholder={placeholder} type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}

function CaptchaField({ captchaEquation, value, onChange, disabled }) {
  return (
    <div className="col-md-3">
      <div className="form-group">
        <div className="input-group input-group-alternative mb-4 post-comment-captcha-container" data-captcha={captchaEquation}>
          <span className="captcha-tooltip" aria-hidden="true">
            <span className="captcha-tooltip-content">
              <span className="captcha-tooltip-equation">{captchaEquation}</span>
            </span>
            <span className="captcha-tooltip-arrow" />
          </span>
          <div className="input-group-prepend">
            <span className="input-group-text">
              <KeyRound size={16} />
            </span>
          </div>
          <input
            id="post_comment_captcha"
            className="form-control"
            placeholder="验证码"
            type="text"
            inputMode="numeric"
            aria-label={`验证码，计算 ${captchaEquation} 并输入结果`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

function Checkbox({ id, label, checked, onChange, disabled, className }) {
  return (
    <div className={`custom-control custom-checkbox comment-post-checkbox ${className || ""}`}>
      <input className="custom-control-input" id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
      <label className="custom-control-label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}
