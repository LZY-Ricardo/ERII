# Change: add resource library page

## Why
博客当前缺少一个统一承载常用工具与网站推荐的入口，直接将单个外链作为广告展示会破坏站点整体叙事与信任感。

## What Changes
- 新增独立的 `资源库` 页面，集中展示按场景分类的资源推荐
- 在主导航增加 `资源库` 入口
- 为资源定义统一的数据结构与推荐卡片展示方式
- 明确标注自用推荐与邀请链接，降低广告化表达

## Impact
- Affected specs: `resource-library`
- Affected code: `app/resources/page.jsx`, `app/globals.css`, `src/components/argon/ArgonNavbar.jsx`, `src/lib/*`
