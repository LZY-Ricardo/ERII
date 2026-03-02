import fs from "node:fs";
import path from "node:path";
import { createPool } from "@vercel/postgres";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.join(process.cwd(), ".env.local"));

const posts = [
  {
    slug: "nextjs-16-app-router-practice",
    title: "Next.js 16 App Router 实战笔记",
    date: "2026-03-02",
    description: "从路由结构、数据获取到页面组织的一次完整落地总结。",
    tags: ["前端", "Next.js", "App Router"],
    content:
      "# Next.js 16 App Router 实战笔记\n\n这篇文章记录我在项目里使用 App Router 的实践经验。\n\n## 我关注的三个点\n\n1. 路由分层是否清晰\n2. 页面数据是否按需获取\n3. 组件职责是否可维护\n\n## 一个简单建议\n\n优先把页面拆成“容器 + 展示组件”，后期重构成本会低很多。",
  },
  {
    slug: "react-performance-checklist-2026",
    title: "React 性能优化清单（2026）",
    date: "2026-03-01",
    description: "面向日常业务开发的 React 性能排查与优化清单。",
    tags: ["前端", "React", "性能优化"],
    content:
      "# React 性能优化清单（2026）\n\n性能优化不等于盲目加缓存，先测量再优化。\n\n## 常见排查项\n\n- 不必要的重复渲染\n- 超大组件导致的更新扩散\n- 列表 key 不稳定\n- 重型计算没有做 memo 化\n\n## 我的实践原则\n\n先解决最大瓶颈，再考虑细节优化。",
  },
  {
    slug: "typescript-type-level-patterns",
    title: "TypeScript 类型体操：实用模式总结",
    date: "2026-02-28",
    description: "聚焦业务开发中的高频类型技巧，避免过度设计。",
    tags: ["前端", "TypeScript"],
    content:
      "# TypeScript 类型体操：实用模式总结\n\n类型系统的价值是“提前发现问题”，不是“炫技”。\n\n## 高性价比模式\n\n- 联合类型收敛\n- 映射类型批量约束\n- 条件类型做输入输出推导\n\n## 踩坑提示\n\n当类型定义开始影响阅读体验时，应该退一步简化。",
  },
  {
    slug: "css-layout-modern-guide",
    title: "现代 CSS 布局指南：Grid 与 Flex 的边界",
    date: "2026-02-27",
    description: "梳理 Grid/Flex 各自的使用场景与组合方式。",
    tags: ["前端", "CSS", "布局"],
    content:
      "# 现代 CSS 布局指南：Grid 与 Flex 的边界\n\nGrid 负责二维布局，Flex 负责一维分布。\n\n## 推荐决策\n\n- 页面骨架优先 Grid\n- 组件内部对齐优先 Flex\n- 避免一个容器里混合过多布局职责\n\n## 结论\n\n先画结构图，再写样式，布局会更稳定。",
  },
  {
    slug: "tailwind-large-project-strategy",
    title: "Tailwind 在中大型项目的组织策略",
    date: "2026-02-26",
    description: "从命名、抽象和组件边界看 Tailwind 的可维护性。",
    tags: ["前端", "Tailwind", "工程化"],
    content:
      "# Tailwind 在中大型项目的组织策略\n\nTailwind 好用，但无约束会变成“类名堆叠”。\n\n## 我采用的规则\n\n- 组件层只暴露少量可配置变体\n- 复杂样式提取为语义化封装\n- 统一颜色与间距变量\n\n## 最终目标\n\n样式可读、可改、可复用。",
  },
  {
    slug: "ai-agent-workflow-from-zero",
    title: "从 0 到 1：AI Agent 工作流搭建",
    date: "2026-02-25",
    description: "基于工具调用、上下文管理和反馈闭环的 Agent 实战框架。",
    tags: ["AI", "Agent", "工作流"],
    content:
      "# 从 0 到 1：AI Agent 工作流搭建\n\nAgent 的核心不是“会聊天”，而是“能执行”。\n\n## 三段式设计\n\n1. 任务拆解\n2. 工具调用\n3. 结果校验\n\n## 经验\n\n把失败路径先设计出来，系统稳定性会明显提升。",
  },
  {
    slug: "prompt-engineering-practical-notes",
    title: "Prompt Engineering 实战笔记",
    date: "2026-02-24",
    description: "围绕约束、上下文和输出格式的 Prompt 设计方法。",
    tags: ["AI", "Prompt", "实践"],
    content:
      "# Prompt Engineering 实战笔记\n\n提示词不是玄学，核心是结构化沟通。\n\n## 稳定输出的关键\n\n- 明确角色与目标\n- 限制输出格式\n- 提供参考输入输出\n\n## 一个简单模板\n\n场景 + 目标 + 约束 + 输出格式 + 评估标准。",
  },
  {
    slug: "rag-system-neon-postgres-pgvector",
    title: "用 Neon + pgvector 搭建轻量 RAG",
    date: "2026-02-23",
    description: "从数据建模、检索召回到结果融合的 RAG 最小可用方案。",
    tags: ["AI", "RAG", "Neon", "pgvector"],
    content:
      "# 用 Neon + pgvector 搭建轻量 RAG\n\nRAG 的效果好坏，取决于数据切分和召回质量。\n\n## 最小链路\n\n- 文档切分与向量化\n- 相似度检索\n- 上下文拼接生成\n\n## 优化方向\n\n先优化召回，再优化生成提示词。",
  },
  {
    slug: "frontend-ai-copilot-workbench",
    title: "前端 + AI Copilot 协作工作台设计",
    date: "2026-02-22",
    description: "总结一个前端团队接入 AI 辅助研发的可行工作流。",
    tags: ["前端", "AI", "工程化"],
    content:
      "# 前端 + AI Copilot 协作工作台设计\n\n把 AI 作为“协作者”而不是“替代者”。\n\n## 协作模型\n\n- 人定义需求和边界\n- AI 生成草稿和候选实现\n- 人进行审查与验收\n\n## 目标\n\n提升交付速度，同时守住代码质量底线。",
  },
  {
    slug: "monthly-learning-review-2026-03",
    title: "三月学习复盘：前端与 AI",
    date: "2026-02-21",
    description: "记录本月学习进展、踩坑与下月计划。",
    tags: ["复盘", "前端", "AI"],
    content:
      "# 三月学习复盘：前端与 AI\n\n本月重点放在“可落地实践”，减少纯理论堆积。\n\n## 已完成\n\n- 完成博客三栏布局重构\n- 梳理内容分类与标签体系\n- 建立首批技术文章结构\n\n## 下月计划\n\n继续打磨阅读体验，并补充更多实战案例。",
  },
];

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL / POSTGRES_URL 未配置");
}

const db = createPool({ connectionString });

try {
  for (const post of posts) {
    const cover = `/images/covers/${post.slug}.svg`;
    await db.sql`
      INSERT INTO posts (slug, title, date, description, cover, tags, content, status, updated_at, published_at)
      VALUES (
        ${post.slug},
        ${post.title},
        CAST(${post.date} AS DATE),
        ${post.description},
        ${cover},
        ${post.tags},
        ${post.content},
        'published',
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE
      SET
        title = EXCLUDED.title,
        date = EXCLUDED.date,
        description = EXCLUDED.description,
        cover = EXCLUDED.cover,
        tags = EXCLUDED.tags,
        content = EXCLUDED.content,
        status = 'published',
        updated_at = NOW(),
        published_at = COALESCE(posts.published_at, NOW())
    `;
  }

  const count = await db.sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'published')::int AS published
    FROM posts
  `;

  console.log("Seed finished:", count.rows[0]);
} finally {
  await db.end();
}
