const PROJECTS = [
  {
    id: "erii-blog",
    name: "ERII Blog 3.0",
    tagline: "龙族风技术博客重构",
    summary:
      "基于 Next.js App Router 的三栏博客，持续迭代阅读体验、导航交互、主题视觉与内容管理流程。",
    status: "进行中",
    state: "building",
    focus: ["frontend", "tooling"],
    tech: ["Next.js", "React", "Neon", "Vercel"],
    cover: "/images/covers/frontend-ai-copilot-workbench.svg",
    featured: true,
    links: [
      { label: "在线查看", href: "/" },
      { label: "技术文章", href: "/blog?topic=tech" },
      { label: "GitHub", href: "https://github.com/LZY-Ricardo", external: true },
    ],
  },
  {
    id: "agent-workflow-lab",
    name: "AI Agent Workflow Lab",
    tagline: "从 0 到 1 的 Agent 工作流实验室",
    summary:
      "围绕工具调用、上下文管理与输出结构化，构建可复用的 Agent 工作流模板，聚焦可落地实践。",
    status: "研究中",
    state: "research",
    focus: ["ai"],
    tech: ["OpenAI", "Prompt", "Workflow", "RAG"],
    cover: "/images/covers/ai-agent-workflow-from-zero.svg",
    featured: true,
    links: [
      { label: "专题文章", href: "/blog?tag=Agent" },
      { label: "提示词实践", href: "/blog?tag=Prompt" },
      { label: "GitHub", href: "https://github.com/LZY-Ricardo", external: true },
    ],
  },
  {
    id: "frontend-ai-workbench",
    name: "Frontend AI Workbench",
    tagline: "前端与 AI 协同开发工作台",
    summary:
      "整合 TypeScript 类型约束、组件规范与 AI 协作流程，沉淀一套适合中型项目的工程实践模板。",
    status: "持续更新",
    state: "active",
    focus: ["frontend", "ai"],
    tech: ["TypeScript", "React", "Tailwind", "AI Copilot"],
    cover: "/images/covers/typescript-type-level-patterns.svg",
    featured: true,
    links: [
      { label: "类型体操", href: "/blog?tag=TypeScript" },
      { label: "前端指南", href: "/blog?tag=前端" },
      { label: "GitHub", href: "https://github.com/LZY-Ricardo", external: true },
    ],
  },
  {
    id: "rag-neon-blueprint",
    name: "RAG Neon Blueprint",
    tagline: "Neon + pgvector 的知识问答样板",
    summary:
      "围绕文档切分、向量检索与答案生成，构建可复刻的 RAG 流程，兼顾性能与可维护性。",
    status: "规划中",
    state: "planning",
    focus: ["ai", "tooling"],
    tech: ["Neon", "Postgres", "pgvector", "RAG"],
    cover: "/images/covers/rag-system-neon-postgres-pgvector.svg",
    featured: false,
    links: [
      { label: "RAG 实战", href: "/blog?tag=RAG" },
      { label: "数据库笔记", href: "/blog?tag=Neon" },
    ],
  },
  {
    id: "prompt-practice-kit",
    name: "Prompt Practice Kit",
    tagline: "可复用的提示词模板集",
    summary:
      "沉淀约束表达、上下文拼接、结构化输出等高频模板，降低大模型应用在项目中的试错成本。",
    status: "持续更新",
    state: "active",
    focus: ["ai"],
    tech: ["Prompt", "LLM", "Evaluation"],
    cover: "/images/covers/prompt-engineering-practical-notes.svg",
    featured: false,
    links: [
      { label: "Prompt 笔记", href: "/blog?tag=Prompt" },
      { label: "工作流文章", href: "/blog?tag=工作流" },
    ],
  },
  {
    id: "css-layout-lab",
    name: "CSS Layout Lab",
    tagline: "现代布局方案整理与演练",
    summary:
      "围绕 Grid/Flex、响应式断点与可读性排版，提炼真实项目常见布局问题的可复用解决方案。",
    status: "已上线",
    state: "released",
    focus: ["frontend"],
    tech: ["CSS", "Grid", "Flex", "Responsive"],
    cover: "/images/covers/css-layout-modern-guide.svg",
    featured: false,
    links: [
      { label: "布局指南", href: "/blog?tag=CSS" },
      { label: "Tailwind 策略", href: "/blog?tag=Tailwind" },
    ],
  },
];

export const PROJECT_FOCUS = [
  { value: "all", label: "全部项目" },
  { value: "frontend", label: "前端" },
  { value: "ai", label: "AI" },
  { value: "tooling", label: "工具链" },
];

export function getAllProjects() {
  return PROJECTS;
}

export function getFeaturedProjects(limit = 3) {
  return PROJECTS.filter((item) => item.featured).slice(0, limit);
}

export function filterProjectsByFocus(projects, focus = "all") {
  if (!focus || focus === "all") return projects;
  return projects.filter((item) => Array.isArray(item.focus) && item.focus.includes(focus));
}

