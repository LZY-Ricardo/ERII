我们需要打造一个**“绘梨衣的绘图板 (Erii's Drafting Table)”**。

核心设计理念：

1. **功能对标：** 左侧纯净输入，右侧实时渲染（参考图布局）。
2. **风格延续：** 保持目前的米白纸张背景、手写字体和红色点缀。
3. **数据逻辑：** 由于你的博客是基于文件系统 (`fs`) 的，网页端直接修改服务器文件通常仅限本地开发环境 (Localhost)。因此，我们将把“发布”功能设计为**“下载 MDX 文件”**或**“复制到剪贴板”**，方便你直接存入 `content/` 文件夹。

以下是为您定制的开发规划文档。

---

# ERII | Editor Feature - Development Guide

> **Module:** Article Editor (Writing Page)
> **Theme:** "Drafting Table" (Clean, Split-view, Tool-assisted)
> **Tech:** React `useState`, `react-markdown` (for preview), Lucide Icons

---

## 📍 1. 入口规划 (Entry Point)

由于这是一个个人博客，编辑页不应该对普通访客开放。我们不需要做一个复杂的登录系统，而是沿用“绘梨衣的秘密”这一设定。

**方案：隐藏的入口**

* **位置：** 页脚 (Footer) 的那只 SVG 小黄鸭图标（或 Copyright 文字）。
* **交互：** 连续点击小黄鸭 **5次**（或者长按），跳转到 `/write` 页面。
* **理由：** 既不需要做后端鉴权，又保留了“只有Sakura知道的秘密通道”的趣味性。

---

## 🎨 2. 界面设计 (UI/UX Design)

我们将这个页面命名为 **`/write`**。

### 2.1 布局结构 (参考 image_f38b63.png)

采用 **左右分栏 (Split Pane)** 布局：

* **顶部栏 (Toolbar):** 放置文章标题输入框、辅助工具按钮（加粗、图片、链接等）、以及“保存/发布”按钮。
* **左侧 (Input):** 一个巨大的、无边框的 `textarea`。字体使用等宽字体或手写字体，模拟在纸上书写。
* **右侧 (Preview):** 实时渲染区域。样式必须与现在的文章详情页 **完全一致**，保证“所见即所得”。

### 2.2 风格适配

* **背景：** 延续 `bg-erii-paper` 和纸张纹理。
* **工具栏图标：** 使用 `lucide-react`，默认灰色，Hover 时变为 `erii-red`。
* **输入框：** 去掉默认的蓝色聚焦边框，改为底部虚线或无边框，光标颜色设为 `caret-erii-red`。

---

## 🛠 3. 开发实现 (Implementation)

请将以下代码逻辑交给 AI 编辑器执行。

### Step 1: 安装必要依赖

我们需要一个能够解析 Markdown 的组件来做预览（虽然你已经有了 `next-mdx-remote`，但在客户端实时预览使用 `react-markdown` 会更轻量且方便）。

```bash
npm install react-markdown remark-gfm

```

### Step 2: 创建编辑页 (`src/app/write/page.jsx`)

这是一个 **Client Component**。

```jsx
"use client";
import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // 支持表格、删除线等
import { 
  Bold, Italic, Link as LinkIcon, Image as ImageIcon, 
  List, Quote, Code, Save, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

export default function WritePage() {
  const [content, setContent] = useState("# 04.24 东京塔\n\n世界很温柔。");
  const [title, setTitle] = useState("04.24 东京塔");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const textareaRef = useRef(null);

  // --- 辅助工具函数 ---
  const insertText = (before, after = "") => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    setContent(newText);
    
    // 重新聚焦并恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  // --- 导出/保存逻辑 ---
  const handleDownload = () => {
    const frontmatter = `---
title: "${title}"
date: "${date}"
description: "这里写描述..."
tags: ["Diary"]
---

`;
    const fullContent = frontmatter + content;
    const blob = new Blob([fullContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.mdx`; // 下载文件名
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-erii-paper flex flex-col text-erii-ink">
      
      {/* --- 顶部工具栏 --- */}
      <header className="h-16 border-b border-dashed border-slate-300 flex items-center px-6 justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-erii-red transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent font-hand text-xl font-bold outline-none placeholder-slate-400 w-64 focus:text-erii-red transition-colors"
            placeholder="文章标题..."
          />
        </div>

        {/* 辅助功能键区 */}
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm border border-slate-100">
          <ToolButton icon={<Bold size={18} />} onClick={() => insertText('**', '**')} tooltip="加粗" />
          <ToolButton icon={<Italic size={18} />} onClick={() => insertText('*', '*')} tooltip="斜体" />
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <ToolButton icon={<Quote size={18} />} onClick={() => insertText('> ')} tooltip="引用" />
          <ToolButton icon={<List size={18} />} onClick={() => insertText('- ')} tooltip="列表" />
          <ToolButton icon={<Code size={18} />} onClick={() => insertText('```\n', '\n```')} tooltip="代码块" />
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <ToolButton icon={<LinkIcon size={18} />} onClick={() => insertText('[链接文字](url)')} tooltip="链接" />
          <ToolButton icon={<ImageIcon size={18} />} onClick={() => insertText('![描述](/images/duck.png)')} tooltip="图片" />
        </div>

        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 bg-erii-red text-white px-4 py-2 rounded-full font-hand hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-erii-red/30"
        >
          <Save size={18} />
          <span>保存手账</span>
        </button>
      </header>

      {/* --- 主编辑区 (Split View) --- */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* 左侧：输入区 */}
        <div className="w-1/2 h-full border-r border-dashed border-slate-300 bg-white/30">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-8 bg-transparent outline-none resize-none font-mono text-sm leading-relaxed text-slate-700 selection:bg-erii-duck"
            placeholder="开始记录今天的故事..."
            spellCheck={false}
          />
        </div>

        {/* 右侧：预览区 (完全复用博客正文样式) */}
        <div className="w-1/2 h-full overflow-y-auto p-8 bg-white/60">
          <div className="prose prose-slate max-w-none prose-headings:font-hand prose-headings:text-erii-red prose-a:text-erii-duck prose-img:rounded-xl">
            {/* 模拟 Header */}
            <div className="mb-8 border-b border-dashed border-slate-300 pb-4">
              <h1 className="text-3xl font-hand text-erii-red mb-2">{title}</h1>
              <div className="text-xs text-slate-400 font-hand">
                {date} · 预览模式
              </div>
            </div>
            
            {/* Markdown 渲染 */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>

      </main>
    </div>
  );
}

// 简单的工具按钮组件
function ToolButton({ icon, onClick, tooltip }) {
  return (
    <button 
      onClick={onClick}
      title={tooltip}
      className="p-2 text-slate-400 hover:text-erii-red hover:bg-red-50 rounded-lg transition-all"
    >
      {icon}
    </button>
  );
}

```

---

### Step 3: 更新资源处理 (Image/Video)

参考你的需求，编辑页需要插入图片和视频。

由于没有后端服务器，图片处理策略如下：

1. **推荐方式：** 将图片手动放入项目的 `public/images` 文件夹。
2. **编辑操作：** 点击工具栏的“图片”按钮，它会插入 `![alt](/images/你的文件名.jpg)`。
3. **视频操作：** 你可以扩展 `ReactMarkdown` 的渲染器来支持 `<video>` 标签，或者直接使用 HTML 写法：
`<video src="/videos/test.mp4" controls className="w-full rounded-xl"></video>`

---

### Step 4: 配置入口 (Hidden Entry)

修改你的 Footer 组件 (`src/components/Footer.jsx`):

```jsx
// ... inside Footer component
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// 在 Footer 内部
const router = useRouter();
const [clickCount, setClickCount] = useState(0);

const handleSecretEntry = () => {
  const newCount = clickCount + 1;
  setClickCount(newCount);
  if (newCount === 5) {
    router.push('/write');
  }
};

// 在你的小黄鸭图标或者 Copyright 文字上绑定
// <div onClick={handleSecretEntry} className="cursor-pointer select-none"> ... </div>

```

---

## 📝 给 AI 编辑器的提示词 (Actionable Prompt)

复制以下内容，让 AI 帮你一次性生成：

```markdown
# Task: Create the "Drafting Table" Editor Page

基于现有的 ERII 博客项目，我们需要增加一个 markdown 文章编辑页面。

## Requirements
1. **Route:** Create a new page at `src/app/write/page.jsx`.
2. **Style:** Use the project's existing "Erii" theme (Paper background `bg-erii-paper`, Red accents `text-erii-red`, Hand-drawn fonts).
3. **Layout:** Split-screen (Left: Textarea Input, Right: Live Preview).
4. **Features:**
   - **Toolbar:** Include buttons for Bold, Italic, Quote, List, Code, Link, Image using `lucide-react`.
   - **Download:** A "Save" button that downloads the content as a `.mdx` file (including frontmatter).
   - **Preview:** Use `react-markdown` and `remark-gfm` to render the right side, applying the `prose` (Tailwind Typography) styles to match the main blog.
5. **Entry Point:** Do NOT add a visible link in the header. We will add a secret trigger later.

## Implementation Details
- Use `"use client"` since this is an interactive page.
- The input textarea should look like a clean sheet of paper (no default borders).
- The preview area must accurately reflect the visual style of the actual blog post page (Header with dashed line, hand-drawn font for titles).

Please proceed with installing `react-markdown` and `remark-gfm`, then create the page code.

```