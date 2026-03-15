# Findings

## 2026-03-15

- `posts` 表当前只承载单份文章状态，`published` 与 `draft` 互斥；公开站点只读取 `posts(status='published')`
- `WritePageV2` 当前草稿自动保存调用 `/api/write/posts`，这会把目标文章直接写成 `draft`
- 对已发布文章已做过一次修复：禁止自动保存把 `published` 静默降级为 `draft`
- 用户现在要的新行为不是“恢复旧逻辑”，而是新增“已发布文章的编辑草稿”能力
- `post_revisions` 虽可存历史内容，但缺少 `slug` / `date` 等字段，不适合直接充当可恢复的编辑草稿主存储
- 更合理的方向是新增独立的编辑草稿存储，并让 `/write?slug=<published-slug>` 优先加载该草稿
- `pnpm build` 已跑到页面预渲染阶段，失败原因是仓库内既有的 `/admin/comments` 缺少 `Suspense` 包裹 `useSearchParams()`，与本次改动无直接关系
- Neon MCP 当前不可用，错误为 OAuth `invalid_grant: Invalid refresh token`；`codex mcp login neon` 还会返回 `No authorization support detected`
- 已通过项目中的 Neon 连接串直连数据库执行 `db/migrations/20260315_post_working_drafts.sql`，并验证 `to_regclass('public.post_working_drafts') = post_working_drafts`
