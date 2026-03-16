## ADDED Requirements

### Requirement: Juejin Public Article Import

系统 SHALL 允许已通过写作鉴权的用户，从公开掘金作者主页或公开文章链接导入内容到博客写作系统，并创建草稿。

#### Scenario: 通过作者主页批量导入公开文章

- **GIVEN** 用户已登录 `/write`
- **AND** 用户提供一个可公开访问的掘金作者主页链接或用户 ID
- **WHEN** 用户触发批量导入
- **THEN** 系统扫描该作者的公开文章列表
- **AND** 为每篇尚未导入的公开文章创建 `draft` 状态的博客草稿
- **AND** 返回本次批量导入的汇总结果

#### Scenario: 通过文章链接成功单篇导入为草稿

- **GIVEN** 用户已登录 `/write`
- **AND** 用户提供一篇可公开访问的掘金文章链接
- **WHEN** 用户触发导入
- **THEN** 系统抓取该文章内容并创建一篇 `draft` 状态的博客草稿
- **AND** 导入成功后返回草稿 `slug`

#### Scenario: 无法访问的文章导入失败

- **GIVEN** 用户已登录 `/write`
- **WHEN** 用户提供无效作者链接、无效文章链接、私密文章链接或不存在的标识
- **THEN** 系统拒绝创建草稿
- **AND** 返回可操作的错误提示

### Requirement: Imported Draft Preserves Core Metadata And Body

系统 SHALL 在导入掘金文章时，尽量保留核心元数据和可编辑正文结构。

#### Scenario: 导入文章保留标题、日期、摘要与正文

- **GIVEN** 用户导入一篇公开掘金文章
- **WHEN** 导入成功
- **THEN** 草稿中包含文章标题、发布日期、摘要和正文
- **AND** 正文以当前写作系统可继续编辑的 Markdown 或兼容格式保存
- **AND** 若文章存在封面图或正文图片，系统优先尝试保留其可访问链接

### Requirement: Duplicate Source Detection

系统 SHALL 基于掘金文章来源标记识别重复导入，并避免创建重复草稿。

#### Scenario: 相同掘金文章重复导入时跳过创建

- **GIVEN** 系统中已存在一篇 `source_ref='juejin:<articleId>'` 的文章
- **WHEN** 用户再次导入同一篇掘金文章
- **THEN** 系统不再创建第二篇重复草稿
- **AND** 返回已存在文章的标识信息，供用户直接继续编辑

#### Scenario: 批量导入时跳过已存在文章来源

- **GIVEN** 用户触发一次作者主页批量导入
- **AND** 其中部分文章已存在相同 `source_ref`
- **WHEN** 系统执行批量导入
- **THEN** 已存在来源的文章被跳过而不是重复建稿
- **AND** 返回结果中明确区分 `imported` 与 `skipped`
