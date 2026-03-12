# Change: 新增统一后台管理系统

## Why

当前项目的管理功能分散且缺乏统一入口：评论管理页面 (`/admin/comments`) 内嵌了独立的登录逻辑，写作后台 (`/write`) 使用另一套认证系统。两套认证方案安全性不一致——Admin 认证仅依赖 JSON 反序列化检查过期时间，不验证 token 真实性（理论上可伪造）；而 Write 认证使用 HMAC 签名，安全性更高。此外没有统一的导航和布局，后续新增管理功能（文章管理等）会进一步加剧混乱。

## What Changes

- **新增** `/admin/login` 独立登录页面，替代内嵌登录表单
- **新增** `/admin` 后台 Layout（左侧导航栏 + 顶栏 + 内容区），采用经典左右分栏布局
- **新增** 数据驱动的导航配置系统，支持后续轻松扩展导航项
- **新增** Next.js `middleware.js` 统一路由守卫，拦截所有 `/admin` (除 `/admin/login`) 未登录请求
- **新增** `/admin` 仪表盘首页，展示基础统计信息（文章数、评论数等）
- **新增** `/admin/posts` 文章管理页面（列表、搜索、状态管理）
- **重构** Admin 认证系统：**BREAKING** 废弃旧的纯 JSON session 方案，升级为与 Write 系统一致的 HMAC 签名方案
- **重构** 现有评论管理页面：剥离内嵌登录逻辑，适配新 Layout

## Impact

- Affected specs: `admin-dashboard` (新增)
- Affected code:
  - `app/admin/` — 整个目录重构，新增 layout.jsx、login/page.jsx、page.jsx、posts/page.jsx
  - `src/lib/adminAuth.js` — **BREAKING** 重写认证逻辑，切换到 HMAC 签名
  - `src/components/admin/` — 新增 AdminSidebar、AdminHeader、adminNav 等组件
  - `middleware.js` — 新增或修改，添加 `/admin` 路由守卫
  - `app/api/admin/login/route.js` — 重写，返回 HMAC 签名 session cookie
  - `app/api/admin/comments/route.js` — 更新认证检查方式
  - `app/admin/comments/page.jsx` — 剥离登录逻辑，仅保留业务代码
