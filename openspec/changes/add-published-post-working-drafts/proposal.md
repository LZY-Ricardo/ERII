# Change: Add Working Drafts For Published Posts

## Why

当前已发布文章进入 `/write` 后，未发布的修改只能停留在本地编辑器状态。这样虽然不会影响线上文章，但用户关闭页面后会丢失修改，也不会在草稿箱中继续接力编辑。

用户需要的行为是：
- 已发布文章在编辑期间继续保持线上可见
- 未发布修改应单独保存为草稿
- 重新打开编辑页或草稿箱时可以继续编辑这份未发布修改
- 只有点击“更新文章/发布”后，线上文章内容才被替换

## What Changes

- 新增“已发布文章工作草稿”存储，用于承接已发布文章的未发布修改
- `/write?slug=<published-slug>` 在存在工作草稿时优先加载草稿内容，而不是直接加载线上发布稿
- 已发布文章的自动保存改为写入工作草稿，不再改动 `posts(status='published')`
- 页面关闭前对脏数据执行一次 best-effort 保存，尽量满足“直接关闭也进入草稿箱”
- 后台 `/admin/posts?tab=draft` 草稿箱展示这类工作草稿，允许继续编辑
- 用户点击“更新文章/发布”后，用工作草稿内容覆盖原发布稿并清理对应工作草稿

## Impact

- Affected specs: `published-post-working-drafts`
- Affected code:
  - `db/schema.sql`
  - `db/migrations/*`
  - `src/lib/content/contentService.js`
  - `app/api/write/posts/[slug]/route.js`
  - `app/api/write/posts/publish/route.js`
  - `app/api/write/posts/*` (新增工作草稿接口)
  - `app/api/admin/posts/route.js`
  - `src/components/WritePageV2.jsx`
  - `app/admin/posts/page.jsx`
