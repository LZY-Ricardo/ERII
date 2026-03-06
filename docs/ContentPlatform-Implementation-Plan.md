# ERII Blog 内容平台改造实施方案（详细设计）

## 1. 背景与目标

当前项目已经完成 `content/` 文件到 Postgres 的迁移，线上发布内容来自 `posts` 表。  
现有链路能满足基础发布，但在以下方面存在限制：

1. 内容表达能力受限：主体依赖单段 `content` 文本，复杂排版和复用模块不够友好。
2. 编辑体验不足：虽然有上传与预览，但缺少块级结构能力（可插拔组件、复杂布局、内容模块化）。
3. 第三方编辑源接入难：若直接用 Notion 作为线上数据源，会引入速率、链接有效期、渲染受限等问题。

本方案目标：

1. 保持 **Neon(Postgres) 作为唯一正式发布数据源**。
2. 升级内容模型为 **MDX + Blocks 混合**，实现高度自定义。
3. 保持并强化 **对象存储（Vercel Blob）** 媒体链路，支持文中任意位置图片/媒体。
4. 支持 **Notion 作为可选编辑入口**（同步到本库，不直接线上读取 Notion）。
5. 采用增量改造，保证可回滚、低风险上线。

## 2. 现状盘点（基于当前仓库）

### 2.1 当前关键实现

1. 数据库：`db/schema.sql` 中 `posts` 为主表，核心字段是 `content TEXT`。
2. 发布读取：`src/lib/posts.js` 读取 `status='published'` 文章，详情页渲染 `content`。
3. 渲染方式：`app/blog/[slug]/page.jsx` 使用 `MDXRemote` 渲染文章正文。
4. 写作入口：`src/components/WritePage.jsx` 负责编辑、预览、草稿、发布。
5. 资产上传：`app/api/write/assets/route.js` 上传到 Vercel Blob，并写入 `assets` 表。
6. 发布接口：`app/api/write/posts/publish/route.js` 执行 upsert，并触发 revalidate。

### 2.2 现状优缺点

优点：

1. 已有完整发布链路（编辑 -> 保存/发布 -> 缓存刷新 -> 前台可见）。
2. 已具备图片上传和资产登记能力。
3. 站点已跑在 Next.js App Router，便于继续扩展内容管线。

痛点：

1. 内容仍以单字符串为中心，不利于“模块级”定制和复用。
2. 编辑器不是块模型，复杂内容的结构化管理困难。
3. 缺少版本快照机制，改错后回滚成本高。
4. 缺少标准第三方同步抽象（如 Notion 页面映射、同步状态、冲突策略）。

## 3. 目标架构

## 3.1 总体原则

1. 数据主权在本库：线上页面只读本库，不直接依赖第三方实时接口。
2. 内容结构化优先：新增 `content_format` 和 `content_json`，保留 `content` 兼容。
3. 渐进迁移：先扩模型，再改接口，再改编辑器，最后加同步。
4. 可观测可回滚：每个阶段有验证 SQL、监控点和回滚路径。

## 3.2 目标链路

1. 编辑器（内部 Write Page 或 Notion）产生内容。
2. 后端统一转换为标准内容模型（MDX/Blocks）。
3. 文章入库到 `posts`（发布态）并写 `post_revisions`（版本快照）。
4. 前台只读 `posts` 发布版本渲染。
5. 媒体统一走 Blob（外链可选转存）并由 `assets` 管理元数据。

## 3.3 内容模型策略（推荐）

采用“混合双轨”：

1. `content`：保留，作为兼容字段（当前线上渲染与老文章立即可用）。
2. `content_format`：标记内容类型（`markdown` / `mdx` / `blocks`）。
3. `content_json`：结构化块内容（`jsonb`），用于高自定义场景。
4. `render_body`：渲染前统一产物（通常为 MDX 字符串），用于前台稳定渲染。

说明：

1. 短期继续让页面主要读取 `render_body || content`。
2. 中期通过内容管线把 `blocks -> render_body` 编译标准化。
3. 长期可逐步弱化直接编辑 `content`。

## 4. 数据库设计

以下为增量设计，避免破坏现有线上行为。

## 4.1 `posts` 表增量字段

```sql
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS content_format TEXT NOT NULL DEFAULT 'mdx'
    CHECK (content_format IN ('markdown', 'mdx', 'blocks')),
  ADD COLUMN IF NOT EXISTS content_json JSONB,
  ADD COLUMN IF NOT EXISTS render_body TEXT,
  ADD COLUMN IF NOT EXISTS editor_source TEXT NOT NULL DEFAULT 'internal'
    CHECK (editor_source IN ('internal', 'notion', 'import')),
  ADD COLUMN IF NOT EXISTS source_ref TEXT,
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS latest_revision_id BIGINT;
```

索引建议：

```sql
CREATE INDEX IF NOT EXISTS posts_editor_source_idx ON posts (editor_source, updated_at DESC);
CREATE INDEX IF NOT EXISTS posts_source_ref_idx ON posts (source_ref) WHERE source_ref IS NOT NULL;
```

初始化兼容数据：

```sql
UPDATE posts
SET render_body = content
WHERE render_body IS NULL;
```

## 4.2 版本快照表 `post_revisions`

```sql
CREATE TABLE IF NOT EXISTS post_revisions (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  revision_no INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  content_format TEXT NOT NULL CHECK (content_format IN ('markdown', 'mdx', 'blocks')),
  content_text TEXT,
  content_json JSONB,
  render_body TEXT,
  title TEXT NOT NULL,
  description TEXT,
  cover TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, revision_no)
);

CREATE INDEX IF NOT EXISTS post_revisions_post_id_created_at_idx
  ON post_revisions (post_id, created_at DESC);
```

用途：

1. 每次保存草稿/发布都可落一份快照。
2. 支持“查看历史版本”和“回滚到某版本”。

## 4.3 同步任务表 `content_sync_jobs`（为 Notion 预留）

```sql
CREATE TABLE IF NOT EXISTS content_sync_jobs (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('notion')),
  source_ref TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'success', 'failed', 'skipped')),
  payload JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_sync_jobs_status_created_at_idx
  ON content_sync_jobs (status, created_at DESC);
```

用途：

1. 记录同步执行历史，便于重试和排障。
2. 避免 webhook 处理“黑盒化”。

## 5. 应用层设计

## 5.1 内容域服务分层

新增内容服务层，隔离 UI 和 DB 细节。

建议目录：

1. `src/lib/content/contentService.js`
2. `src/lib/content/renderPipeline.js`
3. `src/lib/content/adapters/internalEditorAdapter.js`
4. `src/lib/content/adapters/notionAdapter.js`

职责：

1. 统一入参（标题、元数据、内容格式、正文/块数据）。
2. 统一生成 `render_body`。
3. 执行 upsert posts + 写 revision + revalidate。

## 5.2 渲染策略

文章页读取策略：

1. 首选 `render_body`。
2. 若为空，回退 `content`（兼容旧文）。

页面层改造点：

1. `app/blog/[slug]/page.jsx` 不再直接依赖 `post.content`，改为 `post.renderBody`。
2. `src/lib/posts.js` 查询列补充 `content_format, render_body`。

## 5.3 写作接口改造（向后兼容）

保留现有：

1. `POST /api/write/posts`（草稿）
2. `POST /api/write/posts/publish`（发布）
3. `GET /api/write/posts/[slug]`（加载）

新增字段（可选）：

1. `contentFormat`
2. `contentJson`
3. `renderBody`
4. `editorSource`
5. `sourceRef`

兼容规则：

1. 老客户端仅传 `content` 时，后端默认 `contentFormat='mdx'`，`renderBody=content`。
2. 新客户端传 `blocks` 时，后端先转换 `blocks -> renderBody` 再入库。

## 5.4 编辑器演进方案

分两步：

1. 第一步：保持现有编辑器，先让后端支持新内容字段和版本快照。
2. 第二步：引入 TipTap/Lexical（推荐 TipTap，落地速度快），实现 block 结构编辑。

推荐首批 Block：

1. Paragraph / Heading / List / Quote
2. Image（复用现有 `/api/write/assets`）
3. CodeBlock
4. Callout
5. Divider
6. Embed（可选）

## 5.5 图片与媒体策略

坚持“统一托管”：

1. 所有编辑入口（内部或 Notion）最终都转成 Blob URL。
2. `assets` 记录来源（内部上传 / Notion 转存）和映射关系。

建议扩展 `assets`：

```sql
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS source_provider TEXT
    CHECK (source_provider IN ('internal', 'notion', 'external')),
  ADD COLUMN IF NOT EXISTS source_url TEXT;

CREATE INDEX IF NOT EXISTS assets_source_provider_idx ON assets (source_provider, created_at DESC);
```

## 6. Notion 作为可选编辑入口（不作为线上源）

## 6.1 接入边界

1. Notion 只负责写作与协作。
2. 发布与展示统一依赖本库 `posts`。
3. 同步成功才影响线上内容。

## 6.2 同步流程

1. 接收 webhook（或定时补偿任务）写入 `content_sync_jobs`。
2. 拉取 Notion 页面块数据。
3. 映射为内部 `content_json`。
4. 遇到 Notion 文件链接时下载并转存 Blob，替换为本站 URL。
5. 生成 `render_body` 并 upsert `posts`。
6. 写入 revision，更新任务状态。

## 6.3 冲突与幂等策略

1. `source_ref`（Notion page id）唯一映射单文章。
2. 以 `source_updated_at` 比较新旧，旧事件直接 `skipped`。
3. 同一 `source_ref + updated_at` 同步应幂等。

## 7. 缓存与发布策略

## 7.1 缓存标签建议

当前已有：

1. `posts`
2. `post:${slug}`

建议增加：

1. `post-render:${slug}`（渲染产物更新）
2. `post-revision:${slug}`（版本相关视图）

## 7.2 发布行为

1. 发布接口成功后同时刷新首页、列表页、详情页（你当前已部分实现）。
2. 草稿保存只刷新写作相关读取与预览，不影响公开页面。

## 8. 分阶段实施计划（建议 5 个迭代）

## 阶段 1：数据层扩展（1-2 天）

交付：

1. `posts` 新字段。
2. `post_revisions`、`content_sync_jobs` 新表。
3. 回填 `render_body=content`。

验证：

1. 老页面不改代码时可继续正常展示。
2. 新增字段不影响现有读写。

回滚：

1. 仅停用新字段读取，保留旧 `content` 路径。

## 阶段 2：服务层与 API 兼容升级（2-3 天）

交付：

1. `contentService` 和 `renderPipeline`。
2. 写作 API 支持新字段并写 revisions。
3. `GET /api/write/posts/[slug]` 返回结构化内容字段。

验证：

1. 保存草稿和发布都写入 revision。
2. 老客户端无需改动即可继续发布。

回滚：

1. API 忽略新字段，继续按 `content` 写入。

## 阶段 3：前台渲染切换（1-2 天）

交付：

1. 文章页优先渲染 `render_body`。
2. `src/lib/posts.js` 读取新字段并做回退。

验证：

1. 新旧文章均可正常渲染。
2. 缓存刷新行为符合预期。

回滚：

1. 页面改回只读 `content`。

## 阶段 4：编辑器升级（3-5 天）

交付：

1. 引入 TipTap/Lexical 之一。
2. 支持首批 Block（含图片）。
3. 允许“源码模式”与“块模式”切换。

验证：

1. 能在文中任意位置插图并控制尺寸/对齐。
2. `blocks -> render_body` 转换稳定。

回滚：

1. 保留旧编辑器入口作为 fallback。

## 阶段 5：Notion 同步（可选，3-5 天）

交付：

1. webhook endpoint。
2. 同步任务执行器与重试机制。
3. Notion 页面到文章映射与图片转存。

验证：

1. 从 Notion 更新后可自动同步到线上。
2. 同步失败可追踪并重试。

回滚：

1. 关闭同步入口，不影响内部编辑发布。

## 9. 关键风险与应对

1. 渲染安全风险（MDX 执行能力较强）。  
应对：限制可用组件白名单，禁止危险表达式，服务端编译校验失败即拒绝发布。

2. 内容模型双轨导致复杂度提升。  
应对：定义单一“发布渲染源”字段 `render_body`，其他字段只作为输入或历史。

3. Notion 文件链接有效期问题。  
应对：同步时强制转存 Blob，不在前台保留临时链接。

4. 迁移期间新旧逻辑并存。  
应对：所有新逻辑放 feature flag，按路由或账号灰度启用。

## 10. 验收标准

1. 作者可在文章中自由插入图片、代码块、提示块等，发布后样式稳定。
2. 编辑任意已发布文章可回滚历史版本。
3. 前台渲染对旧文零破坏。
4. 新接口对旧客户端兼容。
5. Notion（如启用）仅作为输入源，不影响线上可用性与性能。

## 11. 推荐立即执行的最小落地范围（MVP）

先做以下四项即可显著改善体验，并保持风险最低：

1. 完成 `posts` 增量字段 + `post_revisions` 表。
2. 写作接口增加 `content_format/content_json/render_body` 支持，兼容旧字段。
3. 文章页改为优先渲染 `render_body`。
4. 编辑器先不大改 UI，先接入“结构化保存能力”与版本快照。

完成 MVP 后再进入块编辑器 UI 与 Notion 同步，工程可控性最佳。

