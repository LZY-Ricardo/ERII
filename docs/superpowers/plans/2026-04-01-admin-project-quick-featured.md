# Admin Project Quick Featured Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让后台项目列表页支持直接切换首页精选状态，并为已精选项目提供快捷排序编辑。

**Architecture:** 复用现有 `PUT /api/admin/projects/[id]` 更新接口，不新增后台 API。列表页补一个轻量状态模型，负责本地更新、请求载荷构造和错误回滚；首页继续沿用现有 `featured + sort_order` 取前三逻辑。

**Tech Stack:** Next.js App Router、React Client Components、Node.js 内置测试运行器

---

### Task 1: 提炼快捷编辑状态模型

**Files:**
- Create: `src/components/admin/adminProjectsQuickEdit.js`
- Test: `src/components/admin/adminProjectsQuickEdit.test.mjs`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**

### Task 2: 接入后台列表页快捷交互

**Files:**
- Modify: `app/admin/projects/page.jsx`
- Use: `src/components/admin/adminProjectsQuickEdit.js`

- [ ] **Step 1: 添加星标切换与排序编辑交互**
- [ ] **Step 2: 仅对已精选项目展示排序输入**
- [ ] **Step 3: 失败时回滚本地状态并提示错误**
- [ ] **Step 4: 运行测试与 lint 验证**

### Task 3: 验证首页规则未回归

**Files:**
- Verify only: `src/lib/projects.js`
- Verify only: `app/page.jsx`

- [ ] **Step 1: 确认首页仍按 `featured=true` 和 `sort_order` 升序取前 3**
- [ ] **Step 2: 记录未覆盖的人工验证点**
