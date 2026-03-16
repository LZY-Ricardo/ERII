## Context

当前项目已经具备较完整的内容平台基础能力：

- 内容主存储为 `posts`
- 写作入口为 `/write`
- 外部来源字段已存在：`editor_source`、`source_ref`、`source_updated_at`
- 已有一条可复用的外部内容接入范式：Notion adapter + sync service

同时，掘金公开文章页在服务端可获取 SSR HTML。基于 2026-03-16 的验证，页面中可见 `window.__NUXT__`、`article_info` 和 `web_html_content` 等结构化内容片段；作者文章页也可看到公开文章列表、作者统计信息和分页 `cursor` 链接。因此 MVP 可以直接基于公开页面做单篇和批量导入，不依赖掘金登录态或双向同步。

## Goals / Non-Goals

- Goals:
  - 允许已登录用户从掘金作者主页 URL / 用户 ID 批量导入全部公开文章
  - 允许已登录用户从掘金公开文章 URL / ID 导入单篇内容
  - 将导入结果落为当前博客的可编辑草稿
  - 尽量保留标题、摘要、日期、封面、代码块、图片和标题层级
  - 对重复来源做去重，避免重复建稿
- Non-Goals:
  - 不实现掘金双向同步、定时拉取或 webhook
  - 不支持导入掘金私密、草稿或需要登录才能访问的文章
  - 不承诺 100% 还原所有掘金专有卡片、活动组件或嵌入块
  - 不在 MVP 中覆盖“已导入且已发布文章”的刷新更新流程
  - 不把掘金网页登录 Cookie 直接托管到博客后台

## Decisions

- Decision: MVP 使用手动触发的导入接口，而不是复用 `content_sync_jobs`
  - Why: 当前 `content_sync_jobs.provider` 只允许 `notion`，而掘金导入的首要诉求是一次性“迁移已有公开文章为草稿”，不需要先引入额外 migration 和任务日志系统
  - Endpoint:
    - `POST /api/write/import/juejin`
    - `mode='single'` 时，入参支持 `url` 或 `articleId`
    - `mode='profile'` 时，入参支持 `profileUrl` 或 `userId`
    - 所有导入默认落为 `draft`

- Decision: 批量导入以公开作者页为入口，逐篇抓取公开文章页
  - Why: 当前公开作者页已经暴露文章列表和分页 `cursor`，适合先扫描出文章 ID，再逐篇执行已有的单篇提取流程
  - Strategy:
    - 规范化作者主页 URL 或用户 ID
    - 拉取 `https://juejin.cn/user/<userId>/posts`
    - 从 SSR 数据或 DOM 中提取当前页文章列表
    - 继续跟进公开分页链接，例如 `?cursor=<n>`
    - 汇总得到全部公开文章 ID 后，再逐篇抓取正文并入库
  - Note: `cursor` 分页能力是基于 2026-03-16 对公开作者页现状的观察，不应在业务层四散耦合，需封装在 adapter 中

- Decision: 单篇内容提取优先解析公开文章页中的 SSR 数据
  - Why: 公开页面当前已经包含文章标题和 `article_info.web_html_content`，实现复杂度低于依赖未文档化接口
  - Strategy:
    - 先从 URL 规范化出 `articleId`
    - 拉取 `https://juejin.cn/post/<articleId>`
    - 优先解析 `window.__NUXT__` 中的 `article_info`
    - 缺失时回退到 DOM 选择器（如文章标题与正文容器）
  - Note: 这是基于 2026-03-16 对公开掘金文章页的现状验证得到的推断，后续若页面结构变化，应将适配逻辑收口在单独 adapter 中

- Decision: 导入正文统一转为 `markdown`
  - Why: 当前 `/write` 编辑器以 Markdown/MDX 编辑为主，掘金公开页已暴露 HTML 内容，MVP 最适合走“HTML -> Markdown”转换链路
  - Implementation:
    - 引入轻量 HTML 转 Markdown 依赖
    - 清理掘金注入的样式标签和壳层容器
    - 对代码块、图片、标题、列表、引用、表格做规则映射

- Decision: 来源标记沿用现有 `import`，并通过 `source_ref` 区分 provider
  - Why: `posts.editor_source` 当前已允许 `import`，不必为了 MVP 扩大数据库枚举
  - Shape:
    - `editor_source = 'import'`
    - `source_ref = 'juejin:<articleId>'`
    - `source_updated_at = article_info.mtime`（可解析时）

- Decision: 重复导入默认跳过，不在 MVP 中自动覆盖现有内容
  - Why: 若已存在同 `source_ref` 的文章，直接覆盖可能误伤已发布文章或未发布修改
  - Behavior:
    - 找到已存在来源时返回 `skipped: true`
    - 响应中携带现有 `slug`、`status`
    - 前端引导用户直接打开现有文章继续编辑
    - 批量导入返回汇总结果，例如 `imported / skipped / failed`

- Decision: 图片镜像保持 best-effort
  - Why: 项目已有 Blob 上传链路；为避免外链失效，导入时应尽量镜像图片，但不能让单张图片失败阻断整篇导入
  - Behavior:
    - 默认尝试镜像正文图片和封面图
    - 镜像失败时回退保留原图 URL

- Decision: `/write` 提供批量优先的导入入口
  - Why: 这项能力最终是给写作者使用，仅提供 API 不足以构成完整功能
  - UI:
    - 在 `/write` 顶部或设置面板加入“导入掘金”入口
    - 支持输入作者主页 URL / 用户 ID 发起批量导入
    - 支持输入单篇文章 URL 作为补充
    - 显示扫描中、导入中、成功、重复、失败和汇总状态

- Decision: 掘金登录态不作为 MVP 前提
  - Why: 你的目标是迁移“自己的已公开文章”，而公开作者页已经足够完成批量导入；把掘金 Cookie 直接交给博客后台会增加安全和维护负担
  - Follow-up:
    - 若后续确实需要抓取私密文章或草稿，再单独设计“本地脚本/浏览器扩展/受控授权”的第二阶段方案

## Risks / Trade-offs

- Risk: 掘金页面结构未来变化导致解析失效
  - Mitigation: 把提取逻辑封装在单独 adapter，并准备 SSR JSON + DOM 双路径兜底

- Risk: HTML 转 Markdown 存在格式损耗
  - Mitigation: MVP 只导入为草稿，不直接发布；保留人工复查和编辑环节

- Risk: 掘金存在风控或限流
  - Mitigation: 只做用户手动触发的迁移，单次批量内部串行或限速执行，并返回明确失败汇总

- Risk: 批量导入文章较多时，请求耗时长
  - Mitigation: MVP 允许先做同步请求 + 结果汇总；若后续数据量大，再升级为后台任务模式

## Migration Plan

1. 新增 Juejin adapter，支持作者页扫描和单篇文章提取
2. 增加写作侧单篇 / 批量导入 API
3. 在 `/write` 添加批量优先的导入入口
4. 手动验证批量导入、重复导入和失败提示

## Open Questions

- 已存在相同 `source_ref` 时，后续是否要支持“重新抓取到工作草稿”
- 掘金标签是否值得做额外解析，还是在 MVP 中允许用户导入后手动补全
- 当批量文章数非常多时，是否需要从同步请求切换为后台任务
