## ADDED Requirements

### Requirement: Draft Auto-save

系统 SHALL 在 `/write` 为草稿提供自动保存能力，自动保存结果与手动「草稿」按钮一致。

#### Scenario: 停顿后自动保存

- **WHEN** 已登录用户在编辑器内修改内容或元信息并停止输入 5 秒
- **THEN** 系统自动调用 `/api/write/posts` 保存草稿
- **AND** 若为首次保存，使用返回的 slug 更新 URL（`/write?slug=<article-slug>`）
- **AND** 页面显示非阻塞状态提示（例如“自动保存中…/已自动保存”）

#### Scenario: 空白草稿不保存

- **WHEN** 标题与正文内容均为空
- **THEN** 自动保存不触发，不创建草稿记录

#### Scenario: 未登录不自动保存

- **WHEN** 用户未登录
- **THEN** 自动保存不触发，并提示“未登录，自动保存不可用”
