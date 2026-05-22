# Proposal: Edit Published Posts

## Problem
已发布的文章无法进行二次编辑。虽然文章详情页已经显示"编辑"链接,并且可以跳转到 `/write?slug=xxx`,但编辑器的"发布"按钮总是创建新的发布记录,而不是更新现有的已发布文章。

## Current Behavior
- 文章详情页有 `PostEditLink` 组件显示"编辑"链接(仅对已认证用户可见)
- 点击"编辑"跳转到 `/write?slug=xxx`
- `WritePageV2` 可以加载已发布文章的内容
- 但点击"发布"按钮会调用 `/api/write/posts/publish`,总是创建新的发布记录

## Proposed Solution
修改 `WritePageV2` 组件,使其能够识别当前编辑的文章状态:
- 如果是草稿,点击"发布"创建新的发布记录
- 如果是已发布文章,点击"发布"更新现有的发布记录

## Scope
- 修改 `WritePageV2` 组件,添加文章状态跟踪
- 修改发布逻辑,根据文章状态调用不同的 API
- 保持现有的 API 路由不变(已支持 upsert 操作)

## Out of Scope
- 不修改草稿保存逻辑
- 不修改 API 路由实现
- 不添加版本历史功能
