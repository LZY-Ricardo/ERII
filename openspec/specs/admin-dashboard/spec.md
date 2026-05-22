# admin-dashboard Specification

## Purpose
TBD - created by archiving change add-admin-post-quick-category-switch. Update Purpose after archive.
## Requirements
### Requirement: Admin Posts Quick Category Switch

系统 MUST 在 `/admin/posts` 文章管理列表中提供快捷切换分类的能力，使管理员无需进入 `/write` 编辑页即可调整分类并立即保存。

#### Scenario: 管理员在已发布文章列表中切换分类

- **Given** 管理员已登录后台
- **And** 存在一篇状态为 `published` 的文章
- **When** 管理员在 `/admin/posts` 的该文章行内切换分类
- **Then** 系统保存新的分类
- **And** 列表中该文章的分类展示立即更新

#### Scenario: 管理员在草稿箱列表中切换分类

- **Given** 管理员已登录后台
- **And** 存在一篇状态为 `draft` 的文章
- **When** 管理员在 `/admin/posts?tab=draft` 的该文章行内切换分类
- **Then** 系统保存新的分类
- **And** 列表中该文章的分类展示立即更新

#### Scenario: 管理员在“已发布文章修改稿”中切换分类

- **Given** 管理员已登录后台
- **And** 存在一篇已发布文章的未发布修改稿（working draft）
- **When** 管理员在 `/admin/posts?tab=draft` 的该修改稿行内切换分类
- **Then** 系统保存新的分类到该修改稿
- **And** 线上已发布文章的分类不受影响

#### Scenario: 保存失败回滚

- **Given** 管理员正在在列表中切换某篇文章的分类
- **When** 保存请求失败
- **Then** 系统将该行分类回滚到切换前的值
- **And** 提示管理员保存失败原因

