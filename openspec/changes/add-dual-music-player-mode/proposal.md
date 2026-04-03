# Change: update music player to spotify only

## Why
当前博客已经尝试过本地音频播放与 Spotify 嵌入播放并行方案，但最终需求收缩为仅保留 Spotify 作为当前界面内播放器，以减少 UI 复杂度和维护成本。

## What Changes
- 右下角音乐入口仅保留 Spotify 播放器与 Spotify 歌单列表
- `/music` 页面仅保留 Spotify 站内播放器体验
- 移除本地/Spotify 双模式切换 UI 与对应状态逻辑
- 音乐数据层默认只为当前播放器界面暴露 Spotify 可播放内容

## Impact
- Affected specs: `music-player`
- Affected code: `src/lib/music.js`, `src/components/argon/MusicDock.jsx`, `src/components/MusicPlaylistCardClient.jsx`, related player components and styles
