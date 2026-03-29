# Trending Chinese Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 GitHub 热点卡片优先展示本地维护的中文简述，未录入仓库继续回退到 GitHub 原始英文描述。

**Architecture:** 新增一个独立的热点描述映射模块，集中维护 `owner/name -> 中文简述`。热点组件统一通过同一个帮助函数取描述，避免中文文案散落在多个组件里，也不改动 `/api/trending` 的抓取与缓存逻辑。

**Tech Stack:** Next.js App Router、React Client Components、Node `assert/strict`

---

### Task 1: 热点描述映射模块

**Files:**
- Create: `src/lib/trendingDescriptions.mjs`
- Create: `src/lib/trendingDescriptions.test.mjs`

- [ ] **Step 1: 先写描述选择逻辑测试**
- [ ] **Step 2: 运行测试并确认因模块缺失而失败**
- [ ] **Step 3: 实现中文映射与回退函数**
- [ ] **Step 4: 再次运行测试并确认通过**

### Task 2: 热点组件接入

**Files:**
- Modify: `src/components/TrendingSidebar.jsx`
- Modify: `src/components/TrendingCard.jsx`

- [ ] **Step 1: 在热点侧栏组件接入统一描述函数**
- [ ] **Step 2: 在热点卡片组件接入统一描述函数**
- [ ] **Step 3: 确认未录入仓库仍使用原描述**

### Task 3: 验证

**Files:**
- No code changes

- [ ] **Step 1: 运行 `node "src/lib/trendingDescriptions.test.mjs"`**
- [ ] **Step 2: 运行 `pnpm lint`**
- [ ] **Step 3: 检查 `git diff -- src/lib/trendingDescriptions.mjs src/lib/trendingDescriptions.test.mjs src/components/TrendingSidebar.jsx src/components/TrendingCard.jsx`**
