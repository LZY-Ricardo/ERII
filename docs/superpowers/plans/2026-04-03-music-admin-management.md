# Music Admin Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为博客后台增加音乐管理能力，把多平台歌单迁移到数据库管理，并提供全局站内播放器显示开关。

**Architecture:** 新增一张 `music_playlists` 表承载歌单内容，复用 `admin_meta.site_settings` 保存播放器开关。后台新增 `/admin/music` 和对应 CRUD 接口；前台 `/music` 页面与 `MusicDock` 改为从数据库读数据，并按“已发布 / 可嵌入 / 播放器开关”做不同过滤。

**Tech Stack:** Next.js App Router、React 19、Vercel Postgres、现有 `admin_meta` 设置模型、现有 `MusicDock` / `SpotifyEmbedPlayer` 组件。

---

### Task 1: 建立音乐数据表与迁移脚本

**Files:**
- Modify: `db/schema.sql`
- Create: `db/migrations/20260403_music_playlists.sql`
- Create: `scripts/migrate-music-to-db.mjs`
- Reference: `db/migrations/20260312_projects.sql`
- Reference: `src/lib/music.js`

- [ ] **Step 1: 为新表写清结构和约束**

在 `db/migrations/20260403_music_playlists.sql` 中创建 `music_playlists`：
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `description TEXT`
- `platform TEXT NOT NULL CHECK (platform IN ('spotify','qq','netease'))`
- `playlist_id TEXT NOT NULL`
- `playlist_url TEXT`
- `cover_url TEXT`
- `is_published BOOLEAN NOT NULL DEFAULT true`
- `allow_embedded_player BOOLEAN NOT NULL DEFAULT false`
- `sort_order INTEGER NOT NULL DEFAULT 0`
- `created_at / updated_at`

同时补索引：
- `(is_published, sort_order)`
- `(platform, allow_embedded_player, sort_order)`

- [ ] **Step 2: 在 `db/schema.sql` 同步主 schema**

把 `music_playlists` 表和索引定义同步进 `db/schema.sql`，保证新环境初始化时不依赖单独迁移文件。

- [ ] **Step 3: 给 `updated_at` 加 trigger**

参考 `projects` 表做法，在迁移文件里增加 `update_music_playlists_updated_at()` trigger，避免后台修改时手工维护时间戳。

- [ ] **Step 4: 写迁移脚本，把当前静态歌单导入数据库**

在 `scripts/migrate-music-to-db.mjs` 中：
- 读取 `src/lib/music.js` 的现有默认歌单
- 按平台和歌单 id 生成稳定主键
- upsert 到 `music_playlists`
- 默认将 Spotify 歌单标记为 `allow_embedded_player=true`
- 输出导入数量和失败原因

- [ ] **Step 5: 手动验证迁移脚本逻辑**

Run: `node scripts/migrate-music-to-db.mjs`

Expected:
- 在已配置数据库环境中成功执行
- 日志显示导入/更新的歌单数量

### Task 2: 提取音乐数据访问层

**Files:**
- Create: `src/lib/musicCatalog.js`
- Modify: `src/lib/music.js`
- Test: `src/lib/musicDock.test.mjs`

- [ ] **Step 1: 新建数据库读模型工具**

在 `src/lib/musicCatalog.js` 中实现：
- `getAdminMusicPlaylists(db)`
- `getPublishedMusicPlaylists(db)`
- `getEmbeddableSpotifyPlaylists(db)`
- `normalizeMusicPlaylistInput(payload)`
- `coerceMusicPlayerEnabled(settings)`

约束：
- 统一把数据库行转换成前端使用的 camelCase 结构
- 明确平台枚举与布尔字段默认值

- [ ] **Step 2: 保留 `src/lib/music.js` 的平台工具函数，剥离静态数据职责**

保留：
- `getMusicPlaybackMode`
- `getSpotifyEmbedUri`
- `getMusicEmbedUrl`
- `getPlaylistUrl`
- `getPlaylistCover`
- `parseSpotifyUri`

移除或降级：
- `MUSIC_PLAYLISTS` 只作为迁移脚本/兜底常量，不再作为前台主数据源
- `getAllPlaylists()` 标记为仅兼容静态 fallback

- [ ] **Step 3: 为新过滤逻辑补测试**

在 `src/lib/musicDock.test.mjs` 中新增用例：
- Spotify 且 `allowEmbeddedPlayer=true` 时会进入播放器候选
- QQ / 网易云永远不会进入播放器候选
- `isPublished=false` 不进入 `/music` 页面展示

- [ ] **Step 4: 运行音乐工具测试**

Run: `node --test "src/lib/musicDock.test.mjs"`

Expected:
- 新增和旧有测试全部通过

### Task 3: 扩展后台设置接口承载播放器开关

**Files:**
- Modify: `app/api/admin/settings/route.js`
- Reference: `app/admin/settings/page.jsx`

- [ ] **Step 1: 扩展默认设置结构**

在 `DEFAULT_SETTINGS` 中加入：
- `musicPlayerEnabled: true`

并确保 GET 时缺省值兼容旧数据。

- [ ] **Step 2: 明确 POST 合并逻辑**

保持现有“读取当前设置 + merge body”的模式，但确保 `musicPlayerEnabled` 会被正确序列化和返回。

- [ ] **Step 3: 快速回归检查设置接口**

验证：
- 未配置新字段的旧数据仍可读取
- 新字段保存后再次 GET 可以读回

### Task 4: 新增后台音乐管理 API

**Files:**
- Create: `app/api/admin/music/route.js`
- Create: `app/api/admin/music/[id]/route.js`
- Reference: `app/api/admin/projects/route.js`
- Reference: `app/api/admin/settings/route.js`

- [ ] **Step 1: 实现 `GET /api/admin/music`**

返回：
- `playlists`
- `settings.musicPlayerEnabled`

要求：
- 需要 `requireAdmin()`
- 统一返回 `{ ok: true, ... }` 结构

- [ ] **Step 2: 实现 `POST /api/admin/music`**

支持创建新歌单：
- 校验 `name`、`platform`、`playlistId`
- 若 `playlistUrl` 未传，按平台自动生成默认 URL
- 若 `allowEmbeddedPlayer=true` 但平台不是 `spotify`，后端强制转成 `false`
- `sort_order` 默认为当前最大值 + 1

- [ ] **Step 3: 实现 `PUT /api/admin/music/[id]`**

支持更新：
- 基础信息
- 发布状态
- 是否允许嵌入
- 排序值

- [ ] **Step 4: 实现 `DELETE /api/admin/music/[id]`**

支持删除单条歌单。

- [ ] **Step 5: 在音乐管理接口中保存播放器开关**

选择一个明确方式：
- 推荐在 `POST /api/admin/music` 之外新增 `PATCH` 或在列表路由接受独立设置更新请求

要求：
- 设置更新与歌单 CRUD 分离
- 不要把整个 settings JSON 交给音乐页面任意覆盖

- [ ] **Step 6: 手动验证接口返回和错误消息**

检查场景：
- 缺字段返回 400
- 非 Spotify 勾选嵌入时自动纠正
- 删除不存在 id 时返回明确错误

### Task 5: 新增后台音乐管理页面

**Files:**
- Modify: `src/components/admin/adminNav.js`
- Create: `app/admin/music/page.jsx`
- Optional Create: `src/components/admin/adminMusicForm.js`
- Optional Create: `src/lib/musicAdminMutation.js`
- Reference: `app/admin/projects/page.jsx`
- Reference: `app/admin/settings/page.jsx`

- [ ] **Step 1: 在后台导航中新增音乐入口**

在 `src/components/admin/adminNav.js` 中加入：
- `key: 'music'`
- `label: '音乐管理'`
- `href: '/admin/music'`

- [ ] **Step 2: 搭出音乐管理页基本结构**

`app/admin/music/page.jsx` 需要包含：
- 顶部页面说明
- 播放器开关区块
- 歌单列表区块
- 新建 / 编辑表单区块

保持和 `projects` / `settings` 类似的后台视觉语言。

- [ ] **Step 3: 实现播放器开关表单**

要求：
- 用单独开关控制 `musicPlayerEnabled`
- 文案明确说明：
  - 关闭后不显示全站播放器
  - `/music` 页面仍然保留分享卡片
  - 当前仅 Spotify 支持站内播放

- [ ] **Step 4: 实现歌单 CRUD 表单**

字段至少包含：
- 名称
- 描述
- 平台
- 歌单 ID
- 外链
- 封面
- 已发布
- 允许站内播放器
- 排序

交互要求：
- 编辑时回填
- 非 Spotify 平台时禁用/说明嵌入开关

- [ ] **Step 5: 实现歌单列表**

列表展示：
- 名称
- 平台
- 发布状态
- 嵌入资格
- 排序
- 编辑 / 删除按钮

- [ ] **Step 6: 手动验证后台页面关键路径**

验证：
- 新建 Spotify 歌单
- 新建 QQ / 网易云歌单
- 关闭/开启播放器显示
- 修改和删除现有歌单

### Task 6: 改造 `/music` 页面数据来源与展示规则

**Files:**
- Modify: `app/music/page.jsx`
- Modify: `src/components/MusicPlaylistCardClient.jsx`
- Modify: `src/components/MusicPlaylistCard.jsx`
- Create or Modify: `src/lib/musicPageData.js`（如需要）

- [ ] **Step 1: 服务端从数据库读取已发布歌单**

在 `app/music/page.jsx` 中改为：
- 从数据库读取 `is_published=true` 的歌单
- 同时读取 `musicPlayerEnabled`

- [ ] **Step 2: 调整页面播放器区块显隐**

规则：
- `musicPlayerEnabled=false` 时，不渲染页面内 Spotify 播放器区域
- 歌单卡片区继续显示所有已发布歌单

- [ ] **Step 3: 调整卡片操作**

规则：
- Spotify：保留站内播放入口和外链
- QQ / 网易云：仅外链分享，不显示误导性的站内播放 CTA

- [ ] **Step 4: 验证空状态**

当数据库没有已发布歌单时：
- 页面给出明确空状态说明
- 不渲染播放器

### Task 7: 改造全站 `MusicDock`

**Files:**
- Modify: `src/components/argon/MusicDock.jsx`
- Modify: `src/components/argon/ArgonShell.jsx`（如需传参）
- Optional Create: `src/lib/musicDockData.js`

- [ ] **Step 1: 改为从数据库候选中取歌单**

规则：
- 只取 `is_published=true`
- `platform='spotify'`
- `allow_embedded_player=true`

- [ ] **Step 2: 接入播放器显示开关**

规则：
- `musicPlayerEnabled=false` 时，`MusicDock` 直接不渲染
- 没有符合条件的 Spotify 歌单时，也不渲染

- [ ] **Step 3: 保留现有播放器状态机**

要求：
- 不重写现有迷你控制条/隐藏保活逻辑
- 只替换歌单来源和开关判定

- [ ] **Step 4: 回归验证 `MusicDock`**

验证：
- 开关关闭时 dock 消失
- 开关开启且有 Spotify 候选时 dock 正常出现
- 仅有 QQ / 网易云歌单时 dock 不出现

### Task 8: 全量验证与收尾

**Files:**
- Modify: `openspec/changes/add-music-admin-management/tasks.md`

- [ ] **Step 1: 跑 lint**

Run: `pnpm lint`

Expected:
- 无新增错误
- 若有旧 warning，记录为仓库既有问题

- [ ] **Step 2: 跑 build**

Run: `pnpm build`

Expected:
- 构建通过

- [ ] **Step 3: 更新 OpenSpec tasks 状态**

把已完成项在 `openspec/changes/add-music-admin-management/tasks.md` 中勾成 `- [x]`。

- [ ] **Step 4: 手动验收**

至少检查：
- 后台能新增 3 种平台歌单
- `/music` 页面在播放器开关关闭时只剩分享卡片
- Spotify 歌单可继续驱动站内播放器
- QQ / 网易云不会误进站内播放器
