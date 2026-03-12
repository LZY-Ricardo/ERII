# 文档导航

本目录用于沉淀 ERII Blog 的设计、实现、运维与阶段性报告。

## 建议阅读顺序

1. `Project-Feature-and-Progress-Report.md`
2. `ContentPlatform-Runbook.md`
3. `ContentPlatform-Implementation-Plan.md`
4. `EditingPublishedPosts.md`

## 文档说明

- `Project-Feature-and-Progress-Report.md`
  - 基于当前代码扫描形成的“功能与开发进度”报告。
- `ContentPlatform-Runbook.md`
  - 内容平台运行手册，包含环境变量、接口和验证清单。
- `ContentPlatform-Implementation-Plan.md`
  - 内容平台改造详细设计与阶段计划。
- `EditingPublishedPosts.md`
  - 已发布文章二次编辑与再发布操作说明。
- `Nighthaven-Replica-Plan.md`
  - Argon/Nighthaven 风格复刻计划与阶段进度。
- `Comment-System-Replica-Implementation-Plan.md`
  - Nighthaven 评论区高还原方案（数据库/API/UI/测试/分阶段验收）。
- `ERIIEditorFeatureDevelopmentGuide.md`
  - 早期 `content/` 文件方案文档（历史参考）。
- `WafuEditor.md`
  - 和风编辑器方向的设计稿与实现草案。

## 状态说明

- 当前项目内容源已收敛为 DB-only（Postgres + Blob）。
- 涉及 `content/` 文件读取的描述，均以历史参考为主。
