# ERII Blog 项目功能与开发进度报告

更新时间：2026-03-11  
扫描范围：`app/`、`src/`、`db/`、`scripts/`、`docs/`、根目录关键文档

---

## 1. 项目总览

### 1.1 技术栈

- 框架：Next.js 16.1.1（App Router）
- 运行：React 19.2.3
- 样式：Tailwind CSS 4 + Typography
- 内容渲染：`next-mdx-remote` + `react-markdown`
- 数据层：Vercel Postgres（主内容）+ Vercel Blob（媒体）
- 鉴权：口令 + HttpOnly Cookie 会话

### 1.2 代码规模（源码统计）

- 代码文件（`.js/.jsx/.mjs/.sql`）：52
- 总行数：6591
- 分布：
  - `src/`：33 文件，5203 行
  - `app/`：16 文件，1088 行
  - `db/`：2 文件，141 行
  - `scripts/`：1 文件，159 行

### 1.3 文档规模（`docs/`）

- 文档数：8
- 文档总行数：1094

---

## 2. 当前已实现功能（基于代码确认）

## 2.1 公开站点与展示层

- 页面路由已具备：首页、博客列表、博客详情、项目页、关于页、写作页
  - 参考：`app/page.jsx`、`app/blog/page.jsx`、`app/blog/[slug]/page.jsx`、`app/projects/page.jsx`、`app/about/page.jsx`、`app/write/page.jsx`
- 统一壳层（Argon 风格）已接入：导航、左栏、右栏、页脚
  - 参考：`src/components/argon/ArgonShell.jsx`
- 分类/标签/主题筛选已实现（服务端过滤）
  - 参考：`app/blog/page.jsx`、`src/lib/postTaxonomy.js`
- 项目展示与筛选已实现
  - 参考：`app/projects/page.jsx`、`src/lib/projects.js`

## 2.2 内容读取与渲染链路（DB-only）

- 公开文章读取来源已收敛为 Postgres `posts(status='published')`
  - 参考：`src/lib/posts.js`
- 文章详情优先使用 `render_body`，回退 `content`
  - 参考：`app/blog/[slug]/page.jsx`
- MDX 渲染已实现
  - 参考：`app/blog/[slug]/page.jsx`（`MDXRemote`）

## 2.3 写作后台（/write）

- 编辑器支持两种模式：
  - `MDX` 文本模式
  - `BLOCKS` 区块模式（段落/标题/列表/引用/代码/图片/提示/嵌入/分割线）
  - 参考：`src/components/WritePage.jsx`、`src/components/BlockComposer.jsx`
- 区块模板与区块数据模型已实现
  - 参考：`src/lib/content/blockEditorModel.js`
- 区块内容可转换为可渲染 MDX
  - 参考：`src/lib/content/renderPipeline.js`
- 编辑器能力已实现：
  - 口令登录/登出
  - 草稿保存、发布
  - 指定 slug 载入文章
  - 文章列表检索/筛选
  - 图片上传插入、封面上传
  - 下载/复制 MDX
  - 参考：`src/components/WritePage.jsx`

## 2.4 写接口与会话鉴权

- 会话接口：
  - `GET/POST/DELETE /api/write/session`
  - 参考：`app/api/write/session/route.js`
- 写作接口：
  - `GET/POST /api/write/posts`
  - `POST /api/write/posts/publish`
  - `GET /api/write/posts/[slug]`
  - `GET/POST /api/write/posts/[slug]/revisions`
  - 参考：`app/api/write/posts/**`
- 媒体上传接口：
  - `POST /api/write/assets`（上传 Blob + 资产入库）
  - 参考：`app/api/write/assets/route.js`
- 健康检查接口：
  - `GET /api/health`（DB + Blob 连通性）
  - 参考：`app/api/health/route.js`

## 2.5 内容平台增强能力

- 扩展内容字段已落地：`content_format/content_json/render_body/editor_source/source_ref/source_updated_at/latest_revision_id`
  - 参考：`db/schema.sql`、`db/migrations/20260304_content_platform.sql`
- 版本快照表已落地：`post_revisions`
- 同步任务表已落地：`content_sync_jobs`
- 内容写入服务层已落地（兼容旧 schema）
  - 参考：`src/lib/content/contentService.js`

## 2.6 Notion 同步

- 已实现手动同步接口：`POST /api/write/sync/notion`
- 已实现 webhook 同步接口：`POST /api/write/sync/notion/webhook`
- 已实现 Notion 页面/块拉取、块映射、可选资产镜像到 Blob、入库发布
  - 参考：`app/api/write/sync/notion/**`
  - 参考：`src/lib/content/notionSync.js`、`src/lib/content/adapters/notionAdapter.js`、`src/lib/content/syncJobs.js`

---

## 3. 开发进度评估（按模块）

| 模块 | 进度 | 说明 |
|---|---|---|
| 公开博客展示（首页/列表/详情/项目/关于） | 已完成 | 路由与页面结构完整，已接入统一壳层 |
| DB-only 内容源迁移 | 已完成 | 公开读取已收敛到 Postgres |
| 写作后台核心（登录/草稿/发布/上传） | 已完成 | 已具备可用的端到端写作发布链路 |
| 区块编辑（Blocks） | 已完成（MVP） | 区块模型、模板、DND、渲染转换均已实现 |
| 版本快照与回滚 | 已完成（API层） | 已有 revisions 查询与按版本恢复接口 |
| Notion 同步 | 已完成（可用版） | 手动+Webhook+任务状态记录已落地 |
| 主题控制（暗色/字体/滤镜/圆角等） | 已完成 | 左右栏均可调整站点观感参数 |
| 站内搜索 | 部分完成 | 已有 UI 入口与面板，未见实际搜索后端/索引实现 |
| 评论系统 | 部分完成 | 目前为交互壳层，提交逻辑标注为“后续接入” |
| 自动化测试（unit/integration/e2e） | 待完善 | 未发现测试文件与测试脚本 |

---

## 4. 关键差异与状态说明

- `README.md` 仍是 Next.js 初始化模板，未同步项目真实能力（建议后续更新）。
- `docs/ERIIEditorFeatureDevelopmentGuide.md` 明确标注为历史方案（`content/` 文件时代），当前应以 DB-only 文档为准。
- `docs/Nighthaven-Replica-Plan.md` 记录“龙族主题第二阶段”仍未完成（文档内保留待办项）。
- 代码中存在旧风格组件（如 `Header/Footer/SecretTrigger`）但主流程已采用 Argon 壳层，属于并存状态。

---

## 5. 当前可用能力结论

项目已具备“个人博客生产可用的核心闭环”：

1. 内容可在 `/write` 登录后进行草稿与发布管理。
2. 媒体可上传到 Blob 并回填文章。
3. 发布后通过 revalidate 刷新公开页面。
4. 公共页面可按分类/标签/主题筛选浏览。
5. 已具备版本快照与 Notion 同步的扩展能力。

当前主要短板集中在“搜索/评论真实后端接入”和“自动化测试体系”。

---

## 6. 建议下一阶段（基于现状）

1. 补齐自动化测试最小集：`api/write` 写入链路 + `/blog/[slug]` 渲染链路。
2. 完成搜索的真实查询实现（当前 UI 已具备）。
3. 将评论区从演示壳层升级为可持久化后端。
4. 更新根文档（尤其 `README.md`），统一对外说明与当前代码一致。
