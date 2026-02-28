# Nighthaven 博客 1:1 复刻方案（面向 erii-blog）

更新时间：2026-02-28
目标站点：`https://www.nighthaven.cn:8660/`
采集方式：Firecrawl `scrape/map/extract` + Firecrawl Browser（DOM/CSS 实测）

## 1. 目标与范围

本方案目标是先把你当前 Next.js 博客做成 **结构与视觉尽量 1:1 对齐 Nighthaven** 的版本，再在此基线做“龙族主题”微调。

复刻优先级：
1. 页面壳层（固定导航 + 左侧功能栏 + 主内容区 + 卡片化页脚）
2. 列表页与文章页版式
3. 视觉 token（颜色、圆角、阴影、间距、字体）
4. 交互行为（侧栏面板、夜间模式入口、目录/分类/标签抽屉）
5. 文案与主题风格二次替换（龙族）

## 2. Firecrawl 采集结果（关键结论）

### 2.1 站点与主题信息

- 平台：WordPress 6.9.1
- 主题：Argon 1.3.5
- 主题主色：`#009688`
- 页面圆角参数：`30px`
- 主题样式文件：
  - `/wp-content/themes/argon/assets/argon_css_merged.css?ver=1.3.5`
  - `/wp-content/themes/argon/style.css?ver=1.3.5`

### 2.2 视觉 Token（实测）

- `body` 背景：`rgb(244, 245, 247)`（约 `#f4f5f7`）
- `body` 主文本色：`rgb(54, 72, 99)`（约 `#364863`）
- 字体栈（body）：
  - `echo, Georgia, -apple-system, "Nimbus Roman No9 L", "PingFang SC", "Hiragino Sans GB", "Noto Serif SC", "Microsoft Yahei", "WenQuanYi Micro Hei", "ST Heiti", sans-serif`
- 卡片圆角：`30px`
- 卡片背景：`rgba(255, 255, 255, 0.8)`（部分面板 `0.95`）
- 卡片阴影：`0 15px 35px rgba(50,50,93,.1), 0 5px 15px rgba(0,0,0,.07)`
- 文章卡片内边距：`30px 30px 35px`
- 全站信息卡/小组件呈“半透明白卡 + 大圆角 + 柔和阴影”

### 2.3 布局结构（首页）

- 顶部：固定导航条（`position: fixed`）
  - 桌面高度约 `90px`
  - 移动高度约 `71px`
- 左侧：固定/吸附式功能栏（搜索、站点概览、分类、标签等）
  - 宽度约 `280px`
- 中央：主内容区（文章流）
  - 桌面两列瀑布流/卡片流
  - 窄屏收敛为单列
- 底部：卡片化 footer

### 2.4 响应式（实测快照）

- `1440`：2 列卡片
- `1200`：1 列（该宽度下布局切换明显）
- `1024`：2 列
- `768`：2 列
- `480/390`：1 列

说明：Argon 的列切换并非纯单一断点，受容器宽度与瀑布流脚本共同影响。

### 2.5 页面类型模式

- 首页：导航 + 左栏 + 文章卡片流 + 页脚
- 分类页：与首页骨架一致，仅标题区与列表数据变化
- 文章页：全宽/近全宽大卡片（`post-full`）+ 评论区 + 分享区
- 归档页：时间轴式归档列表卡

### 2.6 功能入口（需复刻）

- 搜索面板
- 左栏 tab（文章目录 / 站点概览 / 功能）
- 夜间模式开关
- 字体切换（Sans/Serif）
- 阴影强度切换（浅/深）
- 滤镜切换（关闭/日落/暗化/灰度）
- 圆角与主题色调节

## 3. 与当前 erii-blog 的差异

当前项目已有：
- Next.js App Router
- DB-only 内容源（Postgres published）
- 写作与发布链路（/write）

主要差异：
1. 当前首页/列表页是“和风手账风”，非 Argon 壳层。
2. 当前导航与页脚结构不一致（无 Argon 式左栏系统）。
3. 卡片网格与元信息布局不同。
4. 文章页内容容器宽度与信息分层不同。

## 4. 重构实施计划（按风险拆分）

### Phase A：壳层与 Token（先改）

- 新增 Argon 风格全局 token（颜色、圆角、阴影、层级）
- 新增固定导航 + 左栏 + 主内容容器组件
- 在首页/分类页/详情页统一接入壳层

### Phase B：列表页 1:1 复刻

- 重写 PostCard 为 Argon 卡片结构
- 复刻卡片元信息行（日期/分类/字数/时长）
- 复刻两列流布局与移动单列行为

### Phase C：详情页 1:1 复刻

- 文章页切换为 `post-full` 大卡
- 增补目录块、分享块、评论壳（先静态壳，再接真实功能）

### Phase D：左栏功能复刻

- 搜索、分类、标签、近期文章
- 站点概览与功能 tab
- 主题调节器（夜间/字体/阴影/滤镜/圆角/主题色）

### Phase E：龙族主题替换（在 1:1 后执行）

- 保持结构与交互不变
- 替换为龙族语义：文案、插画、色板、章节与角色标签体系

## 5. 文件级改造建议

优先改动：
- `app/globals.css`
- `app/page.jsx`
- `app/blog/page.jsx`
- `app/blog/[slug]/page.jsx`
- `src/components/PostCard.jsx`

新增建议：
- `src/components/argon/ArgonNavbar.jsx`
- `src/components/argon/ArgonLeftbar.jsx`
- `src/components/argon/ArgonFooter.jsx`
- `src/components/argon/ArgonShell.jsx`

## 6. 验收标准（第一轮）

- 首页视觉与壳层布局可与目标站并排对照（主观相似度 >= 90%）
- 关键 token 对齐：背景色、主色、圆角、阴影、卡片间距
- 列表页/文章页均具备 Argon 风格层级
- 移动端无横向滚动、导航不遮挡主内容

## 7. 采集来源

- `https://www.nighthaven.cn:8660/`
- `https://www.nighthaven.cn:8660/tsserverlist/`
- `https://www.nighthaven.cn:8660/category/teamspeak/`
- `https://www.nighthaven.cn:8660/星巡工作室/`

说明：本方案基于 Firecrawl 抓取与 DOM 实测数据，部分交互细节将以“视觉等价实现”方式在 Next.js 中重建。

## 8. 当前实施进度（2026-02-28 第三轮）

### 已完成

- [x] Argon 壳层接入（固定导航 + 主内容区 + 卡片页脚）
- [x] 首页/列表/详情/关于页统一接入 ArgonShell
- [x] 侧栏数据化（分类、标签、近期文章）
- [x] 支持 `?category=` / `?tag=` 服务端过滤列表
- [x] 左栏新增浮动抽屉模式（搜索/概览/目录/分类/标签/功能）
- [x] 主题工具可实时调整：夜间模式、Serif、阴影、滤镜、圆角、主题色
- [x] 列表改为瀑布流容器（含断点切换）

### 尚未完成（下一轮）

- [x] 抽屉交互进一步贴近目标站（动画节奏、面板分层、触发位置）
- [x] 文章详情页的分享区与评论编辑体验 1:1 化（壳层完成，后续可接真实评论后端）
- [x] 首页与分类页瀑布流密度进一步对齐（卡片高度与信息密度微调）
- [x] 龙族主题第一阶段替换（主色、文案语义、导航/侧栏术语、分类别名）
- [ ] 龙族主题第二阶段（角色关系索引、章节时间轴、专题页与插图资源）
