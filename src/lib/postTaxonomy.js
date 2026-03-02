export function inferCategoryFromPost(post) {
  const title = String(post?.frontmatter?.title ?? "");
  const tags = Array.isArray(post?.frontmatter?.tags)
    ? post.frontmatter.tags.join(" ")
    : "";
  const text = `${title} ${tags}`.toLowerCase();

  if (text.includes("team") || text.includes("语音") || text.includes("ts")) {
    return "TeamSpeak";
  }
  if (text.includes("影视") || text.includes("movie") || text.includes("film")) {
    return "影视";
  }
  if (text.includes("直播") || text.includes("stream") || text.includes("obs")) {
    return "直播";
  }
  if (text.includes("音乐") || text.includes("music")) {
    return "音乐";
  }
  if (text.includes("游戏") || text.includes("game")) {
    return "游戏";
  }
  if (text.includes("电脑") || text.includes("tech") || text.includes("教程")) {
    return "电脑技巧";
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

const CATEGORY_THEME_LABELS = {
  TeamSpeak: "执行部通讯",
  影视: "影像档案",
  未分类: "黑天鹅档案",
  游戏: "实战记录",
  电脑技巧: "装备部笔记",
  音乐: "旧日留声",
  直播: "城市夜航",
};

export function getCategoryThemeLabel(category) {
  const raw = String(category ?? "").trim();
  if (!raw) return "黑天鹅档案";
  return CATEGORY_THEME_LABELS[raw] ?? raw;
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
