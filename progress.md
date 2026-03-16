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

## 2026-03-16

- 读取了 `planning-with-files` 说明，并补充本次提案的 planning 记录
- 运行了 `openspec list` / `openspec list --specs`，确认当前仓库存在未归档变更，但还没有正式 specs
- 复查了 `db/schema.sql`、`contentService.js`、Notion adapter / sync 链路，确认掘金导入可复用现有内容平台结构
- 服务端验证了公开掘金文章页可返回 SSR HTML，并且包含可供解析的 `article_info` / `web_html_content`
- 已创建变更目录：`openspec/changes/add-juejin-import/`
- 已写入 `proposal.md`、`design.md`、`tasks.md` 与 `specs/juejin-import/spec.md`
- 已补充验证公开作者页结构，确认存在可用于批量导入的文章列表与 `cursor` 分页线索
- 正在把提案范围从“单篇导入”调整为“作者主页批量导入为主，单篇导入为辅”
- 已新增依赖：`cheerio`、`turndown`、`turndown-plugin-gfm`
- 已实现 `src/lib/content/htmlToMarkdown.js`、`src/lib/content/adapters/juejinAdapter.js`、`src/lib/content/juejinImport.js`
- 已新增 API：`app/api/write/import/juejin/route.js`
- 已在 `WritePageV2` 加入“导入掘金”入口、批量/单篇模式切换和导入结果面板
- 已通过 `pnpm lint`（仅保留仓库既有的 3 条 `<img>` warning）
- 已验证作者页扫描与单篇正文提取脚本可运行
- 已通过 `pnpm build` 的编译阶段；构建最终仍失败于仓库既有的 `/admin/comments` Suspense 问题
- 已完成真实单篇导入测试：`7548595210558767138` 成功导入、发布并展示
- 已完成真实小批量测试：作者 `2936108653217451` 扫描 3 篇，初次导入成功
- 已定位并修复“发布后丢失 Juejin 来源元数据”问题
- 已清理重复测试草稿 `打造属于你的前端沙盒-2`
- 已重新跑同一批量测试，结果为 `scanned=3, imported=0, skipped=3, failed=0`
- 已对作者 `2936108653217451` 执行全量公开文章导入，首次全量结果为 `scanned=96, imported=85, skipped=3, failed=8`
- 已针对剩余失败文章补跑导入，并定位最后 1 篇失败原因是掘金返回 JS challenge 风控页而非文章正文
- 已在 `juejinAdapter` 中加入自动处理掘金 `_wafchallengeid` challenge 的逻辑
- 已成功补导最后 1 篇文章 `7536319934545412139`
- 已完成全量复核：作者 `2936108653217451` 当前结果为 `scanned=96, imported=0, skipped=96, failed=0`
