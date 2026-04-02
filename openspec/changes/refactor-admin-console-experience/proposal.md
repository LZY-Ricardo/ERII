# Change: 重构后台管理体验与操作流

## Why

当前后台管理系统虽然已经具备仪表盘、文章、评论、项目、设置等基础能力，但整体仍停留在“功能可用、体验粗糙”的阶段。主要问题集中在三个方面：

- 视觉语言不统一：管理后台沿用默认浅色卡片和表格样式，缺少明确的层级、重点区和流畅反馈，和站点已有的品牌感脱节。
- 信息架构偏平：仪表盘、文章、评论、项目和设置页各自独立实现，页面结构和交互模式不一致，管理动作缺乏统一入口与批量操作流。
- 编辑与管理链路割裂：`/write` 已有自动保存、草稿箱和元信息面板，但与 `/admin` 后台的管理列表、筛选、快捷跳转还没有形成完整闭环。

如果继续在现有页面上零散叠加功能，后续可维护性和操作效率都会继续下降。

## What Changes

- **重构** `/admin` 视觉系统，建立统一的后台主题变量、卡片、表格、筛选栏、操作栏和状态组件。
- **重构** `/admin` 布局与导航，优化侧边栏、顶部区域、内容容器和移动端交互，使后台有更稳定的信息层级与工作台感。
- **重构** `/admin` 仪表盘首页，从“统计卡片堆叠”升级为“概览 + 待处理事项 + 最近动态”的工作台。
- **重构** `/admin/posts` 文章管理页，优化筛选、搜索、状态识别、快捷编辑和高频操作路径。
- **重构** `/admin/comments` 评论管理页，强化列表可读性、详情查看和审核动作的反馈一致性。
- **重构** `/admin/projects` 与 `/admin/settings` 页面，使其从“长表单/普通表格”升级为更清晰的配置台和资源管理台。
- **扩展** 后台统一操作能力：增加更清晰的批量筛选、状态提示、快捷入口、空状态、加载骨架和成功/失败反馈。
- **扩展** `/write` 与 `/admin` 的联动，补齐从写作页进入后台管理页的工作流一致性，并为后续更多后台快捷操作预留模式。

## Impact

- Affected specs:
  - `admin-dashboard`
  - `write-editor`
- Affected code:
  - `app/admin/layout.jsx`
  - `app/admin/page.jsx`
  - `app/admin/posts/page.jsx`
  - `app/admin/comments/page.jsx`
  - `app/admin/projects/page.jsx`
  - `app/admin/projects/[id]/page.jsx`
  - `app/admin/settings/page.jsx`
  - `app/admin/login/page.jsx`
  - `src/components/admin/*`
  - `src/components/WritePageV2.jsx`
  - `app/globals.css`

## Non-Goals

- 本轮不重做后台认证模型，不引入 RBAC、多用户或权限矩阵。
- 本轮不改数据库 schema，不增加高风险数据迁移。
- 本轮不引入新的重量级 UI 组件库。
- 本轮不直接改公开站点的 Argon/Nighthaven 视觉系统。
