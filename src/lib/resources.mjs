export const RESOURCE_LIBRARY_INTRO = {
  title: "资源库",
  paragraphs: [
    "这里放的是我在 AI、开发、网络和效率场景里长期使用或持续关注的资源。",
    "不追求收录全面，只保留我愿意公开推荐的那部分。",
    "部分链接带邀请关系，我会明确标注。",
  ],
};

export const RESOURCE_LIBRARY_SECTIONS = [
  {
    id: "ai",
    title: "AI",
    description: "主要是我会持续关注和使用的 AI 开发生态工具。",
    resources: [
      {
        name: "SkillsMP",
        summary: "发现和筛选 Agent Skills。",
        reason:
          "如果你会长期折腾 Claude、Codex、ChatGPT 这类 AI 助手，这类技能市场能帮你更快找到现成能力，而不是每次都从零开始。",
        href: "https://skillsmp.com/zh",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
      {
        name: "getmcp",
        summary: "统一安装和管理 MCP Server。",
        reason:
          "如果你同时在用 Claude、Cursor、VS Code、Codex 这类工具，getmcp 这种统一配置方式能省掉很多重复改配置的时间。",
        href: "https://www.getmcp.es/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
      {
        name: "30aitool",
        summary: "收集 AI、工具、资源和软件的轻量导航站。",
        reason:
          "我会把它当成一个补充型入口来找新工具和新网站，尤其适合想快速扫一遍近期 AI 工具与效率资源的人。",
        href: "https://www.30aitool.com/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
    ],
  },
  {
    id: "development",
    title: "开发",
    description: "偏写作、协作、托管和知识沉淀。",
    resources: [
      {
        name: "Typora",
        summary: "Markdown 写作和技术文档编辑。",
        reason:
          "我更喜欢它这种干净、低打扰的写作体验。写博客、写笔记、整理长文档时都很顺手。",
        href: "https://typora.io/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
      {
        name: "GitHub",
        summary: "代码托管、协作开发和项目管理。",
        reason:
          "无论是个人项目还是多人协作，GitHub 依然是我最常用的平台之一。代码、讨论、PR 和自动化可以放在一起。",
        href: "https://github.com/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
      {
        name: "语雀",
        summary: "文档整理和知识库维护。",
        reason:
          "如果需要把零散内容整理成更适合长期维护的文档体系，语雀这类工具会比普通记笔记更稳定。",
        href: "https://www.yuque.com/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
      {
        name: "Postimages",
        summary: "图床上传和外链托管。",
        reason:
          "如果你平时会写博客、发帖或整理文档，需要快速拿到稳定的图片外链，Postimages 这种轻量图床会比较省事。",
        href: "https://postimages.org/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
    ],
  },
  {
    id: "network",
    title: "网络",
    description: "主要用于海外文档访问、AI 服务连接和日常检索。",
    resources: [
      {
        name: "Mitce",
        summary: "访问海外开发文档、AI 服务和部分国外网站。",
        reason:
          "我自己会在英文资料检索、模型平台访问和海外开发服务连接时使用它。如果你的日常场景也包含这些需求，这类工具会比较实用。",
        href: "https://mitce.net/aff.php?aff=26959",
        actionLabel: "查看入口",
        tags: ["自用推荐", "邀请链接"],
        note: "这是我个人在用的入口，带邀请关系，按自己的实际需求选择即可。",
      },
    ],
  },
  {
    id: "productivity",
    title: "效率",
    description: "尽量少而稳，优先保留真正常用的工具。",
    resources: [
      {
        name: "Notion",
        summary: "管理文档、知识、项目和待办。",
        reason:
          "如果你需要把笔记、资料整理、任务跟踪和协作放到一个地方，Notion 这种一体化工作区会比较省心。",
        href: "https://www.notion.so/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
      {
        name: "PixPin",
        summary: "截图、贴图、长截图和 OCR 标注工具。",
        reason:
          "我很看重它把截图、贴图和标注整合在一起的工作流，写文档、做说明和日常沟通时都能少切很多工具。",
        href: "https://pixpin.cn/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
      {
        name: "剪切助手",
        summary: "用于管理剪贴板历史和提升复制粘贴效率。",
        reason:
          "复制粘贴频率一高，系统剪贴板就不太够用了。这类剪贴板管理工具对资料整理、写作和日常办公都很实用。",
        href: "https://jianqiezhushou.com/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
      {
        name: "123apps",
        summary: "在线音视频与文档处理工具集合。",
        reason:
          "临时做格式转换、裁剪、录音或简单编辑时，我更倾向先用这种在线工具，打开就能用，不需要额外安装。",
        href: "https://123apps.com/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
      {
        name: "QuickLook",
        summary: "在 Windows 上用空格快速预览文件。",
        reason:
          "如果你经常在图片、文档、压缩包和素材之间来回翻，QuickLook 这种快速预览方式能明显减少打开和关闭文件的成本。",
        href: "https://github.com/QL-Win/QuickLook/releases",
        actionLabel: "查看发布页",
        tags: ["自用推荐"],
      },
      {
        name: "TTime",
        summary: "截图翻译、划词翻译和 OCR 翻译工具。",
        reason:
          "查英文资料、看海外页面或处理截图内容时，这类集成 OCR 和多种翻译模式的工具会比来回切网页更高效。",
        href: "https://ttime.timerecord.cn/en/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
      {
        name: "Flow Launcher",
        summary: "Windows 上的快速启动和全局搜索工具。",
        reason:
          "启动应用、查文件、跑命令这类高频动作，我更喜欢交给启动器来做。Flow Launcher 的热键入口和插件生态都很顺手。",
        href: "https://www.flowlauncher.com/",
        actionLabel: "访问官网",
        tags: ["自用推荐"],
      },
    ],
  },
];

export function getResourceSections() {
  return RESOURCE_LIBRARY_SECTIONS;
}

export function getResourceTotal() {
  return RESOURCE_LIBRARY_SECTIONS.reduce(
    (total, section) => total + section.resources.length,
    0
  );
}
