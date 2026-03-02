export function inferCategoryFromPost(post) {
  const title = String(post?.frontmatter?.title ?? "");
  const tags = Array.isArray(post?.frontmatter?.tags) ? post.frontmatter.tags.join(" ") : "";
  const text = `${title} ${tags}`.toLowerCase();

  const rules = [
    { category: "TeamSpeak", keywords: ["team", "teamspeak", "语音", "ts"] },
    { category: "影视", keywords: ["影视", "movie", "film", "video"] },
    { category: "直播", keywords: ["直播", "stream", "obs"] },
    { category: "音乐", keywords: ["音乐", "music"] },
    { category: "游戏", keywords: ["游戏", "game"] },
    { category: "电脑技巧", keywords: ["电脑", "tech", "教程", "frontend", "javascript", "typescript"] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.category;
    }
  }

  return "未分类";
}

const TECH_TOPIC_KEYWORDS = [
  "前端",
  "frontend",
  "react",
  "vue",
  "next",
  "css",
  "javascript",
  "typescript",
  "ai",
  "人工智能",
  "大模型",
  "llm",
  "agent",
  "prompt",
];

function isTechPost(post) {
  if (inferCategoryFromPost(post) === "电脑技巧") return true;

  const title = String(post?.frontmatter?.title ?? "").toLowerCase();
  const description = String(post?.frontmatter?.description ?? "").toLowerCase();
  const tags = Array.isArray(post?.frontmatter?.tags)
    ? post.frontmatter.tags.map((item) => String(item).toLowerCase())
    : [];
  const text = `${title} ${description} ${tags.join(" ")}`;

  return TECH_TOPIC_KEYWORDS.some((keyword) => text.includes(keyword));
}

const CATEGORY_DISPLAY_LABELS = {
  TeamSpeak: "TeamSpeak",
  影视: "影视",
  未分类: "未分类",
  游戏: "游戏",
  电脑技巧: "电脑技巧",
  音乐: "音乐",
  直播: "直播",
};

export function getCategoryThemeLabel(category) {
  const raw = String(category ?? "").trim();
  if (!raw) return "未分类";
  return CATEGORY_DISPLAY_LABELS[raw] ?? raw;
}

export function filterPostsByTaxonomy(posts, { category, tag, topic } = {}) {
  const categoryValue = String(category ?? "").trim();
  const tagValue = String(tag ?? "").trim();
  const topicValue = String(topic ?? "").trim().toLowerCase();

  return (posts ?? []).filter((post) => {
    if (topicValue === "tech" && !isTechPost(post)) {
      return false;
    }

    if (categoryValue && inferCategoryFromPost(post) !== categoryValue) {
      return false;
    }

    if (tagValue) {
      const tags = Array.isArray(post?.frontmatter?.tags)
        ? post.frontmatter.tags.map((item) => String(item))
        : [];
      if (!tags.includes(tagValue)) return false;
    }

    return true;
  });
}
