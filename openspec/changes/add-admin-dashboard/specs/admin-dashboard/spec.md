## ADDED Requirements

### Requirement: Admin Authentication

系统 SHALL 提供基于 HMAC 签名的管理后台认证机制，使用 `ERII_WRITE_PASSWORD` 环境变量作为密码源，`ERII_WRITE_SESSION_SECRET` 作为签名密钥。session 以 HttpOnly cookie (`erii_admin_session`) 存储，有效期 7 天。

#### Scenario: 登录成功

- **WHEN** 用户在 `/admin/login` 页面提交正确密码
- **THEN** 服务端生成 HMAC 签名 session，设置 `erii_admin_session` HttpOnly cookie
- **AND** 用户被重定向到 `/admin`

#### Scenario: 登录失败

- **WHEN** 用户提交错误密码
- **THEN** 返回错误提示，不设置 session cookie

#### Scenario: Session 过期

- **WHEN** session cookie 已过期（超过 7 天）
- **THEN** 用户被重定向到 `/admin/login`

#### Scenario: 登出

- **WHEN** 用户点击登出按钮
- **THEN** `erii_admin_session` cookie 被清除
- **AND** 用户被重定向到 `/admin/login`

### Requirement: Admin Route Guard

系统 SHALL 通过 Next.js middleware 拦截所有 `/admin` 路径（排除 `/admin/login`），对未认证请求进行访问控制。

#### Scenario: 未登录访问管理页面

- **WHEN** 未认证用户访问 `/admin` 或 `/admin/*`（非 `/admin/login`）
- **THEN** 返回 302 重定向到 `/admin/login`

#### Scenario: 未登录访问管理 API

- **WHEN** 未认证请求访问 `/api/admin/*`（非 `/api/admin/login`）
- **THEN** 返回 HTTP 401 JSON 响应 `{ ok: false, error: "Unauthorized" }`

#### Scenario: 已登录访问管理页面

- **WHEN** 持有有效 `erii_admin_session` cookie 的用户访问 `/admin/*`
- **THEN** 请求正常通过，渲染对应页面

### Requirement: Admin Dashboard Layout

系统 SHALL 提供经典左右分栏布局的管理后台界面，包含固定左侧导航栏、顶部信息栏和主内容区域。

#### Scenario: 桌面端布局

- **WHEN** 用户在桌面端（≥1024px）访问管理后台
- **THEN** 左侧显示 256px 宽的固定导航栏
- **AND** 右侧显示顶栏 + 主内容区域
- **AND** 顶栏显示当前页面标题和登出按钮

#### Scenario: 移动端布局

- **WHEN** 用户在移动端（<1024px）访问管理后台
- **THEN** 导航栏默认隐藏
- **AND** 顶栏显示汉堡菜单按钮
- **WHEN** 用户点击汉堡菜单按钮
- **THEN** 导航栏以抽屉式覆盖层展开，带半透明遮罩

#### Scenario: 导航项高亮

- **WHEN** 用户位于某个管理页面
- **THEN** 对应的导航项显示激活状态（加粗 + 高亮背景 + 左侧品牌色竖线）

### Requirement: Admin Navigation Configuration

系统 SHALL 使用数据驱动的导航配置，通过配置数组定义导航项（标题、路径、图标），支持后续扩展。

#### Scenario: 导航项渲染

- **WHEN** 管理后台 Layout 渲染侧边栏
- **THEN** 按配置数组顺序渲染所有导航项，每项包含图标和标题文字

#### Scenario: 新增导航项

- **WHEN** 开发者需要新增管理页面
- **THEN** 仅需在配置数组中添加一条 `{ title, href, icon }` 记录
- **AND** 侧边栏自动渲染新导航项

### Requirement: Admin Dashboard Home

系统 SHALL 在 `/admin` 路径提供仪表盘首页，展示博客基础统计信息。

#### Scenario: 统计数据展示

- **WHEN** 已认证用户访问 `/admin`
- **THEN** 页面显示统计卡片，至少包含：已发布文章数、草稿文章数、总评论数、待审核评论数

#### Scenario: 统计数据 API

- **WHEN** 前端请求 `/api/admin/stats`
- **THEN** 返回 JSON 格式的统计数据 `{ ok: true, stats: { publishedPosts, draftPosts, totalComments, pendingComments } }`

### Requirement: Admin Comments Management

系统 SHALL 在 `/admin/comments` 路径提供评论管理功能，支持查看、筛选、审批、删除、标记垃圾评论。该页面 SHALL 不包含任何认证 UI 逻辑（认证由 Layout 和 middleware 统一处理）。

#### Scenario: 评论列表展示

- **WHEN** 用户访问 `/admin/comments`
- **THEN** 显示所有评论列表，支持按状态筛选（全部/已批准/待审核/垃圾评论）

#### Scenario: 认证逻辑剥离

- **WHEN** 评论管理页面渲染
- **THEN** 页面组件中不包含登录表单或认证状态检查代码
- **AND** 所有认证保护由 middleware 和 admin layout 统一提供

### Requirement: Admin Posts Management

系统 SHALL 在 `/admin/posts` 路径提供文章管理功能，展示文章列表并支持基本操作。

#### Scenario: 文章列表展示

- **WHEN** 用户访问 `/admin/posts`
- **THEN** 显示所有文章列表，包含标题、状态（已发布/草稿）、创建时间
- **AND** 支持按状态筛选

#### Scenario: 编辑文章跳转

- **WHEN** 用户点击文章的「编辑」按钮
- **THEN** 跳转到 `/write?slug=<article-slug>` 进入写作编辑器

### Requirement: Admin Login Page

系统 SHALL 在 `/admin/login` 提供独立的全屏登录页面，不显示管理后台的侧边栏和顶栏。

#### Scenario: 登录页布局

- **WHEN** 用户访问 `/admin/login`
- **THEN** 显示居中的登录表单，包含密码输入框和登录按钮
- **AND** 不显示管理后台的侧边栏和顶栏

#### Scenario: 已登录用户访问登录页

- **WHEN** 已认证用户访问 `/admin/login`
- **THEN** 自动重定向到 `/admin`
