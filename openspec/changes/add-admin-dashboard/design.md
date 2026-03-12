## Context

项目需要一个统一的后台管理系统，解决当前管理功能分散、认证不一致的问题。参考了 shadcn/ui Dashboard、cruip/Mosaic、horizon-ui 等高 star 开源项目的 UI 方案，结合项目现有技术栈（Next.js 16 + Tailwind CSS 4 + lucide-react）设计轻量级自研方案。

## Goals / Non-Goals

- Goals:
  - 统一的后台管理入口和布局系统
  - 安全一致的认证方案（HMAC 签名）
  - 数据驱动的导航配置，易于扩展
  - 移动端响应式支持
  - 平滑迁移现有评论管理功能
- Non-Goals:
  - 不引入额外 UI 框架（不用 shadcn/ui 组件库，纯 Tailwind 自研）
  - 不实现 RBAC 多角色权限（单用户管理员即可）
  - 不实现实时通知/WebSocket 推送
  - 不在此阶段实现 dark mode（后续可扩展）

## Decisions

### 1. 认证方案：统一为 HMAC 签名

- **Decision**: 废弃 `adminAuth.js` 中的纯 JSON session 方案，将其重写为复用 `writeAuth.js` 相同的 HMAC 签名逻辑
- **Why**: 当前 Admin session 仅通过 JSON 反序列化检查 `expiresAt` 字段，不验证 token 真实性，攻击者可构造合法 JSON 绕过认证。HMAC 方案已在 Write 系统验证可靠。
- **Alternatives considered**:
  - (a) 完全合并为一套 session → 弃用，因为 admin 和 write 的 session 生命周期和用途不同，分开管理更清晰
  - (b) JWT → 过重，项目只有单用户场景
- **Implementation**: 从 `writeAuth.js` 提取签名/验签逻辑为共享工具函数，`adminAuth.js` 调用共享函数生成 admin 专属 cookie (`erii_admin_session`)

### 2. 路由守卫：Next.js Middleware

- **Decision**: 使用 `middleware.js` 拦截 `/admin` 路径（排除 `/admin/login`），未认证时 302 重定向到 `/admin/login`
- **Why**: 比在每个页面/API 内联验证更集中、更不易遗漏
- **Alternatives considered**:
  - (a) 在 `layout.jsx` 中做服务端检查 → 可行但仅保护页面不保护 API
  - (b) 每个 route handler 内联检查 → 当前方案，容易遗漏
- **Note**: API 路由 `/api/admin/*` 也受 middleware 保护，返回 401 JSON 而非重定向

### 3. 布局架构：App Router 嵌套 Layout

- **Decision**: 创建 `app/admin/layout.jsx` 作为管理后台壳层，登录页 `app/admin/login/page.jsx` 通过条件渲染绕过壳层
- **Layout structure**:
  ```
  app/admin/layout.jsx        ← AdminAuthGuard + Sidebar + Header
  app/admin/login/page.jsx    ← 独立登录页（不受 layout 侧边栏影响）
  app/admin/page.jsx          ← 仪表盘
  app/admin/comments/page.jsx ← 评论管理
  app/admin/posts/page.jsx    ← 文章管理
  ```
- **Why**: Next.js App Router 的嵌套 layout 天然支持这种结构，无需额外路由库

### 4. 导航系统：配置数组驱动

- **Decision**: 使用 `src/components/admin/adminNav.js` 配置文件定义导航项
  ```js
  export const adminNavMain = [
    { title: "仪表盘", href: "/admin", icon: LayoutDashboard },
    { title: "评论管理", href: "/admin/comments", icon: MessageSquare },
    { title: "文章管理", href: "/admin/posts", icon: FileText },
  ];
  ```
- **Why**: 参考 shadcn/ui dashboard 的数据驱动模式，新增页面只需加一行配置
- **Alternatives considered**: 文件系统自动发现 → 过于隐式，不利于控制顺序和图标

### 5. UI 方案：纯 Tailwind 自研

- **Decision**: 不引入 shadcn/ui 组件库，使用项目已有的 Tailwind CSS 4 + lucide-react 自研管理后台 UI
- **Why**: 项目为个人博客，管理后台使用频率低，引入完整 UI 框架得不偿失；Tailwind 已足够构建所需 UI
- **Visual spec** (参考 shadcn Dashboard-03 简洁风格):
  - 侧边栏：`w-64` 固定宽度，`bg-white border-r`，顶部 Logo，底部「返回前台」链接
  - 顶栏：`h-14 sticky top-0 border-b`，显示当前页面标题
  - 激活菜单项：左侧 2px 品牌色竖线 + 文字加粗 + 浅色背景
  - 内容区：`flex-1 overflow-auto p-6 bg-gray-50`
  - 移动端：侧边栏变为抽屉式 overlay

### 6. 文章管理 API：复用现有 write API

- **Decision**: `/admin/posts` 页面直接调用已有的 `/api/write/posts` API
- **Why**: 写作后台已有完整的文章 CRUD API，无需重复构建
- **Note**: admin session 和 write session 是独立的，需要 API 路由同时接受两种 session

## Risks / Trade-offs

- **BREAKING**: Admin session cookie 格式变更，现有已登录的 admin session 将失效，需重新登录
  - Mitigation: 这是个人项目，影响面仅为管理员自己
- **两套 session 并存**: admin 和 write 使用不同 cookie，可能造成用户困惑
  - Mitigation: 后续可考虑合并，但当前分离更安全
- **Middleware 性能**: 每个 `/admin` 请求都经过 middleware 验签
  - Mitigation: HMAC 验签开销极小（微秒级），不构成瓶颈

## Migration Plan

1. 重写 `adminAuth.js`，新旧 session 格式不兼容，但降级安全（旧 cookie 直接视为无效，需重新登录）
2. 创建新的 layout、组件和页面文件
3. 改造现有 `app/admin/comments/page.jsx`，剥离登录逻辑
4. 更新 `/api/admin/login` 返回新格式 session
5. 更新所有 `/api/admin/*` 路由使用新的验证函数
6. 添加 middleware 路由守卫

## Open Questions

- 是否需要在仪表盘首页展示更多统计数据（如近7天评论趋势、文章阅读量）？当前方案仅展示基础计数。
- 后续是否需要合并 admin session 和 write session 为一套？
