## Context

当前内容模型将文章主状态直接保存在 `posts` 表中。公开站点只读取 `posts(status='published')`，因此一旦把已发布文章写回为 `draft`，文章就会立即从站点下线。

前一轮修复已经阻止了已发布文章被自动降为 `draft`，但这只是避免线上事故，并没有解决“已发布文章的未发布修改如何持久化”的问题。

## Goals / Non-Goals

- Goals:
  - 已发布文章的未发布修改可以进入草稿箱
  - 线上发布稿在重新发布前保持不变
  - 草稿箱和编辑页都能恢复这份未发布修改
  - 直接关闭页面时，尽量保存最后一次脏修改
- Non-Goals:
  - 不实现多人协作或冲突合并
  - 不改造公开阅读链路，公开站点仍只读取 `posts(status='published')`
  - 不替换现有普通草稿模型

## Decisions

- Decision: 为已发布文章新增独立的 `post_working_drafts` 存储
  - Why: `posts` 只能表示当前正式状态，`post_revisions` 缺少 `slug` / `date` 等编辑态字段，不适合作为工作草稿主存储
  - Shape:
    - `post_id BIGINT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE`
    - `slug TEXT NOT NULL`
    - `title TEXT NOT NULL`
    - `date DATE NOT NULL`
    - `description TEXT`
    - `cover TEXT`
    - `tags TEXT[] NOT NULL DEFAULT '{}'::text[]`
    - `content TEXT NOT NULL`
    - `content_format TEXT NOT NULL`
    - `content_json JSONB`
    - `render_body TEXT`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

- Decision: 编辑页以“发布稿 + 工作草稿覆盖”的方式加载已发布文章
  - When working draft exists: 返回工作草稿内容，并携带 `baseStatus='published'` 与 `hasWorkingDraft=true`
  - When working draft missing: 返回发布稿内容，并携带 `baseStatus='published'`

- Decision: 已发布文章的自动保存改为写入工作草稿
  - `/api/write/posts` 继续只处理普通草稿
  - 新增专用接口处理 published post working draft upsert

- Decision: 页面关闭时执行 best-effort flush
  - Use `pagehide` / `visibilitychange` / route-leave path with `fetch(..., { keepalive: true })`
  - Why: 只靠 5 秒 debounce 不能满足“修改后直接关闭也能进草稿箱”

- Decision: 发布时以工作草稿内容覆盖原发布稿，并在成功后删除工作草稿
  - 保持当前公开读取链路不变
  - 发布成功后继续写入 `post_revisions`
  - 若草稿修改了 `slug`，在发布时执行原有 slug rename / conflict 校验逻辑

- Decision: 草稿箱需要展示工作草稿
  - 后台草稿列表对普通 `posts(status='draft')` 与 `post_working_drafts` 做统一视图输出
  - 工作草稿在 UI 上标注来源，例如“已发布文章修改稿”

## Risks / Trade-offs

- Risk: 页面关闭时的 keepalive 保存不是 100% 保证
  - Mitigation: 保留 5 秒自动保存作为主路径，关闭保存只作为补充

- Risk: 工作草稿与正式发布稿可能长期偏离
  - Mitigation: 在编辑器和草稿箱里明确标注“线上未更新”

- Risk: 工作草稿允许修改 slug，后台继续编辑入口若仍用原发布 slug 需要正确回查
  - Mitigation: 以 `post_id` 绑定工作草稿；查询 `/write?slug=<published-slug>` 时优先按发布稿定位，再覆盖草稿字段

## Migration Plan

1. 新增 `post_working_drafts` 表
2. 更新后台与写作 API，支持工作草稿读写
3. 调整编辑器自动保存与关闭前 flush
4. 调整草稿箱列表与继续编辑入口
5. 手动验证“编辑-关闭-草稿箱-重新发布”链路

## Open Questions

- 是否需要为工作草稿提供显式“放弃修改”操作，而不是只在发布后自动清理
- 草稿箱里是否需要展示“对应线上文章 slug”与“草稿待发布 slug”两个字段
