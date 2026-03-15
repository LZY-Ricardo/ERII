# Task Plan

## Goal

实现“已发布文章的未发布修改进入草稿箱，但不影响线上已发布内容；只有手动发布后才更新博客内容”。

## Phases

- [complete] 1. 梳理现有写作/发布/草稿数据流与约束
- [complete] 2. 设计已发布文章的独立编辑草稿模型与接口
- [complete] 3. 编写 OpenSpec 变更提案与任务清单
- [complete] 4. 提案获批后实施后端与前端改动
- [in_progress] 5. 验证编辑、关闭、草稿箱、重新发布全流程

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `openspec/specs/write-editor/spec.md` 不存在 | 1 | 改为读取 `openspec/changes/` 下现有变更说明，项目当前尚无归档 specs |

## Notes

- 当前仓库存在未归档变更：`add-admin-dashboard`、`edit-published-posts`
- 当前工作区有用户已有未提交改动，避免触碰无关文件
