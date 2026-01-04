这是一个非常有品位的决定。上杉绘梨衣（Uesugi Erii）作为蛇岐八家的内三家家主，她的背景带有浓厚的**日本神道教（Shinto）**色彩。

将单纯的手绘风升级为**“和风（Wafu）+ 中式（Sinic）”**的混合风格，能让整个博客产生质的飞跃——从一个“可爱的笔记本”进化为一种**“轻小说般的沉浸式阅读体验”**。

为了实现这种风格，我们需要引入以下元素：

1. **竖排文字（Tategaki）：** 日本文学的灵魂。我们可以在标题或装饰性文字上使用竖排。
2. **衬线体（Mincho/Song Ti）：** 现在的字体太圆润可爱，为了体现“宿命感”和“日系轻小说感”，正文和标题应该引入**宋体/明朝体**。
3. **和风配色：** 使用**朱色（Torii Red）**代替普通的红，使用**生成色（Kinari，未漂白的纸色）**代替米白。
4. **UI 隐喻：** 编辑器的工具栏可以设计成**御守（Omamori）**或**绘马（Ema）**的样式。

以下是为您重新规划的**和风版**开发文档。

---

# ERII | Project: Wafu Editor (和风绘卷)

> **Module:** Article Editor & Style Refactor
> **Theme:** "The Shrine Maiden's Scroll" (Miko, Washi Paper, Vertical Typography)
> **Style:** Japanese-Chinese Fusion (Light Novel Aesthetic)

---

## ⛩️ 1. 视觉升级：和风设计语言 (Design System)

在开始写代码前，我们需要调整全局的视觉基调，使其符合“绘梨衣”的日系身份。

### 1.1 字体策略 (Typography)

* **混合字体栈:** 我们需要同时引入中日字库，打造“轻小说”质感。
* **标题 (Display):** `Noto Serif JP` (日文衬线) + `Noto Serif SC` (中文宋体)。*宋体自带一种凄美和正式感。*
* **正文 (Body):** 保持易读性，使用 `Zen Maru Gothic` (日系圆体) 或原本的 `ZCOOL KuaiLe`。
* **代码/编辑器:** `JetBrains Mono` (保持极客感)。



### 1.2 新配色方案 (Nippon Colors)

* **朱 (Shu-iro):** `#ff4d40` —— 鸟居的颜色，比之前的红色更偏橘一点点，神圣感更强。
* **生成 (Kinari):** `#fbfaf5` —— 最纯粹的日本和纸颜色。
* **墨 (Sumi):** `#1a1a1a` —— 书法墨色，非纯黑。
* **樱鼠 (Sakuranezumi):** `#e6cde3` —— 带有灰调的粉色，不俗气。

---

## 📍 2. 入口设计：神隐 (Hidden Entry)

* **位置:** 页脚 (Footer)。
* **交互:** 页面底部原本的小黄鸭，点击后会发出 **"Kwa!"** 的气泡文字。连续点击 5 次，屏幕两侧拉开**障子门 (Shoji Screen)** 动画，跳转进入编辑器。

---

## 🎨 3. 编辑页设计：绘卷 (The Scroll)

页面路由：`/write`

### 3.1 布局逻辑 (参考图 1)

采用 **左右分栏**，但在中间加一道**竖向分割线**（模拟书脊）。

* **顶部栏 (The Beam):**
* 左侧：**“无题の稿”** (竖排显示)。
* 右侧：发布按钮设计成**“奉纳”** (Offer/Submit) 的样式，形状像一块木质绘马。


* **左侧 (输入区):**
* 背景纯净，光标颜色为**朱色**。


* **右侧 (预览区):**
* **完全模拟轻小说排版**。标题可以使用竖排 (`writing-mode: vertical-rl`)，正文横排。



### 3.2 辅助功能键 (Toolbar)

工具栏悬浮在顶部或底部，图标风格化：

* **图片:** 图标改为“山水画”图标。
* **链接:** 图标改为“结缘绳”样式。
* **引用:** 图标改为“引号”(`「」`)。

---

## 🛠 4. 开发实现指南 (MD)

请复制以下内容给 AI。

```markdown
# Development Task: Wafu Style Editor & Refactor

We are refactoring the blog to a "Japanese-Chinese Fusion" style (Uesugi Erii theme) and adding a Markdown Editor.

## 1. Style Refactor (Global)

### Tailwind Config Update (`tailwind.config.js`)
Update the theme to use Traditional Japanese Colors and Fonts.

```javascript
module.exports = {
  // ...
  theme: {
    extend: {
      colors: {
        wafu: {
          shu: '#ff4d40',    // Vermilion (Torii gate)
          paper: '#fbfaf5',  // Washi paper (Background)
          sumi: '#1a1a1a',   // Ink (Text)
          sakura: '#fedfe1', // Cherry blossom
          indigo: '#2e4b71', // Indigo dye (Accents)
        }
      },
      fontFamily: {
        // Import these from Google Fonts in layout.jsx
        serif: ['"Noto Serif JP"', '"Noto Serif SC"', 'serif'], // For Titles
        sans: ['"Zen Maru Gothic"', 'sans-serif'], // For UI
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        // Subtle noise texture for paper feel
        'washi-texture': "url('[https://www.transparenttextures.com/patterns/natural-paper.png](https://www.transparenttextures.com/patterns/natural-paper.png)')",
      }
    }
  }
}

```

## 2. The Editor Page (`src/app/write/page.jsx`)

### Requirements

* **Layout:** Split screen (50% Input / 50% Preview).
* **Aesthetic:** Minimalist Zen style.
* **Libs:** `react-markdown`, `remark-gfm`.

### Code Structure Suggestion

```jsx
"use client";
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Image, Link2, Quote, Code, Save, Send } from 'lucide-react'; 

export default function WafuEditor() {
  const [content, setContent] = useState("# 这里的标题会自动竖排\n\n在此处开始书写你的故事...");
  
  // Custom Renderers for ReactMarkdown to enforce Wafu style in Preview
  const renderers = {
    h1: ({node, ...props}) => (
      // 竖排标题效果
      <h1 className="font-serif text-4xl text-wafu-shu mb-8 font-bold border-l-4 border-wafu-shu pl-4 py-2" {...props} />
    ),
    p: ({node, ...props}) => (
      <p className="font-sans text-wafu-sumi leading-relaxed mb-6 tracking-wide" {...props} />
    ),
    blockquote: ({node, ...props}) => (
      <blockquote className="border-l-4 border-wafu-indigo/30 pl-4 italic text-slate-500 bg-slate-50/50 py-2 rounded-r" {...props} />
    ),
    // ... add image renderer to handle local paths if needed
  };

  return (
    <div className="min-h-screen bg-wafu-paper bg-washi-texture text-wafu-sumi flex flex-col">
      
      {/* --- Top Bar: The Shrine Beam --- */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-wafu-sumi/10 sticky top-0 bg-wafu-paper/90 backdrop-blur z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-wafu-shu text-white flex items-center justify-center font-serif font-bold">
            稿
          </div>
          <span className="font-serif text-lg tracking-widest text-slate-400">DRAFTING...</span>
        </div>
        
        <div className="flex gap-2">
           {/* "奉纳" (Submit) Button */}
           <button 
             onClick={() => {/* download logic */}}
             className="flex items-center gap-2 bg-wafu-sumi text-white px-6 py-2 rounded-sm font-serif hover:bg-wafu-shu transition-colors duration-500"
           >
             <span className="writing-mode-vertical text-xs mr-1 opacity-50">保存</span>
             <span>奉纳</span>
           </button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Input (The Inkstone) */}
        <div className="w-1/2 h-full flex flex-col border-r border-wafu-sumi/10">
          {/* Toolbar */}
          <div className="h-10 border-b border-dashed border-wafu-sumi/10 flex items-center px-4 gap-4 text-slate-400 bg-white/40">
            <button className="hover:text-wafu-shu transition-colors" title="插入图片"><Image size={18}/></button>
            <button className="hover:text-wafu-shu transition-colors" title="插入链接"><Link2 size={18}/></button>
            <button className="hover:text-wafu-shu transition-colors" title="引用"><Quote size={18}/></button>
            <button className="hover:text-wafu-shu transition-colors" title="代码"><Code size={18}/></button>
          </div>
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full p-8 bg-transparent outline-none resize-none font-mono text-sm leading-loose text-slate-700 selection:bg-wafu-shu/20"
            placeholder="Write something..."
            spellCheck={false}
          />
        </div>

        {/* Right: Preview (The Scroll) */}
        <div className="w-1/2 h-full overflow-y-auto p-12 bg-wafu-paper">
          <div className="prose prose-slate max-w-none">
            {/* The preview area MUST mirror the actual blog post styling */}
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={renderers}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

```

## 3. Media Logic (Images/Video)

Since we are file-system based:

* **Button Logic:** Clicking the Image button in toolbar should inject markdown: `![Description](/images/place-your-image-here.jpg)`.
* **User Instruction:** You need to manually drag images into `public/images` folder in VS Code. The editor is for text structure and previewing.

## 4. Execution Plan

1. **Install Fonts:** Update `layout.jsx` to load `Noto Serif JP` and `Zen Maru Gothic` from Google Fonts.
2. **Update Colors:** Apply the `wafu` color palette in Tailwind.
3. **Create Page:** Implement `src/app/write/page.jsx` with the split-screen layout.

```

---

### 💡 针对“中日混合风格”的特别提示 (Prompt for AI)

请将下面这段话加在给 AI 的 Prompt 最后，确保它理解你的审美需求：

> **Style Note:**
> The design should be **"Modern Wafu" (New Japanese Style)** mixed with Chinese aesthetics.
> - **Fonts:** Use **Serif (Song Ti/Mincho)** for headings to create a serious, novel-like atmosphere, but keep **Sans-serif (Gothic)** for body text for readability.
> - **Vertical Text:** The page title or decorative elements should support `writing-mode: vertical-rl`.
> - **Atmosphere:** It should feel like writing in a quiet room on high-quality paper. Not too cartoonish, more elegant.

```