# Change: Add Sticky Article Catalog Navigation

## Why
阅读长文时，右侧目录目前只是静态文本列表，滚动后不方便持续查看，也不能点击章节快速跳转，导致文章内导航效率偏低。

## What Changes
- 让文章页右侧“文章目录”卡片在桌面端随页面滚动保持可见
- 为文章标题生成稳定的章节锚点，并将目录项改为可点击跳转
- 调整目录项的交互与选中反馈，提升长文阅读时的定位效率
- 将文章详情页右侧栏精简为“最近评论”和“文章目录”两个与阅读强相关的卡片
- 在文章详情页右侧新增“最近评论”卡片，展示该文章最新评论摘要并支持跳转到对应评论

## Impact
- Affected specs: `article-navigation`
- Affected code: `app/blog/[slug]/page.jsx`, `src/components/argon/ArgonShell.jsx`, `src/components/argon/ArgonRightbar.jsx`, `src/lib/comments.js`, `app/globals.css`
