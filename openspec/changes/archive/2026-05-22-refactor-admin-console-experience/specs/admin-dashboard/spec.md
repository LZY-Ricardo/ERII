## ADDED Requirements

### Requirement: Unified Admin Visual System

后台 SHALL 提供统一的视觉系统，用于覆盖仪表盘、文章、评论、项目、设置与登录页，确保卡片、工具栏、列表、状态和反馈风格一致。

#### Scenario: Shared container styles

- **WHEN** 用户访问任一后台页面
- **THEN** 页面使用统一的后台容器、卡片、工具栏和状态样式
- **AND** 页面之间的边距、圆角、边框、背景和焦点态保持一致

#### Scenario: Consistent loading and empty states

- **WHEN** 后台页面处于加载中或无数据状态
- **THEN** 页面显示统一风格的加载态或空状态
- **AND** 不同页面的反馈语义保持一致

### Requirement: Admin Workspace Layout Refresh

后台 SHALL 提供更清晰的工作台布局，包括稳定的导航区、上下文头部和适配桌面端与移动端的内容容器。

#### Scenario: Desktop workspace layout

- **WHEN** 用户在桌面端访问后台
- **THEN** 左侧导航区、顶部上下文区和主内容区形成稳定层级
- **AND** 主内容区具有统一的最大宽度、留白和滚动行为

#### Scenario: Mobile workspace layout

- **WHEN** 用户在移动端访问后台
- **THEN** 导航与内容区能够在不遮挡核心操作的前提下完成切换
- **AND** 主要操作按钮和筛选区仍然可访问

### Requirement: Dashboard Workbench

后台首页 SHALL 以工作台形式展示概览指标、待处理事项和最近动态，而不是仅展示静态统计卡片。

#### Scenario: Pending work visibility

- **WHEN** 用户访问 `/admin`
- **THEN** 页面展示待审核评论、最近草稿或最近活跃内容等待处理信息
- **AND** 用户可以从首页直接进入对应管理动作

#### Scenario: Recent activity visibility

- **WHEN** 首页存在最新评论或最近变更数据
- **THEN** 页面展示最近动态列表
- **AND** 每条动态都提供明确的下一步入口

### Requirement: Efficient Content Management Lists

后台文章、评论和项目列表 SHALL 提供统一的筛选、搜索、状态表达和高频操作体验。

#### Scenario: Toolbar consistency

- **WHEN** 用户进入文章、评论或项目管理页
- **THEN** 页面顶部展示统一风格的工具栏
- **AND** 工具栏中包含当前页核心筛选、搜索与快捷操作

#### Scenario: Row action clarity

- **WHEN** 列表渲染每一行数据
- **THEN** 行级状态、辅助信息和主操作入口具有明确主次关系
- **AND** 用户可快速识别下一步动作

### Requirement: Structured Settings Experience

后台设置页 SHALL 采用分区控制台式布局，提升配置项的分组清晰度与保存反馈可见性。

#### Scenario: Sectioned settings

- **WHEN** 用户访问 `/admin/settings`
- **THEN** 设置项按主题分区展示
- **AND** 每个分区具有标题、说明和一致的字段样式

#### Scenario: Save feedback

- **WHEN** 用户保存设置
- **THEN** 页面展示明确且一致的保存结果反馈

