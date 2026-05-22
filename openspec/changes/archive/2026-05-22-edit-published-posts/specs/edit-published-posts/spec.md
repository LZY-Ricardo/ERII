# Spec: Edit Published Posts

## ADDED Requirements

### Requirement: 已发布文章可以二次编辑

系统 MUST 允许用户对已发布的文章进行二次编辑和更新,支持重新发布或保存为草稿。

#### Scenario: 用户点击已发布文章的"编辑"链接
- **Given** 用户已通过写作权限认证
- **And** 存在一篇状态为 `published` 的文章
- **When** 用户在文章详情页点击"编辑"链接
- **Then** 跳转到 `/write?slug=xxx` 编辑页面
- **And** 编辑器加载文章的完整内容和元数据
- **And** 编辑器识别文章状态为 `published`

#### Scenario: 用户更新已发布文章并重新发布
- **Given** 用户正在编辑一篇状态为 `published` 的文章
- **When** 用户修改文章内容
- **And** 点击"发布"按钮
- **Then** 调用 `/api/write/posts/publish` API
- **And** API 更新现有的已发布文章记录(upsert 操作)
- **And** 显示"发布成功"提示
- **And** 文章状态保持为 `published`

#### Scenario: 用户将已发布文章保存为草稿
- **Given** 用户正在编辑一篇状态为 `published` 的文章
- **When** 用户修改文章内容
- **And** 点击"草稿"按钮
- **Then** 调用 `/api/write/posts` API
- **And** API 将文章状态更新为 `draft`
- **And** 显示"草稿已保存"提示

#### Scenario: 用户首次发布草稿文章
- **Given** 用户正在编辑一篇状态为 `draft` 的文章
- **When** 用户点击"发布"按钮
- **Then** 调用 `/api/write/posts/publish` API
- **And** API 创建新的发布记录或更新现有记录
- **And** 显示"发布成功"提示
- **And** 文章状态变为 `published`
