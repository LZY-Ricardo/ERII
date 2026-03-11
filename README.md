# ERII Blog

个人博客项目，当前为 **DB-only 内容架构**：

- 公开内容来源：Postgres `posts(status='published')`
- 写作入口：`/write`（口令会话鉴权）
- 媒体资源：Vercel Blob
- 内容形态：`mdx` + `blocks` 双模式
- 同步能力：Notion 手动同步 + Webhook 同步

## 技术栈

- Next.js 16.1.1（App Router）
- React 19.2.3
- Tailwind CSS 4
- `next-mdx-remote` / `react-markdown`
- `@vercel/postgres` / `@vercel/blob`

## 快速开始

1. 安装依赖

```bash
corepack enable
pnpm install
```

2. 配置环境变量（本地建议放在 `.env.local`）

- `DATABASE_URL`（或 `POSTGRES_URL`）
- `BLOB_READ_WRITE_TOKEN`
- `ERII_WRITE_PASSWORD`
- `ERII_WRITE_SESSION_SECRET`
- 可选 Notion：
  - `NOTION_TOKEN`
  - `NOTION_API_VERSION`（默认 `2022-06-28`）
  - `ERII_NOTION_WEBHOOK_SECRET`

3. 初始化数据库（首次）

- 执行：`db/schema.sql`
- 或执行迁移：`db/migrations/20260304_content_platform.sql`

4. 启动开发服务

```bash
pnpm dev
```

默认端口：`http://localhost:3239`

## 常用脚本

- `pnpm dev`：本地开发
- `pnpm lint`：ESLint 检查
- `pnpm build`：生产构建
- `pnpm start`：启动生产服务

## 内容与写作能力

- `/write` 支持：
  - 登录/登出会话
  - 草稿保存
  - 发布（触发 revalidate）
  - 文章列表检索与载入
  - 图片/封面上传到 Blob
  - MDX / Blocks 双编辑模式
- 版本能力：
  - `post_revisions` 快照记录
  - 支持按版本恢复
- Notion 同步：
  - 手动：`POST /api/write/sync/notion`
  - Webhook：`POST /api/write/sync/notion/webhook`

## 关键接口（写作侧）

- `GET/POST/DELETE /api/write/session`
- `GET/POST /api/write/posts`
- `GET /api/write/posts/[slug]`
- `POST /api/write/posts/publish`
- `GET/POST /api/write/posts/[slug]/revisions`
- `POST /api/write/assets`
- `POST /api/write/sync/notion`
- `POST /api/write/sync/notion/webhook`
- `GET /api/health`

## 文档

- 文档导航：`docs/README.md`
- 项目现状报告：`docs/Project-Feature-and-Progress-Report.md`
- 运行手册：`docs/ContentPlatform-Runbook.md`
- 内容平台实施方案：`docs/ContentPlatform-Implementation-Plan.md`
