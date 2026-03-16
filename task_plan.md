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

## 2026-03-16 Current Task

### Goal

为“导入掘金文章到博客”创建一份 OpenSpec 提案，范围收敛为“手动导入公开文章为草稿”的 MVP。

### Phases

- [complete] 1. 复核现有内容平台、Notion 同步链路和 OpenSpec 约束
- [complete] 2. 验证掘金公开文章页是否可在服务端提取结构化内容
- [complete] 3. 编写 `add-juejin-import` 提案、设计与任务清单
- [complete] 4. 运行 OpenSpec 严格校验并整理结论
- [complete] 5. 实现 Juejin adapter、导入服务、写作 API 与 `/write` 入口
- [complete] 6. 做无副作用验证并整理剩余真实导入验证项
- [complete] 7. 完成真实单篇导入与小批量去重验证
- [complete] 8. 完成全量公开文章导入，并处理掘金风控挑战兼容

### Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `openspec list --specs` 返回 `No specs found.` | 1 | 说明当前仓库还没有归档后的正式 specs，本次直接在变更目录下新增 capability delta |

### Notes

- 掘金公开文章页当前可直接返回 SSR HTML，页面中存在 `window.__NUXT__`、`article_info`、`web_html_content`
- `posts` 表已支持 `editor_source='import'`、`source_ref`、`source_updated_at`，足够承接 MVP 来源标记
- `content_sync_jobs.provider` 当前只允许 `notion`，因此 MVP 不引入同步任务表，先走手动导入接口
- 掘金公开作者页可见文章列表与 `?cursor=<n>` 翻页链接，因此提案应升级为“批量导入公开文章”为主流程
- 当前实现已完成核心代码，但尚未对真实数据库执行导入写入，以避免在未确认前污染现有文章数据
- 已完成真实数据库验证，并确认去重链路可用
- 已完成作者 `2936108653217451` 的 96 篇公开文章全量导入，最终复核结果为 `skipped=96, failed=0`
