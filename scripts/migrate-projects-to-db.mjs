/**
 * 迁移项目数据从静态 projects.js 到数据库
 * 用法: node scripts/migrate-projects-to-db.mjs
 */

import { requireDb } from "../src/lib/db.js";

function toPgTextArrayLiteral(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return "{}";
  }
  const escaped = value.map((item) =>
    String(item).replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  );
  return `{${escaped.map((item) => `"${item}"`).join(",")}}`;
}

function toPgJsonbLiteral(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

const PROJECTS = [
  {
    id: "erii",
    name: "Erii",
    tagline: "个人博客与内容主站",
    summary:
      "围绕博客展示、内容组织与阅读体验持续迭代的主站项目，重点优化信息结构与页面质感。",
    status: "持续更新",
    state: "active",
    focus: ["frontend", "tooling"],
    tech: ["Next.js", "React", "Vercel"],
    cover: "/images/projects/erii.webp",
    featured: false,
    links: [
      { label: "在线体验", href: "https://blog.sunandyu.top/", external: true },
      { label: "GitHub", href: "https://github.com/LZY-Ricardo/Erii", external: true },
    ],
  },
  {
    id: "unmark",
    name: "Unmark",
    tagline: "信息标注与内容整理工具",
    summary: "用于高频信息记录、标注和整理的效率工具，强调简洁交互与清晰流程。",
    status: "持续更新",
    state: "active",
    focus: ["tooling", "frontend"],
    tech: ["React", "TypeScript", "UI"],
    cover: "/images/projects/unmark-real-v2.webp",
    featured: true,
    links: [
      { label: "在线体验", href: "https://unmark.ricardoiyu.top/", external: true },
      { label: "GitHub", href: "https://github.com/LZY-Ricardo/Unmark", external: true },
    ],
  },
  {
    id: "pet-hub",
    name: "PetHub",
    tagline: "宠物管理与服务平台",
    summary: "面向宠物领养、走失发布与社区互动场景构建的全栈平台，强调业务流程完整性与信息协同。",
    status: "开发中",
    state: "building",
    focus: ["frontend", "tooling"],
    tech: ["React 18", "Ant Design 5", "Node.js", "Koa 2", "MySQL"],
    cover: "/images/projects/pet.webp",
    featured: false,
    links: [{ label: "GitHub", href: "https://github.com/LZY-Ricardo/PetHub", external: true }],
  },
  {
    id: "free-video-download",
    name: "VidGrab",
    tagline: "Vue 3 + FastAPI 多平台视频下载器",
    summary:
      "基于 Vue 3、FastAPI 与 yt-dlp 的多平台视频下载项目，支持 YouTube、Bilibili、TikTok 等平台，持续迭代下载流程、格式选择与任务反馈体验。",
    status: "持续开发",
    state: "building",
    focus: ["tooling"],
    tech: ["Vue 3", "FastAPI", "yt-dlp"],
    cover: "/images/projects/free-video-download.webp",
    featured: false,
    links: [
      { label: "在线体验", href: "https://vidgrab.sunandyu.top/", external: true },
      { label: "GitHub", href: "https://github.com/LZY-Ricardo/free-video-download", external: true },
    ],
  },
  {
    id: "ai-chat-notify",
    name: "ai-chat-notify",
    tagline: "AI 消息通知与会话协同",
    summary: "围绕会话提醒、通知分发和响应效率构建的 AI 工具，服务高频对话场景。",
    status: "进行中",
    state: "building",
    focus: ["ai", "tooling"],
    tech: ["AI", "Notification", "Workflow"],
    cover: "/images/projects/ai-chat-notify-v2.webp",
    featured: false,
    links: [{ label: "GitHub", href: "https://github.com/LZY-Ricardo/ai-chat-notify", external: true }],
  },
  {
    id: "wardrobe-little-ai",
    name: "Wardrobe-Little-AI",
    tagline: "智能穿搭场景 AI 应用",
    summary: "结合图像识别与推荐交互，探索 AI 在日常穿搭决策中的可解释体验。",
    status: "研究中",
    state: "research",
    focus: ["ai", "frontend"],
    tech: ["AI", "React", "Recommendation"],
    cover: "/images/projects/file_1772469201085_918.webp",
    featured: true,
    links: [
      { label: "在线体验", href: "https://wardrobe-little-ai.vercel.app/", external: true },
      { label: "GitHub", href: "https://github.com/LZY-Ricardo/Wardrobe-Little-AI", external: true },
    ],
  },
  {
    id: "ricardo-low-code-platform-frontend",
    name: "Ricardo_low-code-platform-frontend",
    tagline: "低代码平台前端实现",
    summary: "面向可视化搭建与页面编排场景的前端工程，强调配置能力与编辑体验一致性。",
    status: "进行中",
    state: "building",
    focus: ["frontend", "tooling"],
    tech: ["React", "TypeScript", "Low-Code"],
    cover: "/images/projects/ricardo-low-code-platform-frontend-v2.webp",
    featured: false,
    links: [
      { label: "在线体验", href: "https://lingocode.ricardolzy.top/", external: true },
      {
        label: "GitHub",
        href: "https://github.com/LZY-Ricardo/Ricardo_low-code-platform-frontend",
        external: true,
      },
    ],
  },
  {
    id: "react-playground",
    name: "React-Playground",
    tagline: "React 组件与交互实验场",
    summary: "用于验证组件模式、状态管理和交互细节的实验仓库，支持快速试验与沉淀。",
    status: "持续更新",
    state: "active",
    focus: ["frontend"],
    tech: ["React", "Hooks", "UI"],
    cover: "/images/projects/react-playground-v2.webp",
    featured: true,
    links: [
      { label: "在线体验", href: "https://play.ricardolzy.top/", external: true },
      { label: "GitHub", href: "https://github.com/LZY-Ricardo/React-Playground", external: true },
    ],
  },
  {
    id: "zen-reader",
    name: "zenReader",
    tagline: "沉浸式阅读体验项目",
    summary: "围绕排版、留白与滚动节奏构建的前端项目，强调长内容浏览舒适度。",
    status: "持续更新",
    state: "active",
    focus: ["frontend"],
    tech: ["React", "Reader UI", "Typography"],
    cover: "/images/projects/zen-reader-v2.webp",
    featured: false,
    links: [{ label: "GitHub", href: "https://github.com/LZY-Ricardo/zenReader", external: true }],
  },
  {
    id: "chroma-study",
    name: "ChromaStudy",
    tagline: "学习与知识组织系统",
    summary: "聚焦学习路径梳理、笔记结构化与复盘闭环，探索 AI 辅助知识管理能力。",
    status: "研究中",
    state: "research",
    focus: ["ai", "tooling"],
    tech: ["Knowledge", "AI", "Notes"],
    cover: "/images/projects/chroma-study-v2.webp",
    featured: false,
    links: [
      { label: "在线体验", href: "https://chromastudy.ricardolzy.top/", external: true },
      { label: "GitHub", href: "https://github.com/LZY-Ricardo/ChromaStudy", external: true },
    ],
  },
  {
    id: "mind-nexus",
    name: "MindNexus",
    tagline: "思维连接与任务编排",
    summary: "面向发散思考与任务收敛场景构建的效率项目，强调跨主题关联与结构化管理。",
    status: "进行中",
    state: "building",
    focus: ["ai", "tooling"],
    tech: ["Mindmap", "AI", "Workflow"],
    cover: "/images/projects/mind-nexus-v2.webp",
    featured: false,
    links: [{ label: "GitHub", href: "https://github.com/LZY-Ricardo/MindNexus", external: true }],
  },
  {
    id: "time-sequence",
    name: "timeSequence",
    tagline: "时间序列与节奏管理工具",
    summary: "聚焦时间流、阶段追踪与进度可视化的工具项目，用于任务规划与节奏管理。",
    status: "维护中",
    state: "active",
    focus: ["tooling"],
    tech: ["Timeline", "Data", "Visualization"],
    cover: "/images/projects/time-sequence-v2.webp",
    featured: false,
    links: [{ label: "GitHub", href: "https://github.com/LZY-Ricardo/timeSequence", external: true }],
  },
  {
    id: "ricardo-notebook",
    name: "Ricardo_notebook",
    tagline: "个人技术笔记仓库",
    summary: "集中记录项目实战、问题排查与方案沉淀，方便经验复盘与长期积累。",
    status: "持续更新",
    state: "active",
    focus: ["tooling"],
    tech: ["Markdown", "Knowledge Base", "Notes"],
    cover: "/images/projects/ricardo-notebook-v2.webp",
    featured: false,
    links: [{ label: "GitHub", href: "https://github.com/LZY-Ricardo/Ricardo_notebook", external: true }],
  },
  {
    id: "brainstorming-challenge",
    name: "brainstorming-challenge",
    tagline: "创意冲刺挑战项目",
    summary: "通过题目驱动与快速迭代训练创意到落地的能力，强化实践闭环。",
    status: "进行中",
    state: "building",
    focus: ["ai", "tooling"],
    tech: ["Challenge", "Idea", "Experiment"],
    cover: "/images/projects/brainstorming-challenge-v2.webp",
    featured: false,
    links: [
      {
        label: "在线体验",
        href: "https://aicoding.juejin.cn/pens/7517144837105057826",
        external: true,
      },
      {
        label: "GitHub",
        href: "https://github.com/LZY-Ricardo/brainstorming-challenge",
        external: true,
      },
    ],
  },
  {
    id: "dragon-game",
    name: "DragonGame",
    tagline: "龙族主题玩法练习",
    summary: "围绕玩法逻辑、操作反馈和氛围表达构建的前端项目，探索主题内容与可玩性的结合。",
    status: "持续更新",
    state: "active",
    focus: ["frontend"],
    tech: ["Game", "Frontend", "Interaction"],
    cover: "/images/projects/dragon-game-v2.webp",
    featured: false,
    links: [
      {
        label: "在线体验",
        href: "https://aicoding.juejin.cn/pens/7514759300158324746",
        external: true,
      },
      { label: "GitHub", href: "https://github.com/LZY-Ricardo/DragonGame", external: true },
    ],
  },
  {
    id: "aidevhub",
    name: "AIDevHub",
    tagline: "MCP Server 配置管理桌面应用",
    summary: "用于集中管理 Claude Code 与 OpenAI Codex 的 MCP server 配置，支持查看、启用/禁用、新增、编辑、Profile 切换，并提供写入前 diff 预览与自动备份/回滚。",
    status: "开发中",
    state: "building",
    focus: ["tooling", "ai"],
    tech: ["Tauri", "Rust", "React", "TypeScript"],
    cover: "/images/projects/aidevhub.png",
    featured: true,
    links: [{ label: "GitHub", href: "https://github.com/LZY-Ricardo/AIDevHub", external: true }],
  },
  {
    id: "claude-wsl-bridge",
    name: "claude-wsl-bridge",
    tagline: "Claude Code 的 WSL/Windows 剪贴板桥接工具",
    summary: "在 WSL 环境中为 Claude Code 提供 Windows 剪贴板图片桥接能力，解决跨平台的图片粘贴问题。",
    status: "维护中",
    state: "active",
    focus: ["tooling"],
    tech: ["Shell", "Node.js", "CLI", "WSL"],
    cover: "/images/projects/claude-wsl-bridge.png",
    featured: false,
    links: [{ label: "GitHub", href: "https://github.com/LZY-Ricardo/claude-wsl-bridge", external: true }],
  },
  {
    id: "gittrans",
    name: "GitTrans",
    tagline: "GitHub 数据同步与转换工具",
    summary: "基于 Next.js 构建的 GitHub 数据同步工具，集成 Prisma 与 Octokit，提供仓库数据管理和转换能力。",
    status: "开发中",
    state: "building",
    focus: ["tooling", "frontend"],
    tech: ["Next.js", "Prisma", "TypeScript", "Octokit"],
    cover: "/images/projects/gittrans.png",
    featured: false,
    links: [{ label: "GitHub", href: "https://github.com/LZY-Ricardo/GitTrans", external: true }],
  },
];

async function migrateProjects() {
  const db = requireDb();
  console.log("开始迁移项目数据...\n");

  for (let i = 0; i < PROJECTS.length; i++) {
    const project = PROJECTS[i];
    const sortOrder = i + 1;

    try {
      await db.sql`
        INSERT INTO projects (
          id, name, tagline, summary, status, state,
          focus, tech, cover, featured, links, sort_order
        ) VALUES (
          ${project.id}, ${project.name}, ${project.tagline}, ${project.summary},
          ${project.status}, ${project.state},
          ${toPgTextArrayLiteral(project.focus)}, ${toPgTextArrayLiteral(project.tech)},
          ${project.cover}, ${project.featured},
          ${toPgJsonbLiteral(project.links)}, ${sortOrder}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          tagline = EXCLUDED.tagline,
          summary = EXCLUDED.summary,
          status = EXCLUDED.status,
          state = EXCLUDED.state,
          focus = EXCLUDED.focus,
          tech = EXCLUDED.tech,
          cover = EXCLUDED.cover,
          featured = EXCLUDED.featured,
          links = EXCLUDED.links,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW()
      `;

      console.log(`✓ ${project.name} (${project.id})`);
    } catch (error) {
      console.error(`✗ ${project.name} 失败:`, error.message);
    }
  }

  console.log("\n迁移完成！");
}

migrateProjects().catch(console.error);
