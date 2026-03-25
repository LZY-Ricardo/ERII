# Resource Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为博客新增独立的 `资源库` 页面，并在导航中暴露入口，用统一卡片展示精选资源。

**Architecture:** 采用轻量的数据驱动方案：资源定义集中在单独的 `src/lib` 模块中，页面通过 `ArgonShell` 复用现有站点布局，样式在 `app/globals.css` 内补充与现有 `nh-*` 体系一致的类名。邀请关系通过资源标签显式披露，不新增后端、数据库或复杂交互。

**Tech Stack:** Next.js App Router、React Server Components、全局 CSS、Node `node:test`

---

### Task 1: 资源数据模块

**Files:**
- Create: `src/lib/resources.mjs`
- Test: `src/lib/resources.test.mjs`

- [ ] **Step 1: 写资源模块测试**
- [ ] **Step 2: 运行测试并确认失败**
- [ ] **Step 3: 实现资源数据导出与查询函数**
- [ ] **Step 4: 再次运行测试并确认通过**

### Task 2: 资源库页面

**Files:**
- Create: `app/resources/page.jsx`
- Modify: `src/lib/resources.mjs`

- [ ] **Step 1: 参考现有 `app/projects/page.jsx` 页面模式搭建资源库页面**
- [ ] **Step 2: 使用 `ArgonShell` 渲染页面标题、导语和分类分区**
- [ ] **Step 3: 渲染资源卡片，包含用途、推荐理由、标签和外链按钮**

### Task 3: 导航与样式接入

**Files:**
- Modify: `src/components/argon/ArgonNavbar.jsx`
- Modify: `app/globals.css`

- [ ] **Step 1: 在主导航加入 `资源库` 入口并支持高亮**
- [ ] **Step 2: 为资源页新增样式，复用现有 `nh-card` / `nh-section-head` 视觉体系**
- [ ] **Step 3: 补齐移动端样式，避免资源卡片在窄屏下拥挤**

### Task 4: 验证

**Files:**
- Modify: `openspec/changes/add-resource-library/tasks.md`

- [ ] **Step 1: 运行 `node --test src/lib/resources.test.mjs`**
- [ ] **Step 2: 运行 `pnpm lint`**
- [ ] **Step 3: 运行 `pnpm build`**
- [ ] **Step 4: 回填 OpenSpec 任务状态**
