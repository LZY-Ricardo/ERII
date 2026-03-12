# 博客评论系统落地方案（Nighthaven 评论区高还原）

更新时间：2026-03-11  
目标参考页：`https://www.nighthaven.cn:8660/tsserverbuild/`  
当前项目：`erii-blog`（Next.js App Router + Vercel Postgres）

## 1. 目标

在当前博客项目中新增可用的评论系统，优先实现：

1. 评论区 UI 与交互尽量还原 Nighthaven/Argon（包含发送/编辑/回复/表情面板/Markdown 开关/附加字段展开）。
2. 完整后端能力（评论列表、提交、编辑、回复、验证码）。
3. 自主可验证（接口、页面交互、构建与 lint 通过），降低你的人工修改成本。

## 2. 当前项目现状（已核查）

当前项目尚未具备真实评论能力，仅有演示壳组件：

1. 详情页只渲染演示组件：`app/blog/[slug]/page.jsx` -> `ArgonCommentShell`。
2. 演示组件文件：`src/components/argon/ArgonCommentShell.jsx`（本地状态，不持久化）。
3. 数据库 schema 无评论相关表：`db/schema.sql`。
4. 现有 API 无 `/api/comments` 路由，只有 `app/api/health` 与 `app/api/write/*`。

结论：目前不存在真实评论系统。

## 3. 目标站评论区结构分析（基于真实页面 + 主题源码）

## 3.1 页面骨架（DOM）

目标页核心区块分为两张卡片：

1. 列表卡：`#comments.comments-area.card.shadow-sm`
2. 表单卡：`#post_comment.card.shadow-sm`

关键表单节点：

1. 标题：`.post-comment-title`（发送评论 / 编辑评论切换）
2. 回复信息条：`#post_comment_reply_info.post-comment-reply`（默认隐藏）
3. 内容输入：`#post_comment_content`
4. 身份字段：`#post_comment_name`、`#post_comment_email`
5. 验证码：`#post_comment_captcha`（算式显示在容器 `:before`）
6. 附加字段：`#post_comment_link`（默认折叠）
7. 按钮：`#post_comment_send`、`#post_comment_edit_cancel`、`#post_comment_toggle_extra_input`
8. Markdown 开关：`#comment_post_use_markdown`
9. 表情按钮：`#comment_emotion_btn`
10. 表情面板：`#emotion_keyboard.emotion-keyboard`

## 3.2 评论项结构（从样式与脚本反推）

评论项由 `.comment-item` 组织，内部可见以下语义区域：

1. 头像列：`.comment-item-left-wrapper`、`.comment-item-avatar`
2. 主体列：`.comment-item-inner`
3. 标题行：`.comment-item-title`、`.comment-name`、徽标（管理员/置顶/私密/待审）
4. 正文：`.comment-item-text`（Markdown 渲染后）
5. 信息行：`.comment-info`（时间、编辑标记、UA 等）
6. 操作区：`.comment-operations`（回复、编辑、置顶等，hover 显示）
7. 点赞按钮：`.comment-upvote`
8. 回复树：`ul.children`（嵌套评论）

## 3.3 视觉 token（高还原关键）

核心视觉特征：

1. 主色：`#009688`（页面 meta: `theme-color-rgb = 0,150,136`）
2. 卡片圆角：`30px`（页面 meta: `theme-card-radius = 30`，运行时映射到 `--card-radius`）
3. 卡片阴影：`0 15px 35px rgba(50,50,93,.1), 0 5px 15px rgba(0,0,0,.07)`
4. 表情按钮：圆形 `42x42`，透明背景，弱显隐过渡
5. 评论框：`min-height: 80px`，自动高度，`resize: none`
6. Input group：`input-group-alternative` + 前置 icon

## 3.4 交互状态机

表单存在 4 类状态：

1. 默认发送态：显示“发送”，支持 Markdown、表情、附加字段
2. 回复态：展示被回复对象与预览，可取消回复
3. 编辑态：标题与主按钮切换为“编辑”，显示“取消编辑”
4. 发送中态：表单 disabled，按钮 icon 切换 spinner

评论列表存在 2 类状态：

1. 空态：`暂无评论`
2. 有评论：渲染 `ol.comment-list` + 分页/更多

## 3.5 目标站后端行为（脚本可见）

主题脚本里可见 action（WordPress AJAX）：

1. `ajax_post_comment`：提交评论
2. `user_edit_comment`：编辑评论
3. `upvote_comment`：点赞
4. `get_comment_edit_history`：编辑历史
5. `pin_comment`：置顶（管理能力）

这给了我们 Next.js API 的功能映射依据。

## 4. 在当前项目的落地架构设计

## 4.1 数据模型（Vercel Postgres）

先落地最小可用且可扩展结构。

### 表 1：`comments`

字段建议：

1. `id BIGSERIAL PRIMARY KEY`
2. `post_slug TEXT NOT NULL`（关联 `posts.slug`）
3. `parent_id BIGINT NULL REFERENCES comments(id) ON DELETE CASCADE`
4. `author_name TEXT NOT NULL`
5. `author_email TEXT NOT NULL`
6. `author_email_hash TEXT NOT NULL`（头像/隐私用途）
7. `author_link TEXT`
8. `content_raw TEXT NOT NULL`
9. `content_html TEXT NOT NULL`（服务端渲染并净化）
10. `use_markdown BOOLEAN NOT NULL DEFAULT TRUE`
11. `status TEXT NOT NULL DEFAULT 'approved'`（`approved|pending|deleted|spam`）
12. `edit_token_hash TEXT NOT NULL`（匿名编辑凭据）
13. `ip INET`、`user_agent TEXT`（风控）
14. `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
15. `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
16. `edited_at TIMESTAMPTZ`

索引建议：

1. `(post_slug, status, created_at DESC)`
2. `(parent_id, created_at ASC)`
3. `(author_email_hash)`

### 表 2：`comment_edit_history`（建议首版一起上）

1. `id BIGSERIAL PRIMARY KEY`
2. `comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE`
3. `content_raw TEXT NOT NULL`
4. `content_html TEXT NOT NULL`
5. `edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 表 3：`comment_votes`（第二阶段）

1. `comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE`
2. `fingerprint_hash TEXT NOT NULL`
3. `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
4. `UNIQUE(comment_id, fingerprint_hash)`

## 4.2 API 设计（Next App Router）

建议新增：

1. `GET /api/comments?slug=xxx`  
返回评论树 + 计数 + 分页信息。
2. `POST /api/comments`  
提交评论（支持 parent_id 回复、markdown、captcha 校验）。
3. `PATCH /api/comments/[id]`  
编辑评论（校验 edit_token）。
4. `GET /api/comments/[id]/history`  
返回编辑历史（可选开启）。
5. `POST /api/comments/[id]/vote`（第二阶段）  
点赞防刷（fingerprint）。

响应规范沿用现有项目风格：`{ ok, ... }` + `NextResponse.json`。

## 4.3 验证码方案（首版）

采用“无状态算式验证码”来贴近目标站：

1. 服务端生成算式（如 `63 / 7 = ?`）和 `captcha_seed`（HMAC 签名）。
2. 表单提交时带 `captcha` + `captcha_seed`。
3. 服务端校验后返回下一题（前端更新 `post-comment-captcha-container:before` 内容）。

优点：不需要额外 captcha 表，部署简单，体验接近目标站。

## 4.4 前端组件拆分（替换现有壳组件）

建议替换 `ArgonCommentShell` 为真实模块：

1. `CommentSection.jsx`（容器，加载评论 + 状态管理）
2. `CommentList.jsx`（树结构渲染）
3. `CommentItem.jsx`（单条评论，支持回复/编辑入口）
4. `CommentForm.jsx`（发送/编辑/回复统一表单）
5. `EmotionKeyboard.jsx`（分组表情面板）
6. `commentApi.js`（前端请求封装）

样式策略：

1. 保留与目标一致的关键选择器（如 `#post_comment_content`、`.emotion-keyboard`），提升还原速度。
2. 将新样式集中在 `app/globals.css` 的独立 comment 段，替换当前 `nh-comment-*` 演示样式。

## 5. 分阶段开发计划（可执行）

## Phase 0：确认需求边界（你确认后开工）

需你确认：

1. 首版评论是否默认 `approved`（免审核）？
2. 是否首版就做“点赞”和“编辑历史弹窗”？
3. 是否保留“私密评论 / 邮件提醒”入口（目标站支持，可选）？

## Phase 1：数据库与数据访问层

1. 更新 `db/schema.sql` 增加 `comments`、`comment_edit_history`（可选 `comment_votes`）。
2. 新增 `src/lib/comments.js`（查询树、插入、编辑、历史写入）。
3. 本地 SQL 自检与空库容错。

验收：

1. 能独立插入评论与回复。
2. 能按 `post_slug` 拉取树形结构。

## Phase 2：API 路由

1. 新增 `app/api/comments/*` 路由。
2. 接入验证码生成与校验。
3. 输入校验与防注入（长度、格式、URL、邮箱）。

验收：

1. `POST` 正常提交并返回新评论。
2. 非法数据返回 400 且错误信息明确。

## Phase 3：前端高还原 UI

1. 替换 `ArgonCommentShell`。
2. 还原发送/编辑/回复态切换。
3. 还原表情面板分组与插入行为。
4. 还原附加字段折叠与 markdown 开关。

验收：

1. UI 与目标页结构、视觉、动效接近（主观相似度 >= 90%）。
2. 评论发送、回复、编辑全链路可用。

## Phase 4：页面集成与计数

1. 在 `app/blog/[slug]/page.jsx` 接入真实评论数据。
2. `PostCard` 评论数改为真实计数（替换当前 hash mock）。

验收：

1. 列表评论数与详情页一致。
2. 新评论发布后列表计数能更新。

## Phase 5：自主测试与验收包

自动与手工验证：

1. `pnpm lint`
2. `pnpm build`
3. API smoke test（GET/POST/PATCH）
4. 关键交互回归（回复、编辑、取消、验证码、表情）

交付你验收：

1. 变更文件清单
2. 自测结果
3. 已知限制与后续优化项

## 6. 风险与规避

1. 匿名编辑身份：  
用 `edit_token`（cookie + hash）控制“仅本人可编辑”，避免仅靠昵称邮箱导致冒名。
2. XSS 风险：  
Markdown 渲染后服务端净化，禁止危险标签/属性。
3. 评论刷屏：  
基于 IP + 指纹做限频（可先轻量实现）。
4. 递归过深：  
限制最大回复深度（建议 3~5 层）。

## 7. 本方案对应的项目文件变更范围（预估）

预计新增/修改：

1. `db/schema.sql`
2. `src/lib/comments.js`（新增）
3. `app/api/comments/route.js`（新增）
4. `app/api/comments/[id]/route.js`（新增）
5. `src/components/argon/ArgonCommentShell.jsx`（替换为真实实现或拆分）
6. `src/components/comments/*`（新增目录，推荐）
7. `app/globals.css`（评论区样式段替换）
8. `app/blog/[slug]/page.jsx`
9. `src/components/PostCard.jsx`（评论数来源替换）

## 8. 参考来源

1. 目标页面：  
`https://www.nighthaven.cn:8660/tsserverbuild/`
2. 主题样式：  
`https://www.nighthaven.cn:8660/wp-content/themes/argon/style.css?ver=1.3.5`  
`https://www.nighthaven.cn:8660/wp-content/themes/argon/assets/argon_css_merged.css?ver=1.3.5`
3. 主题脚本：  
`https://www.nighthaven.cn:8660/wp-content/themes/argon/argontheme.js?v1.3.5`
4. 主题评论模板（源码对照）：  
`https://cdn.jsdelivr.net/gh/solstice23/argon-theme@1.3.5/comments.php`  
`https://cdn.jsdelivr.net/gh/solstice23/argon-theme@1.3.5/template-parts/emotion-keyboard.php`
