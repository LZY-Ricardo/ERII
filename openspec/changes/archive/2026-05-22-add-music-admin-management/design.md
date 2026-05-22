## Context
当前音乐能力分成两部分：`/music` 页面用于歌单展示，全站右下角 `MusicDock` 用于站内播放。但歌单来源仍然是 `src/lib/music.js` 内的静态常量，后台只能管理站点设置，无法管理音乐内容本身。新需求要求后台直接管理多平台歌单，并能统一控制站内播放器的显示开关。

## Goals / Non-Goals
- Goals:
  - 提供可维护的后台音乐管理入口
  - 用数据库统一承载音乐歌单数据
  - 保持 `/music` 页面为多平台歌单分享页
  - 将站内播放器能力限制在 Spotify 可嵌入歌单上
  - 用一个全局开关控制站内播放器是否展示
- Non-Goals:
  - 不为 QQ 音乐或网易云实现新的站内播放器
  - 不在本次变更中扩展新的外部音乐平台
  - 不实现复杂拖拽排序或批量导入

## Decisions

### Decision: 使用独立音乐表，而不是继续复用 `site_settings`
音乐歌单是内容集合，不是单一配置项。继续塞进 `site_settings` JSON 会让多平台字段、排序、发布状态和未来扩展全部混在一个 blob 里，不适合后台 CRUD。新增独立表后，后台接口和前台读取都更自然。

建议表结构（命名可在实现期细化）：
- `id`
- `name`
- `description`
- `platform`
- `playlist_id`
- `playlist_url`
- `cover_url`
- `is_published`
- `allow_embedded_player`
- `sort_order`
- `created_at`
- `updated_at`

### Decision: 播放器开关继续进入站点设置读模型，但后台入口归属音乐管理
播放器显示开关本质上是站点级布尔配置，可以继续落在现有 `admin_meta.site_settings` JSON 中，减少额外 schema 成本。但在后台体验上，它属于音乐能力的一部分，应该放进新的“音乐管理”页面，而不是继续散落在“站点设置”里。

### Decision: `/music` 页面和 `MusicDock` 使用不同的数据过滤规则
`/music` 页面应该展示所有已发布歌单，不区分平台；`MusicDock` 和 `/music` 页站内播放器区块只消费“播放器开关开启 + Spotify + allow_embedded_player=true”的歌单集合。这样可以同时满足“多平台分享”与“Spotify-only 站内播放”。

## Risks / Trade-offs
- 风险：静态配置切到数据库后，若数据库为空，音乐页会退化为空展示
  - Mitigation：提供迁移脚本或初始化 seed，把当前 Spotify 歌单导入数据库
- 风险：后台表单对不同平台字段校验不清晰，用户可能误以为 QQ/网易云也支持站内播放
  - Mitigation：在平台字段和嵌入开关旁显式提示“当前仅 Spotify 支持站内播放器”
- 风险：`MusicDock` 继续依赖复杂状态逻辑，切数据源时容易回归
  - Mitigation：保持播放器状态逻辑不变，仅替换歌单来源与开关判定逻辑

## Migration Plan
1. 增加音乐歌单表
2. 将现有静态 Spotify 歌单导入数据库
3. 更新后台接口和后台页面
4. 更新 `/music` 页面和 `MusicDock` 的数据读取逻辑
5. 保留 `src/lib/music.js` 中的平台工具函数，但移除其作为主数据源的职责

## Open Questions
- 管理端是否需要单独的排序 UI，还是先用数值型 `sort_order` 输入即可
- 后续若新增“精选歌单”或“首页推荐”等能力，是否继续复用此表
