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

## 2026-03-16

- 当前仓库的内容模型已经具备外部来源字段：`editor_source`、`source_ref`、`source_updated_at`
- `posts.editor_source` 的约束已包含 `import`，因此掘金导入 MVP 不必先增加新的来源枚举
- `content_sync_jobs.provider` 当前仅允许 `notion`，若直接复用同步任务表会带来额外 migration；MVP 更适合走手动导入接口
- 通过服务端请求公开掘金文章页，确认可直接拿到 SSR HTML，且页面中存在 `window.__NUXT__`、`article_info`、`web_html_content`
- 这意味着掘金导入可以优先基于公开页面解析，不必在 MVP 中依赖账号态、Cookie 或双向同步
- 导入后的正文仍需做 HTML -> Markdown 转换，因为当前写作入口是 ByteMD 编辑器
- 重复导入若直接覆盖现有文章，可能误伤已发布内容；MVP 应先做 `source_ref` 去重并返回现有稿件
- 公开掘金作者页同样可返回 SSR HTML，并且能看到作者文章列表、`article_id`、`post_article_count` 与 `?cursor=<n>` 形式的公开分页链接
- 这使“按作者主页批量扫描全部公开文章，再逐篇导入”成为可行的 MVP 主流程
- 对“导入自己的文章”这个场景，公开作者页已经足够，不需要把掘金登录态直接接入博客后台
- `turndown-plugin-gfm` 在 Next/Turbopack 环境里需要用命名空间导入（`import * as ...`），默认导入会导致构建报错
- 批量扫描验证通过：示例作者 `312692511089736` 在 `maxPages=2,maxArticles=15` 下成功扫描到 15 篇文章
- 单篇提取验证通过：示例文章 `7250317954993897528` 可正确提取标题、描述、日期、封面和 Markdown 正文片段
- 构建已确认新增代码可通过编译阶段；`pnpm build` 仍旧停在仓库既有的 `/admin/comments` `useSearchParams()` 缺少 `Suspense` 问题
- 为避免在未确认前写入真实内容，本次没有对生产/开发数据库执行真实导入落库测试
- 真实单篇导入测试已成功：文章 `7548595210558767138` 被导入为草稿并完成发布展示
- 真实小批量测试已成功：作者 `2936108653217451` 在 `maxPages=1,maxArticles=3` 下成功完成批量扫描与导入
- 过程中发现一个关键问题：导入文章在编辑器中发布时会丢失 `editorSource/sourceRef/sourceUpdatedAt`，导致后续批量导入无法正确去重
- 已通过在 `WritePageV2` 持久化来源元数据修复该问题，并验证再次导入时会正确 `skipped`
- 为避免保留测试垃圾数据，已删除误生成的重复草稿 `打造属于你的前端沙盒-2`
- 全量公开文章导入验证完成：作者 `2936108653217451` 共扫描到 96 篇公开文章，当前已全部可导入且无失败项
- 首次全量导入中剩余的失败项并非正文转换问题，而是个别文章会返回字节系 WAF 的 `Please wait...` JS challenge 页面
- 该 challenge 页面中包含 `wci/cs` 参数，可通过本地求解 SHA-256 nonce 生成 `_wafchallengeid` Cookie 后立即重取正文页
- 在 `fetchJuejinHtml` 中加入该处理后，最后一篇原失败文章 `7536319934545412139` 也已成功导入
