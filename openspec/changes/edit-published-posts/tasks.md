# Tasks: Edit Published Posts

## Implementation Tasks

- [x] **修改 WritePageV2 组件状态管理**
   - 添加 `postStatus` 状态变量跟踪当前文章状态
   - 在 `loadDraft` 函数中保存文章状态
   - 验证:检查组件状态是否正确保存文章状态

- [x] **修改发布按钮逻辑**
   - 更新 `handlePublish` 函数,根据 `postStatus` 决定调用哪个 API
   - 已发布文章:调用 `/api/write/posts/publish` (已支持 upsert)
   - 草稿文章:调用 `/api/write/posts/publish` (创建新发布)
   - 验证:测试草稿发布和已发布文章更新

- [x] **测试完整流程**
   - 测试草稿文章首次发布
   - 测试已发布文章二次编辑和更新
   - 测试编辑后保存为草稿
   - 验证:所有场景都能正常工作
