# Change: Admin 文章列表快捷切换分类

## Why

当前在 `/admin/posts` 文章管理列表中，想调整文章分类必须进入 `/write` 编辑页再修改，操作成本高，批量整理时尤其费时。

更合理的体验是：在文章管理列表中即可直接切换分类，并立即保存到数据库，避免频繁跳转。

## What Changes

- 在 `/admin/posts` 列表中新增「分类」列
- 支持在列表中通过下拉选择器快捷切换分类并即时保存
- 支持已发布文章、草稿文章，以及“已发布文章修改稿（working draft）”三种列表项
- 保存失败时回滚到原分类并给出提示

## Impact

- Affected specs: `admin-dashboard`（新增 Admin Posts 分类快捷编辑能力）
- Affected code:
  - `app/admin/posts/page.jsx`（新增分类列与快捷编辑交互）
  - `app/api/admin/posts/*`（新增分类更新 API）
  - `src/lib/postTaxonomy.js`（复用分类枚举与归一化逻辑）

