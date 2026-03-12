## 1. 认证系统升级

- [ ] 1.1 提取 `writeAuth.js` 中的 HMAC 签名/验签逻辑为共享工具函数（`src/lib/sessionCrypto.js`）
- [ ] 1.2 重写 `src/lib/adminAuth.js`，使用共享 HMAC 签名方案，cookie 名改为 `erii_admin_session`
- [ ] 1.3 重写 `/api/admin/login/route.js`，返回 HMAC 签名 session cookie
- [ ] 1.4 更新所有 `/api/admin/*` route handlers，使用新的认证验证函数

## 2. Middleware 路由守卫

- [ ] 2.1 创建或更新根目录 `middleware.js`，拦截 `/admin` 路径（排除 `/admin/login`）
- [ ] 2.2 页面请求未认证时 302 重定向到 `/admin/login`
- [ ] 2.3 API 请求 (`/api/admin/*`) 未认证时返回 401 JSON

## 3. 管理后台 Layout 和组件

- [ ] 3.1 创建导航配置文件 `src/components/admin/adminNav.js`
- [ ] 3.2 创建侧边栏组件 `src/components/admin/AdminSidebar.jsx`（Logo、导航项、返回前台链接）
- [ ] 3.3 创建顶栏组件 `src/components/admin/AdminHeader.jsx`（页面标题、登出按钮、移动端菜单触发）
- [ ] 3.4 创建 `app/admin/layout.jsx`（组合 Sidebar + Header + 内容区，处理登录页特殊路径）

## 4. 登录页面

- [ ] 4.1 创建 `app/admin/login/page.jsx`（独立全屏登录页，不套 admin layout 侧边栏）
- [ ] 4.2 实现密码输入、提交、错误提示、登录成功后跳转到 `/admin`

## 5. 仪表盘首页

- [ ] 5.1 创建 `/api/admin/stats/route.js`（返回文章数、评论数等统计数据）
- [ ] 5.2 创建 `app/admin/page.jsx`（仪表盘页面，展示统计卡片）

## 6. 迁移评论管理页

- [ ] 6.1 重构 `app/admin/comments/page.jsx`，剥离内嵌的 `LoginForm` 和认证状态逻辑
- [ ] 6.2 保留评论列表、筛选、操作等业务逻辑不变

## 7. 文章管理页

- [ ] 7.1 创建 `app/admin/posts/page.jsx`（文章列表，支持按状态筛选：已发布/草稿/全部）
- [ ] 7.2 每篇文章显示标题、状态、创建时间，提供「编辑」跳转到 `/write?slug=xxx`

## 8. 移动端适配

- [ ] 8.1 侧边栏在移动端默认隐藏，通过汉堡菜单按钮触发抽屉式展开
- [ ] 8.2 抽屉展开时显示半透明遮罩层，点击遮罩可关闭

## 9. 验证和收尾

- [ ] 9.1 手动验证完整登录 → 仪表盘 → 评论管理 → 文章管理流程
- [ ] 9.2 验证未登录访问任意 `/admin` 页面均被重定向到登录页
- [ ] 9.3 验证 API 路由 `/api/admin/*` 未认证返回 401
- [ ] 9.4 验证移动端侧边栏交互正常
