# ERII Blog：/write 直接发布到 Vercel 的待定方案

> 目标：把 `/write` 的编辑内容“直接发布并展示到线上站点”。
>
> 状态：**MVP 已落地**（Postgres + Blob + 草稿/发布 + 口令会话鉴权 + 公开读链路迁移）。本文件保留方案沉淀，同时补充“当前实现与使用步骤”。

> 更新：当前项目已将公开阅读内容源收敛为 **Postgres（`published`）单源**，并已弃用/移除 `content/*.mdx` 回退读取逻辑；下文中涉及 `content/` 的内容仅作为历史方案参考。

---

## 0. 当前已确认的选择（可作为后续实现基线）

- 部署：Vercel
- 内容主库：Vercel Postgres（存文章正文/元数据/状态）
- 媒体资源：Vercel Blob（存图片/视频等二进制，返回可公开访问的 URL）
- 上线时效：接近秒级可见，允许缓存 + 再验证（发布后主动 `revalidateTag/revalidatePath`）
- 权限要求：**发布/上传/编辑只允许自己使用**（必须做鉴权；“隐藏入口”不是安全机制）
- 草稿：需要（`draft/published`），并支持**私密草稿预览/继续编辑**
- 鉴权：口令会话（服务端校验口令 -> 下发**签名的 HttpOnly Cookie**）

---

## 0.5 当前实现（已落地）

### 关键文件
- 数据库 schema：`db/schema.sql`
- DB 连接：`src/lib/db.js`
- 写入鉴权：`src/lib/writeAuth.js`、`src/lib/writeGuard.js`
- 健康检查：`app/api/health/route.js`
- 写接口：
  - `app/api/write/session/route.js`（登录/登出/会话）
  - `app/api/write/posts/route.js`（草稿 upsert + 草稿列表）
  - `app/api/write/posts/publish/route.js`（发布 upsert）
  - `app/api/write/posts/[slug]/route.js`（读取草稿/已发布，用于编辑器载入）
  - `app/api/write/assets/route.js`（上传到 Blob 并回填 URL）
- 公开读链路：`src/lib/posts.js`（仅 DB：`published`）
- 编辑器：`src/components/WritePage.jsx`（登录/草稿/发布/上传/导出）

### 初始化步骤（第一次需要你手工做的）
1) **建表**：Vercel Dashboard → Storage → Postgres → Query，执行 `db/schema.sql`
2) **配置环境变量（Vercel + 本地）**
   - Postgres：`DATABASE_URL`
   - Blob：`BLOB_READ_WRITE_TOKEN`
   - 写入鉴权：`ERII_WRITE_PASSWORD`、`ERII_WRITE_SESSION_SECRET`
3) **验证连通性**：本地启动后访问 `GET /api/health`（`db.ok=true` 且 `blob.ok=true`）
4) **登录与发布**：打开 `/write` → 设置面板输入口令登录 → 草稿/奉纳/上传即可用

---

## 1. 现状与约束

### 现状（代码层）
- 文章源：**DB（published）单源**
- 读取逻辑：`src/lib/posts.js`（仅 DB + `unstable_cache`，发布后通过 `revalidateTag/revalidatePath` 刷新）
- 展示页：`app/blog/[slug]/page.jsx`（服务端读取 `getPostData(slug)`）
- 编辑器：`src/components/WritePage.jsx`（口令会话登录；草稿/发布写 DB；图片上传到 Blob；仍支持下载/复制 MDX）

### 关键约束（Vercel）
- Vercel/Serverless 运行时的文件系统**不可持久化写入**。
- 因此：生产环境不能依赖“写入本地文件”作为发布/存储方案。

结论：要实现“线上发布并展示”，必须选择**可持久化的发布通道**：
1) 写入 Git 仓库（触发重新部署后可见）
2) 写入外部持久化存储（无需重新部署即可可见）

---

## 2. 决策问题（先回答再选型）

已确认：
- **时效**：接近秒级可见，允许缓存/再验证
- **内容形态**：数据库/对象存储为准（Postgres + Blob）
- **草稿**：`draft/published` + 私密草稿预览/继续编辑
- **鉴权**：口令会话（HttpOnly Cookie）
- **安全模型**：仅本人可写（发布/上传/草稿读取都要鉴权）

待确认（会影响实现规模）：
- 是否需要“草稿列表/搜索/删除/回收站”（跨设备找回与管理）？
- 是否需要版本历史/回滚/定时发布（更高复杂度）？

---

## 3. 方案 A（推荐起步）：发布 = 提交到 GitHub `content/`，由 Vercel 自动重新部署

### 适用场景
- 你已经用 `content/*.mdx` 驱动整站内容；
- 接受发布后等待一次构建部署；
- 想要“最小改动”且保留 Git 历史。

### 核心流程
1) `/write` 前端将 `fullMdx` 发送到 `POST /api/publish`
2) 服务端 Route Handler 调用 GitHub Contents API：
   - 新建/更新 `content/<slug>.mdx`
   - commit 到指定分支（通常 `main`）
3) Vercel 监听仓库变更 → 自动构建部署
4) 部署完成后，新文章自动出现在 `/blog/<slug>` 与首页列表

### 需要做的（实现要点）
- 新增 Route Handler：`app/api/publish/route.js`
- 服务端环境变量（仅 server 端可见）：
  - `GITHUB_TOKEN`（PAT 或 GitHub App token）
  - `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_BRANCH`
  - `ERII_WRITE_PASSWORD`（或另设 `WRITE_TOKEN`，用于保护发布接口）
- slug 策略（建议可预测且稳定）：
  - 由标题/日期生成（并在发布时回传最终 slug）
  - 需要处理重复 slug（后缀 `-2` 等）
- 安全：
  - Token 永不下发到客户端
  - API 必须鉴权 + 限流（至少限制来源/口令/简单 rate limit）
  - 校验 `slug` 防止路径穿越（只允许 `[a-z0-9-]` 等）
- 用户体验：
  - 发布后提示“已提交，等待 Vercel 部署…”
  - 可选：发布后返回 commit SHA 或预期文章 URL

### 优缺点
优点：
- 改动最小：几乎不需要改 `src/lib/posts.js` 和现有页面
- 内容天然可回滚、有审计、可 PR 化
缺点：
- 非秒级：发布 ≈ 触发部署
- 需要 GitHub Token 与接口鉴权（安全必须做）

---

## 4. 方案 B（推荐长期）：发布 = 写入持久化存储，页面从存储读取（可做到秒级可见）

### 适用场景
- 你希望“按下发布立刻可见”
- 不介意把内容源从 `content/` 迁移到外部存储

### 选型子方案

#### B1. Vercel Postgres（结构化最友好）
推荐作为“文章与元数据”的主存储。

建议表结构（最小可用，优先 KISS/YAGNI）：
- `posts`
  - `id`：uuid（PK）
  - `slug`：text（unique，URL 使用；建议 `YYYY-MM-DD-<shortId>`，避免中文/日文转写复杂度）
  - `title`：text
  - `description`：text（nullable）
  - `date`：date（用于排序展示）
  - `tags`：text[]（或 jsonb，二选一）
  - `cover_url`：text（nullable，来自 Blob）
  - `content_md`：text（Markdown/MDX 源）
  - `status`：text（`draft` | `published`）
  - `published_at`：timestamptz（nullable）
  - `created_at` / `updated_at`：timestamptz

（可选）`assets`：用于管理媒体元信息（不是必须，但后续好做“素材库/复用/删除”）
- `assets`
  - `id`：uuid（PK）
  - `blob_url`：text
  - `pathname`：text（例如 `images/<uuid>.png`）
  - `content_type`：text
  - `bytes`：int
  - `created_at`：timestamptz

缓存与再验证（满足“秒级可见 + 允许缓存”）：
- 读：用 `unstable_cache`（或 Next 的 tag-based data cache）给查询打 tag：
  - 列表：`posts`
  - 单篇：`post:${slug}`
- 写/发布：服务端在成功后调用 `revalidateTag("posts")`、`revalidateTag(\`post:${slug}\`)`（或 `revalidatePath`）

#### B2. Vercel Blob + DB/KV（内容大时更合适）
推荐作为“媒体资源”的主存储（图片/视频/附件）。

编辑器体验优化点（解决“还要手动放 public 文件夹”的痛点）：
- 编辑器提供“上传图片”按钮 -> `POST /api/assets` 上传到 Blob
- 接口返回 `url` -> 自动插入到正文：`![alt](${url})` 或作为 `cover_url`

备注：
- **不建议**把图片二进制塞进 Postgres（能做但会拖累备份/迁移/性能与分发，且不走 CDN）。

#### B3. Vercel KV（Redis）
- 可用于存小体量内容或草稿缓存
- 大内容（长文）不一定适合长期当主存（取决于策略与成本）

### B 的接口草案（MVP 已实现，以下为当前路径）

鉴权（仅本人）：
- `POST /api/write/session`：提交 `ERII_WRITE_PASSWORD`（`{ password }`），成功后下发**签名的** HttpOnly Cookie（会话）
- `DELETE /api/write/session`：清除 Cookie
- `GET /api/write/session`：查询会话状态

媒体上传（Blob）：
- `POST /api/write/assets`：上传文件 -> 写入 Blob -> 返回 `{ url, blob }`
  - 约束：MIME 白名单（`image/*`、可选 `video/*`）、大小上限、鉴权必需

文章写入（Postgres）：
- `GET /api/write/posts?status=draft|all`：草稿列表（仅会话）
- `POST /api/write/posts`：草稿 upsert（返回 `slug`，用于继续编辑）
- `POST /api/write/posts/publish`：发布 upsert（返回 `slug`；并触发 `revalidateTag/revalidatePath`）
- `GET /api/write/posts/:slug`：读取草稿/已发布（仅会话，用于继续编辑）
- `POST /api/posts/:id/publish`：置为 `published` + `published_at` + `revalidateTag`

草稿工作流（MVP 建议）：
1) 进入 `/write`：自动创建草稿或打开“上次草稿”
2) 编辑中：每隔 N 秒或停止输入后 debounce `PATCH` 保存
3) 管理：在设置抽屉中提供“草稿列表/打开/删除”
4) 发布：`publish` 成功后跳转到 `/blog/<slug>`，并触发 `revalidateTag("posts")` + `revalidateTag(\`post:${slug}\`)`

### B 的页面改造点（从文件源迁移到 DB）

- `src/lib/posts.js`
  - `getSortedPostsData()`：改为查询 Postgres（仅取 `published`）
  - `getPostData(slug)`：改为按 `slug` 查询 Postgres（仅取 `published` 或按需支持草稿预览）
- `app/blog/[slug]/page.jsx`：保持渲染结构不变，数据源换成 DB
- `app/page.jsx`、`app/blog/page.jsx`：列表同样走 DB
- `/write` 编辑器：
  - 上传按钮调用 `POST /api/assets`，回填 URL 到正文/封面字段
  - 发布按钮调用 `POST /api/posts/:id/publish`（发布后秒级可见）

### 优缺点
优点：
- 可做到“秒级发布展示”
- 不依赖重新部署
缺点：
- 改造面更大：需要重写内容读取链路与迁移已有 `content/*.mdx`
- 需要处理数据备份、迁移、成本与权限

---

## 5. 方案 C（可选）：接入 Headless CMS（Sanity / Contentful 等）

适用场景：
- 你更希望“内容系统”由 CMS 承担（编辑、草稿、审核、资产管理、版本等）
- 站点侧只负责渲染与展示

缺点：
- 引入外部系统与学习成本；与当前“文件即内容”的风格差异较大

---

## 6. 安全与风险清单（无论选哪条都建议考虑）

1) **写能力鉴权（仅本人）**：保护 `/write` 与所有写接口（发布/保存草稿/上传 Blob）。
   - 最轻量推荐：`ERII_WRITE_PASSWORD`（环境变量）+ 登录换取 HttpOnly Cookie（`SameSite=Strict`、`Secure`）
   - Cookie 建议：
     - 名称用 `__Host-` 前缀（例如 `__Host-erii_session`），并固定 `Path=/`
     - 内容为**可验证签名**的会话（包含过期时间），签名密钥使用 `ERII_WRITE_SESSION_SECRET`
     - 口令比较使用 constant-time（避免侧信道），并给登录接口加限流/延迟
   - Middleware 在 Edge 侧拦截 `/write` 与 `/api/*(写)`：无会话直接 401/重定向
   - API 额外校验 `Origin`（避免 CSRF）+ 基础限流（防爆破）
2) **输入校验**：
   - 限制 `slug` 字符集，禁止 `../`
   - 限制正文大小（避免滥用）
3) **MDX 风险**：
   - 当前展示页用 `next-mdx-remote/rsc` 渲染 MDX：如果未来允许“非自己”发布，必须明确是否允许 JSX/组件能力。
4) **速率限制**：
   - 防止暴力尝试口令、刷接口
5) **成本风险**：
   - Blob 上传可能被滥用（所以必须鉴权）
   - Postgres/Blob 都有配额与计费，建议加简单的文件大小上限与 MIME 白名单

---

## 7. 推荐路线（务实）

已确认你更偏向“写作体验顺滑 + 媒体上传内聚”，因此推荐直接走：

1) **方案 B（Vercel Postgres + Vercel Blob）**：发布接近秒级可见，编辑器支持一键上传并插入链接；
2) **方案 A（GitHub 提交）** 作为备选：当你希望“内容必须以文件形态落库并走 Git 历史”时再启用。

---

## 8. （待办）下次真要实现时的落地清单

- [ ] 草稿管理范围：草稿列表/打开/删除/回收站是否需要
- [ ] 会话策略：Cookie 结构、签名方式、过期时间、`AUTH_SECRET` 轮换策略
- [ ] 选择：B（Postgres+Blob）为主，A 作为备选
- [ ] 定义：slug 规则 + 冲突策略
- [ ] 定义：鉴权方式（口令会话 vs OAuth）
- [ ] UI：发布按钮状态、错误提示、发布完成反馈
- [ ] 缓存：tag-based cache + `revalidateTag/revalidatePath`

### MVP 实施顺序（建议）

1) 基础资源
   - 在 Vercel 控制台开通 Postgres + Blob，并配置环境变量（本地/预览/生产）
2) 鉴权闭环（先把写能力关起来）
   - 实现 `POST /api/auth/login`、`POST /api/auth/logout`
   - Middleware 保护 `/write` 与写接口（发布/保存/上传）
3) 媒体上传（体验关键）
   - 实现 `POST /api/assets`：上传 -> Blob -> 返回 URL（并在编辑器里“上传后自动插入”）
4) 草稿 CRUD
   - 实现 `POST /api/posts`、`GET/PATCH/DELETE /api/posts/:id`、`GET /api/posts?status=draft`
   - 在编辑器里加“自动保存（debounce）+ 草稿列表打开”
5) 发布与展示
   - 实现 `POST /api/posts/:id/publish` + `revalidateTag`
   - 将 `src/lib/posts.js` 从 `fs` 迁移到 Postgres（先只读 `published`）
6) 迁移历史文章（可选）
   - 编写一次性脚本把 `content/*.mdx` 导入 Postgres，或短期双源读取（不建议长期维护）
