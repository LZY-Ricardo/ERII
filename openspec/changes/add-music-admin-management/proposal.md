# Change: add music admin management

## Why
当前 `/music` 页面和全站音乐播放器仍然依赖代码内的静态歌单配置，无法通过后台管理新增或调整歌单，也无法从后台统一控制站内播放器展示与否。随着需求扩展到多平台歌单分享与后台配置，这种静态方案已经不适合继续维护。

## What Changes
- 新增后台音乐管理能力，用于增删改查多平台歌单分享内容
- 将音乐歌单数据迁移到数据库统一管理，覆盖 Spotify、QQ 音乐、网易云音乐
- 增加站内播放器显示开关，用于控制全站 dock 播放器和 `/music` 页站内播放器区块是否显示
- `/music` 页面保留为歌单分享页，即使关闭站内播放器，也继续展示已发布歌单卡片与外链
- 仅允许符合条件的 Spotify 歌单参与站内播放器候选；其他平台仅提供分享展示和外链

## Impact
- Affected specs: `music-management`
- Affected code:
  - `app/admin/` 后台导航与音乐管理页面
  - `app/api/admin/` 音乐管理接口与站点设置接口
  - `app/music/page.jsx` 与 `src/components/argon/MusicDock.jsx`
  - `src/lib/music.js` 及相关前台读取逻辑
  - 数据库 schema / 初始化脚本 / 迁移流程
