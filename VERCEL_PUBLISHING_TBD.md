# ERII Blog：/write 直接发布到 Vercel 的待定方案

> 目标：把 `/write` 的编辑内容“直接发布并展示到线上站点”，但当前**暂不实现**，先沉淀可选方案与决策点。

---

## 1. 现状与约束

### 现状（代码层）
- 文章源：`content/*.mdx`
- 读取逻辑：`src/lib/posts.js` 使用 `fs` + `gray-matter` 读取 `content/`
- 展示页：`app/blog/[slug]/page.jsx`（服务端读取 `getPostData(slug)`）
- 编辑器：`src/components/WritePage.jsx`（客户端生成 frontmatter + content；当前“奉纳”= 下载 MDX）

### 关键约束（Vercel）
- Vercel/Serverless 运行时的文件系统**不可持久化写入**。
- 因此：不能在生产环境里通过 API 把文件写进 `content/` 并期待它永久存在。

结论：要实现“线上发布并展示”，必须选择**可持久化的发布通道**：
1) 写入 Git 仓库（触发重新部署后可见）
2) 写入外部持久化存储（无需重新部署即可可见）

---

## 2. 决策问题（先回答再选型）

1) **时效**：希望“秒级可见”，还是接受“等待一次重新部署（几十秒~几分钟）”？
2) **内容形态**：继续坚持“文件即内容（MDX 文件）”，还是接受“数据库/对象存储即内容”？
3) **安全模型**：是否接受一个最轻量的写作口令（环境变量），或需要更正式的鉴权（OAuth / GitHub 登录）？
4) **功能边界**：是否需要草稿、版本历史、回滚、定时发布、多人协作？

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
  - `WRITE_PASSWORD`（或 `WRITE_TOKEN`，用于保护发布接口）
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
- 建议数据模型（示例）：
  - `posts`：`slug`（PK）、`title`、`date`、`description`、`tags`（json/text）、`cover`、`content`、`status`（draft/published）、`created_at`、`updated_at`
- 发布流程：
  - `POST /api/posts` 写入 DB
  - 发布后使用 `revalidatePath("/")` / `revalidatePath("/blog")` / `revalidatePath(\`/blog/${slug}\`)`
- 页面改造：
  - `src/lib/posts.js` 改为 DB 查询（替换 `fs` 读取）
  - 列表页、详情页同样从 DB 读取

#### B2. Vercel Blob + DB/KV（内容大时更合适）
- `content` 存 Blob（例如 `posts/<slug>.mdx`），元数据放 DB 或 KV
- 展示时先读元数据，再读 Blob 内容

#### B3. Vercel KV（Redis）
- 可用于存小体量内容或草稿缓存
- 大内容（长文）不一定适合长期当主存（取决于策略与成本）

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

1) **发布接口鉴权**：至少需要 `WRITE_PASSWORD` 级别的保护（环境变量 + 请求头）。
2) **输入校验**：
   - 限制 `slug` 字符集，禁止 `../`
   - 限制正文大小（避免滥用）
3) **MDX 风险**：
   - 当前展示页用 `next-mdx-remote/rsc` 渲染 MDX：如果未来允许“非自己”发布，必须明确是否允许 JSX/组件能力。
4) **速率限制**：
   - 防止暴力尝试口令、刷接口

---

## 7. 推荐路线（务实）

1) 先上 **方案 A（GitHub 提交）**：最少改动、最贴近当前架构；
2) 如果之后强烈需要“秒级可见/草稿系统”，再迁移到 **方案 B（DB/Blob）**。

---

## 8. （待办）下次真要实现时的落地清单

- [ ] 明确：是否接受“发布后等待部署”
- [ ] 选择：A（GitHub）或 B（DB/Blob）
- [ ] 定义：slug 规则 + 冲突策略
- [ ] 定义：鉴权方式（口令 / OAuth / GitHub 登录）
- [ ] UI：发布按钮状态、错误提示、发布完成反馈
- [ ] 缓存：是否需要 `revalidatePath` / ISR / 动态渲染

