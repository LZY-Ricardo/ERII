# Progress

## 2026-03-15

- 读取了 `openspec/AGENTS.md`、`openspec/project.md`
- 检查了活动变更：`add-admin-dashboard`、`edit-published-posts`
- 检查了当前写作页、发布接口和内容服务
- 确认现状：已发布文章当前不会被自动下线，但未发布修改也不会入草稿箱
- 正在准备新的 OpenSpec 提案，定义“已发布文章的独立编辑草稿”行为
- 已创建变更：`openspec/changes/add-published-post-working-drafts/`
- 已完成 `openspec validate add-published-post-working-drafts --strict`
- 已新增 `post_working_drafts` schema、迁移文件、工作草稿服务层与保存接口
- 已接通编辑页自动保存、关闭前 flush、发布后清理工作草稿
- 已更新后台草稿箱列表，支持显示“已发布文章修改稿”
- 已完成相关文件 ESLint 校验
- 已尝试 `pnpm build`，构建在既有 `/admin/comments` prerender 问题处失败，非本次改动引入
- 已通过 Neon 直连执行 `20260315_post_working_drafts.sql`，数据库表创建成功
- 已确认 Neon MCP 目前仍是本机 OAuth 凭证异常，未在本次任务中修复
