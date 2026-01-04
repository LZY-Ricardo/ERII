# ERII | 绘梨衣 - Blog Development Guide

> **Project Name:** ERII (绘梨衣の帳)
> **Theme:** "The World is Gentle" (Warm, Hand-drawn, Miko, Narrative)
> **Tech Stack:** Next.js 16.1 (App Router) + React 19 + Tailwind CSS
> **Language:** JavaScript

---

## 🌸 1. 设计哲学 (Design Philosophy)

本项目不是一个冷冰冰的技术博客，而是一本 **“绘梨衣的随身手账”**。
核心关键词：**温柔、纸质感、红色巫女服、小黄鸭、Sakura**。

### 1.1 视觉规范 (Visual System)
所有 UI 组件必须遵循以下 Tailwind 配置：

* **Colors (配色):**
    * `erii-red`: `#e11d48` (绘梨衣的头发/巫女服，用于标题、强调)
    * `erii-paper`: `#fdfbf7` (米白色，模拟素描纸背景，全局背景色)
    * `erii-duck`: `#fcd34d` (橡皮鸭黄，用于 Tag、高亮装饰)
    * `erii-ink`: `#374151` (铅笔灰，用于正文，避免纯黑)
* **Fonts (字体):**
    * 中文：`ZCOOL KuaiLe` (站酷快乐体 - Google Fonts) —— 模拟手写感。
    * 英文：`Patrick Hand` (Google Fonts) —— 模拟手账笔记。
* **UI Elements:**
    * **Polaroid Cards:** 文章列表卡片要做成“拍立得”样式（白底、底部留宽白边写字、轻微倾斜效果）。
    * **Dashed Lines:** 分割线使用虚线，模拟从本子上撕下来的痕迹。

---

## 🛠 2. 技术栈与环境 (Tech Stack)

* **Core:** Next.js 16.1.1 (App Router)
* **Library:** React 19.2.3
* **Styling:** Tailwind CSS + Google Fonts
* **Effects:** `canvas-confetti` (用于 Sakura 彩蛋)
* **Content:** MDX
* **Deployment:** Vercel

### 2.1 依赖安装 (Setup)
```bash
# 1. 基础依赖
npm install next-mdx-remote gray-matter date-fns clsx tailwind-merge lucide-react

# 2. 彩蛋特效库
npm install canvas-confetti

# 3. 字体与排版插件
npm install -D @tailwindcss/typography

```

### 2.2 解决 React 19 依赖冲突

编辑 `package.json`，强制统一 React 版本：

```json
"overrides": {
  "react": "$react",
  "react-dom": "$react-dom"
}

```

---

## 🚨 3. Next.js 16 核心开发规则 (Strict Rules)

1. **Async Params:** 在 `page.jsx` 和 `generateMetadata` 中，`params` 和 `searchParams` 必须带有 `await`。
* ❌ `const slug = params.slug`
* ✅ `const { slug } = await params`


2. **Server Components:** 默认所有组件均为服务端组件。如果需要使用 `useState` (比如彩蛋按钮)，必须在文件顶部添加 `"use client"`。

---

## 🎨 4. 详细实现指南 (Implementation Guide)

### 4.1 Tailwind 配置 (`tailwind.config.js`)

注入绘梨衣专属色板与手写字体。

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        erii: {
          red: '#e11d48',
          paper: '#fdfbf7',
          duck: '#fcd34d',
          ink: '#374151',
        },
      },
      fontFamily: {
        hand: ['"Patrick Hand"', '"ZCOOL KuaiLe"', 'cursive'],
        sans: ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'paper-texture': "url('[https://www.transparenttextures.com/patterns/cream-paper.png](https://www.transparenttextures.com/patterns/cream-paper.png)')", // 可选：纸张纹理
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

```

### 4.2 全局布局 (`src/app/layout.jsx`)

引入 Google Fonts 并应用“纸张背景”。

```jsx
import { Patrick_Hand, ZCOOL_KuaiLe } from 'next/font/google';
import './globals.css';

const patrickHand = Patrick_Hand({ weight: '400', subsets: ['latin'], variable: '--font-hand' });
const zcool = ZCOOL_KuaiLe({ weight: '400', subsets: ['chinese-simplified'], variable: '--font-cn' });

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      {/* 应用纸张色背景和铅笔灰文字 */}
      <body className={`${patrickHand.variable} ${zcool.variable} font-sans bg-erii-paper text-erii-ink antialiased selection:bg-erii-duck selection:text-erii-red`}>
        {children}
      </body>
    </html>
  );
}

```

### 4.3 核心组件：拍立得文章卡片 (`src/components/PostCard.jsx`)

```jsx
import Link from 'next/link';

export default function PostCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group relative block bg-white p-3 pb-8 shadow-md hover:shadow-xl hover:-translate-y-1 hover:rotate-1 transition-all duration-300 border border-slate-100">
      {/* 模拟拍立得的照片区域 */}
      <div className="aspect-video w-full bg-slate-100 overflow-hidden mb-4 relative">
         {/* 这里将来放文章封面图，暂时用色块代替 */}
         <div className="absolute inset-0 bg-erii-duck/20 group-hover:bg-erii-duck/30 transition-colors" />
      </div>
      
      {/* 手写字体标题 */}
      <h2 className="font-hand text-2xl text-erii-ink group-hover:text-erii-red text-center px-2">
        {post.frontmatter.title}
      </h2>
      
      <div className="text-center mt-2 text-xs font-hand text-slate-400">
        {post.frontmatter.date}
      </div>
    </Link>
  );
}

```

### 4.4 🌸 核心功能：Sakura 彩蛋 (`src/components/SecretTrigger.jsx`)

这是一个悬浮组件。点击后输入暗号 "Sakura"，触发樱花雨。

```jsx
"use client"; // 必须是客户端组件
import { useState } from 'react';
import confetti from 'canvas-confetti';
import { Gamepad2 } from 'lucide-react'; // 需要安装 lucide-react

export default function SecretTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');

  const triggerSakura = () => {
    // 触发樱花雨特效 (Confetti 配置为粉色花瓣状)
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ffb7b2', '#ff9aa2'], // 樱花粉
        shapes: ['circle'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ffb7b2', '#ff9aa2'],
        shapes: ['circle'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const checkCode = (e) => {
    e.preventDefault();
    if (code.toLowerCase() === 'sakura') {
      triggerSakura();
      setIsOpen(false);
      alert("Sakura 最好了！🌸");
    } else {
      alert("指令错误...小怪兽听不懂。");
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen ? (
        <form onSubmit={checkCode} className="bg-white p-4 rounded-xl shadow-xl border-2 border-erii-duck animate-in fade-in slide-in-from-bottom-4">
          <p className="font-hand text-erii-red mb-2 text-lg">Who is the best?</p>
          <input 
            type="text" 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border-b-2 border-slate-200 focus:border-erii-red outline-none w-full font-hand text-center"
            placeholder="..."
            autoFocus
          />
        </form>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-erii-red text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
        >
          <Gamepad2 size={24} />
        </button>
      )}
    </div>
  );
}

```

---

## 📝 5. 内容创作 (Writing)

文章头部 (Frontmatter) 示例：

```yaml
---
title: "04.24 东京天空树"
date: "2026-01-04"
description: "世界上最暖和的地方在天空树的顶上。"
tags: ["Diary", "Tokyo"]
---

```

---

## 🚀 6. 部署检查 (Deploy Checklist)

1. 确认 `package.json` 中已添加 React 19 overrides。
2. 确认 `tailwind.config.js` 颜色配置正确。
3. 确认所有页面组件正确处理了 `await params`。
4. Sakura 彩蛋组件已在 `layout.jsx` 或 `page.jsx` 中引入。

> **Ending:** "我们都是小怪兽，有一天会被正义的奥特曼杀死。" —— 但在这里，你的文字会像绘梨衣的玩具一样，被永远珍藏。

```
