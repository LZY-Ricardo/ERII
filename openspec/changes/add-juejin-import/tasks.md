## 1. Extraction

- [x] 1.1 新增掘金作者主页 URL / 用户 ID 和文章 URL / 文章 ID 的归一化能力
- [x] 1.2 实现公开作者页抓取与分页扫描，提取全部公开文章 ID 列表
- [x] 1.3 实现公开文章页抓取，并从 SSR 数据或 DOM 中提取标题、摘要、日期、封面和正文 HTML
- [x] 1.4 引入并配置 HTML -> Markdown 转换规则，覆盖代码块、图片、标题、列表和引用

## 2. Import Service

- [x] 2.1 新增 Juejin adapter / import service，将作者页扫描结果和单篇提取结果转换为当前博客的 `normalizePostInput` 输入结构
- [x] 2.2 复用现有内容保存能力，以 `draft` 状态落库，并写入 `editor_source='import'`、`source_ref='juejin:<articleId>'`
- [x] 2.3 对同一 `source_ref` 做去重，重复导入时返回已存在文章信息而不是创建重复草稿
- [x] 2.4 为批量导入增加汇总结果结构，至少包含 `imported`、`skipped`、`failed`
- [x] 2.5 复用 Blob 能力对封面和正文图片做 best-effort 镜像

## 3. Write UX

- [x] 3.1 新增受保护接口 `POST /api/write/import/juejin`，支持单篇和批量模式
- [x] 3.2 在 `/write` 添加“导入掘金”入口与作者主页 URL / 用户 ID 输入表单
- [x] 3.3 保留单篇文章 URL 导入作为补充入口
- [x] 3.4 批量导入后展示汇总结果，并允许直接进入某篇导入草稿继续编辑

## 4. Validation

- [x] 4.1 手动验证作者主页可扫描出多篇公开文章并批量导入为草稿
- [x] 4.2 手动验证一篇典型公开掘金文章可成功单篇导入为草稿
- [ ] 4.3 手动验证代码块、图片、标题层级和段落在编辑器中基本可用
- [x] 4.4 手动验证重复导入时不会新建重复草稿
- [x] 4.5 运行相关 lint / build 验证
