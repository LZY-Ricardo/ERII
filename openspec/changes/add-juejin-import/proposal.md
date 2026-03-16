# Change: Add Juejin Article Import

## Why

当前博客内容平台已经支持内部写作和 Notion 同步，但还没有“把已发布在掘金的文章导入进来”这条链路。手动复制粘贴会带来几个明显问题：

- 标题、摘要、封面、发布日期需要重复整理
- 正文中的代码块、图片、引用等格式容易丢失
- 重复导入时缺少来源标记，后续不方便识别和处理
- 若用户已有几十篇掘金文章，一篇一篇粘贴链接的操作成本过高

结合当前需求，更合适的第一步不是做双向同步，而是支持“按掘金作者主页批量导入全部公开文章为草稿”，并保留“单篇导入”作为补充入口。这样既能满足你一次性迁移自己内容的场景，又不会把第一版复杂度拉到登录态同步或私密内容抓取。

## What Changes

- 新增掘金公开文章导入能力，支持：
  - 输入作者主页 URL 或用户 ID，批量扫描并导入全部公开文章
  - 输入单篇文章 URL 或文章 ID，导入单篇文章
- 服务端抓取公开作者页和公开文章页，提取文章列表、标题、摘要、日期、封面和正文
- 将掘金正文 HTML 转换为可在当前编辑器继续编辑的 Markdown 草稿
- 复用现有 `source_ref` / `source_updated_at` 能力，为导入内容打上来源标记
- 对重复导入执行去重，避免同一篇掘金文章反复创建新草稿
- 在 `/write` 提供批量导入入口、执行反馈与导入结果汇总

## Impact

- Affected specs: `juejin-import`
- Affected code:
  - `src/lib/content/adapters/*`（新增 Juejin adapter）
  - `src/lib/content/*`（新增 import service 或复用现有 content service）
  - `app/api/write/import/*`（新增单篇 / 批量导入接口）
  - `src/components/WritePageV2.jsx`
  - `package.json`（如需新增 HTML 转 Markdown 依赖）
