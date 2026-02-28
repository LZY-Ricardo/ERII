"use client";

import { useMemo, useState } from "react";

const FACE_ITEMS = [
  "|´・ω・)ノ",
  "ヾ(≧∇≦*)ゝ",
  "(☆ω☆)",
  "(๑•̀ㅁ•́ฅ)",
  "(ノ°ο°)ノ",
  "😂",
  "😀",
  "😭",
  "👍",
];

export default function ArgonCommentShell() {
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState("markdown");

  const tips = useMemo(
    () =>
      mode === "markdown"
        ? "Markdown 模式已开启（仅界面复刻，提交功能后续接入）"
        : "纯文本模式（仅界面复刻，提交功能后续接入）",
    [mode]
  );

  return (
    <section className="nh-comment-shell nh-card" aria-label="评论区">
      <h2>发送评论 编辑评论</h2>
      <p className="nh-comment-reply">
        正在回复 <strong>学院访客</strong> 的评论：<button type="button">取消回复</button>
      </p>

      <textarea
        className="nh-comment-input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="写下你的评论，或留下一句龙文..."
        rows={6}
      />

      <div className="nh-comment-editor-bar">
        <button
          type="button"
          className={mode === "markdown" ? "is-active" : ""}
          onClick={() => setMode("markdown")}
        >
          Markdown
        </button>
        <button
          type="button"
          className={mode === "plain" ? "is-active" : ""}
          onClick={() => setMode("plain")}
        >
          纯文本
        </button>
        <span>{tips}</span>
      </div>

      <div className="nh-comment-actions">
        <button type="button">发送</button>
        <button type="button">编辑</button>
        <button type="button" onClick={() => setDraft("")}>
          取消
        </button>
      </div>

      <div className="nh-face-grid" aria-label="表情面板">
        {FACE_ITEMS.map((item) => (
          <button key={item} type="button" onClick={() => setDraft((prev) => `${prev}${item}`)}>
            {item}
          </button>
        ))}
      </div>
    </section>
  );
}
