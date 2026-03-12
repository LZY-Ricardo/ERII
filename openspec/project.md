# Project Context

## Purpose
个人博客项目 (ERII Blog)，采用 DB-only 内容架构：
- 公开内容来源：Postgres `posts(status='published')`
- 写作入口：`/write`（口令会话鉴权）
- 媒体资源：Vercel Blob
- 内容形态：`mdx` + `blocks` 双模式
- 同步能力：Notion 手动同步 + Webhook 同步

## Tech Stack
- Next.js 16.1.1 (App Router)
- React 19.2.3
- TypeScript
- Tailwind CSS 4
- Vercel Postgres (`@vercel/postgres`)
- Vercel Blob (`@vercel/blob`)
- MDX 渲染：`next-mdx-remote` / `react-markdown`
- Markdown 编辑器：`bytemd` / `@bytemd/react`
- 包管理器：pnpm 10.22.0

## Project Conventions

### Code Style
- 使用 ESLint 进行代码检查 (`eslint.config.mjs`)
- 组件文件使用 `.jsx` / `.tsx` 扩展名
- 工具函数放在 `src/lib/` 目录
- 组件放在 `src/components/` 目录

### Architecture Patterns
- Next.js App Router 架构
- 数据库优先 (DB-only) 内容管理
- 双编辑模式：MDX 和 Blocks
- 会话鉴权：基于 cookie 的写作权限控制
- 内容版本控制：`post_revisions` 表记录历史快照

### Testing Strategy
- 当前项目未配置自动化测试
- 依赖手动测试和验证

### Git Workflow
- 主分支：`main`
- 提交信息格式：遵循 Conventional Commits
- 开发端口：3239

## Domain Context
- 博客内容管理系统
- 支持 Notion 作为外部内容源同步
- 文章分类：通��� `post_taxonomy` 管理
- 评论系统：支持评论审核、删除、标记垃圾评论
- 管理后台：`/write` 路径下的写作和管理界面

## Important Constraints
- 写作功能需要通过 `ERII_WRITE_PASSWORD` 鉴权
- 媒体文件上传依赖 Vercel Blob
- 数据库依赖 Vercel Postgres
- 环境变量必须配置：
  - `DATABASE_URL` 或 `POSTGRES_URL`
  - `BLOB_READ_WRITE_TOKEN`
  - `ERII_WRITE_PASSWORD`
  - `ERII_WRITE_SESSION_SECRET`

## External Dependencies
- Vercel Postgres：数据库服务
- Vercel Blob：媒体文件存储
- Notion API：可选的内容同步源
  - `NOTION_TOKEN`
  - `NOTION_API_VERSION` (默认 2022-06-28)
  - `ERII_NOTION_WEBHOOK_SECRET`
