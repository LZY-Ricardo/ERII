## ADDED Requirements

### Requirement: Admin And Editor Flow Consistency

写作页 SHALL 与后台管理页保持一致的快捷入口与状态认知，帮助用户在编辑和管理之间顺畅切换。

#### Scenario: Draft management shortcut

- **WHEN** 用户在 `/write` 需要进入后台管理草稿
- **THEN** 页面提供清晰可见的后台草稿入口
- **AND** 跳转目标与后台草稿视图保持一致

#### Scenario: Shared management cues

- **WHEN** 用户在 `/write` 查看自动保存或后台联动信息
- **THEN** 页面中的状态提示与后台管理页的语义表达保持一致
