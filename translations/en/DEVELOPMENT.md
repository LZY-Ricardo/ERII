# ERII | Eri - Blog Development Guide

> **Project Name:** ERII (Eri’s Journal)  
> **Theme:** "The World is Gentle" (Warm, Hand‑drawn, Miko, Narrative)  
> **Tech Stack:** Next.js 16.1 (App Router) + React 19 + Tailwind CSS  
> **Language:** JavaScript  

---

## 🌸 1. Design Philosophy

This project is not a cold, technical blog, but a **“Eri’s pocket journal”**.  
Core keywords: **gentle, paper‑like texture, red miko outfit, little yellow duck, Sakura**.

### 1.1 Visual System
All UI components must follow the Tailwind configuration below:

* **Colors:**
    * `erii-red`: `#e11d48` (Eri’s hair/miko outfit, used for headings and emphasis)
    * `erii-paper`: `#fdfbf7` (off‑white, simulating sketch‑paper background, global background color)
    * `erii-duck`: `#fcd34d` (rubber‑duck yellow, used for tags and highlight decorations)
    * `erii-ink`: `#374151` (pencil gray, used for body text to avoid pure black)
* **Fonts:**
    * Chinese: `ZCOOL KuaiLe` (ZCOOL Happy Font – Google Fonts) — mimics a handwritten feel.
    * English: `Patrick Hand` (Google Fonts) — mimics journal notes.
* **UI Elements:**
    * **Polaroid Cards:** Article list cards should have a “Polaroid” style (white background, wide white margin at the bottom for a caption, slight tilt effect).
    * **Dashed Lines:** Dividers use dashed lines, simulating torn edges from a notebook.

---

## 🛠 2. Tech Stack

* **Core:** Next.js 16.1.1 (App Router)  
* **Library:** React 19.2.3  
* **Styling:** Tailwind CSS + Google Fonts  
* **Effects:** `canvas-confetti` (used for Sakura easter egg)  
* **Content:** MDX  
* **Deployment:** Vercel  

### 2.1 Setup```bash
# 1. 基础依赖
npm install next-mdx-remote gray-matter date-fns clsx tailwind-merge lucide-react

# 2. 彩蛋特效库
npm install canvas-confetti

# 3. 字体与排版插件
npm install -D @tailwindcss/typography

```### 2.2 Resolve React 19 Dependency Conflict

Edit `package.json` to enforce a unified React version:```json
"overrides": {
  "react": "$react",
  "react-dom": "$react-dom"
}

```## 🚨 3. Next.js 16 Core Development Rules (Strict Rules)

1. **Async Params:** In `page.jsx` and `generateMetadata`, `params` and `searchParams` must be awaited.  
   * ❌ `const slug = params.slug`  
   * ✅ `const { slug } = await params`

2. **Server Components:** By default all components are server components. If you need to use `useState` (e.g., for an Easter‑egg button), you must add `"use client"` at the top of the file.

---

## 🎨 4. Detailed Implementation Guide (Implementation Guide)

### 4.1 Tailwind Configuration (`tailwind.config.js`)

Inject the custom color palette and handwritten font.```javascript
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

```### 4.2 Global Layout (`src/app/layout.jsx`)

Import Google Fonts and apply a “paper background```jsx
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

```### 4.3 Core Component: Polaroid Post Card (`src/components/PostCard.jsx`)```jsx
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

```### 4.4 🌸 Core Feature: Sakura Easter Egg (`src/components/SecretTrigger.jsx`)

This is a floating component. Click it, then enter the password **"Sakura"** to trigger a cherry blossom```jsx
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

```## 📝 5. Content Creation (Writing)

Frontmatter example:```yaml
---
title: "04.24 东京天空树"
date: "2026-01-04"
description: "世界上最暖和的地方在天空树的顶上。"
tags: ["Diary", "Tokyo"]
---

```---

## 🚀 6. Deploy Checklist

1. Ensure `package.json` includes React 19 overrides.  
2. Verify that the color configuration in `tailwind.config.js` is correct.  
3. Confirm that all page components properly handle `await params`.  
4. The Sakura Easter‑egg component has been imported in `layout.jsx` or `page.jsx`.

> **Ending:** “We are all little monsters, and one day we will be slain by the righteous Ultraman.” — But here, your words will be treasured forever like Er