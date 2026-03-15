## ADDED Requirements

### Requirement: Published Post Working Draft Persistence

系统 MUST 允许已发布文章的未发布修改以独立工作草稿形式保存，而不影响线上已发布内容。

#### Scenario: 已发布文章修改后自动进入工作草稿

- **GIVEN** 用户已打开一篇状态为 `published` 的文章进入 `/write`
- **WHEN** 用户修改正文或元数据并触发自动保存或关闭页面前保存
- **THEN** 系统将修改保存到该文章对应的工作草稿
- **AND** `posts` 表中的已发布记录保持 `published`
- **AND** 公开博客仍继续展示原始已发布内容

#### Scenario: 重新打开编辑页优先恢复工作草稿

- **GIVEN** 一篇已发布文章已经存在未发布的工作草稿
- **WHEN** 用户再次访问 `/write?slug=<published-slug>`
- **THEN** 编辑器优先加载工作草稿内容
- **AND** 页面明确标识当前修改尚未发布

### Requirement: Working Draft Visibility In Draft Inbox

系统 MUST 在草稿箱中展示已发布文章的工作草稿，以便用户继续编辑。

#### Scenario: 草稿箱展示已发布文章修改稿

- **GIVEN** 一篇已发布文章存在未发布工作草稿
- **WHEN** 用户访问 `/admin/posts?tab=draft`
- **THEN** 草稿列表中出现该工作草稿
- **AND** 该条目可继续进入编辑页
- **AND** 条目显示其属于“已发布文章修改稿”

### Requirement: Publish Working Draft To Replace Published Content

系统 MUST 在用户手动发布时，使用工作草稿内容更新原已发布文章，并清理对应工作草稿。

#### Scenario: 发布工作草稿后更新线上文章

- **GIVEN** 一篇已发布文章存在未发布工作草稿
- **WHEN** 用户在编辑器中点击“更新文章”或“发布”
- **THEN** 系统使用当前工作草稿内容更新原发布稿
- **AND** 公开博客在刷新缓存后展示新内容
- **AND** 对应工作草稿被删除或标记为已清理
