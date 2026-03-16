const LEGACY_GENERIC_CATEGORY = "技术分享";

const PRIMARY_TECH_CATEGORY_OPTIONS = ["前端", "AI", "后端", "算法", "其他"];
const SECONDARY_CATEGORY_OPTIONS = ["TeamSpeak", "电脑技巧", "直播", "游戏", "音乐", "影视"];

export const POST_CATEGORY_OPTIONS = [
  "未分类",
  ...PRIMARY_TECH_CATEGORY_OPTIONS,
  ...SECONDARY_CATEGORY_OPTIONS,
];

export const POST_CATEGORY_DISPLAY_ORDER = [
  ...PRIMARY_TECH_CATEGORY_OPTIONS,
  ...SECONDARY_CATEGORY_OPTIONS,
  "未分类",
];

const TECH_TOPIC_CATEGORIES = new Set([
  ...PRIMARY_TECH_CATEGORY_OPTIONS,
  "TeamSpeak",
  "电脑技巧",
]);

const FRONTEND_PATTERNS = [
  /前端/i,
  /\bfrontend\b/i,
  /\breact\b/i,
  /\bvue\b/i,
  /\bnext\b/i,
  /\bcss\b/i,
  /\bhtml\b/i,
  /\bjavascript\b/i,
  /\bjs\b/i,
  /\btypescript\b/i,
  /\bjsx\b/i,
  /\bhooks?\b/i,
  /\bredux\b/i,
  /\brouter\b/i,
  /\bwebpack\b/i,
  /\bvite\b/i,
  /\bfiber\b/i,
  /事件循环/i,
  /闭包/i,
  /原型/i,
  /\bbind\b/i,
  /作用域/i,
  /迭代器/i,
  /类型转换/i,
  /类型判断/i,
  /深浅拷贝/i,
  /虚拟列表/i,
  /keepalive/i,
  /懒加载/i,
  /跨域/i,
  /布局/i,
  /定位/i,
  /\bvw\b/i,
  /\brem\b/i,
  /ajax/i,
  /promise/i,
  /generator/i,
  /async\/await/i,
  /回调地狱/i,
  /\bthis\b/i,
  /下拉刷新/i,
  /防抖/i,
  /性能优化/i,
  /缓存策略/i,
  /观察者模式/i,
  /发布订阅/i,
  /并发控制/i,
  /异步/i,
];

const AI_PATTERNS = [
  /\bai\b/i,
  /人工智能/i,
  /大模型/i,
  /\bllm\b/i,
  /\bagent\b/i,
  /智能体/i,
  /\bprompt\b/i,
  /deepseek/i,
  /豆包/i,
  /function\s*call/i,
  /\bfunctioncall\b/i,
  /\bcoze\b/i,
  /\btts\b/i,
  /语音助手/i,
  /火山引擎/i,
];

const BACKEND_PATTERNS = [
  /\bnode\.?js\b/i,
  /\bnode\b/i,
  /\bjava\b/i,
  /后端/i,
  /数据库/i,
  /\bjwt\b/i,
  /http模块/i,
  /\bexpress\b/i,
  /多线程/i,
  /服务端/i,
  /鉴权/i,
  /登录/i,
];

const ALGORITHM_PATTERNS = [
  /\bleetcode\b/i,
  /算法/i,
  /二分/i,
  /链表/i,
  /二叉树/i,
  /动态规划/i,
  /回文/i,
  /滑动窗口/i,
  /单调栈/i,
  /栈/i,
  /队列/i,
  /递归/i,
  /双指针/i,
  /爬楼梯/i,
  /字符串/i,
  /矩阵/i,
  /数组/i,
  /排序/i,
  /打家劫舍/i,
  /子序列/i,
];

const OTHER_PATTERNS = [
  /低代码/i,
  /项目/i,
  /实战/i,
  /播放器/i,
  /天气应用/i,
  /问卷/i,
  /龙族/i,
  /豆瓣/i,
  /冰球/i,
  /打字挑战/i,
  /\bgit\b/i,
  /vibe coding/i,
];

const TECH_TOPIC_PATTERNS = [
  ...FRONTEND_PATTERNS,
  ...AI_PATTERNS,
  ...BACKEND_PATTERNS,
  ...ALGORITHM_PATTERNS,
  ...OTHER_PATTERNS,
];

const CATEGORY_RULES = [
  {
    category: "TeamSpeak",
    patterns: [/\bteamspeak\b/i, /team speak/i, /team-speak/i, /\bts3\b/i, /频道/i],
  },
  { category: "AI", patterns: AI_PATTERNS },
  { category: "后端", patterns: BACKEND_PATTERNS },
  { category: "算法", patterns: ALGORITHM_PATTERNS },
  { category: "前端", patterns: FRONTEND_PATTERNS },
  {
    category: "电脑技巧",
    patterns: [/电脑/i, /教程/i, /系统/i, /软件/i, /效率/i, /windows/i, /\bmac\b/i],
  },
  { category: "影视", patterns: [/影视/i, /\bmovie\b/i, /\bfilm\b/i, /\bvideo\b/i] },
  { category: "直播", patterns: [/直播/i, /\bstream\b/i, /\bobs\b/i] },
  { category: "音乐", patterns: [/音乐/i, /\bmusic\b/i] },
  { category: "游戏", patterns: [/游戏/i, /\bgame\b/i] },
  { category: "其他", patterns: OTHER_PATTERNS },
];

const CATEGORY_ALIASES = {
  frontend: "前端",
  "front-end": "前端",
  ai: "AI",
  backend: "后端",
  "back-end": "后端",
  algorithm: "算法",
  algorithms: "算法",
  other: "其他",
  misc: "其他",
  miscellaneous: "其他",
  teamspeak: "TeamSpeak",
  "team speak": "TeamSpeak",
  "team-speak": "TeamSpeak",
  "电脑技术": "电脑技巧",
  "技术分享": LEGACY_GENERIC_CATEGORY,
};

function textMatchesAnyPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

export function normalizeCategoryValue(category) {
  const raw = String(category ?? "").trim();
  if (!raw) return "";

  const exactMatch = POST_CATEGORY_OPTIONS.find(
    (option) => option.toLowerCase() === raw.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  if (raw === LEGACY_GENERIC_CATEGORY) return LEGACY_GENERIC_CATEGORY;

  return CATEGORY_ALIASES[raw.toLowerCase()] ?? "";
}

export function inferCategoryFromText(...values) {
  const normalizedMatches = values
    .map((value) => normalizeCategoryValue(value))
    .filter(Boolean);
  const preferredMatch = normalizedMatches.find(
    (value) => value !== "未分类" && value !== LEGACY_GENERIC_CATEGORY
  );
  if (preferredMatch) return preferredMatch;

  const text = values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ");

  for (const rule of CATEGORY_RULES) {
    if (textMatchesAnyPattern(text, rule.patterns)) {
      return rule.category;
    }
  }

  if (normalizedMatches.includes(LEGACY_GENERIC_CATEGORY)) return "其他";
  return normalizedMatches[0] ?? "未分类";
}

export function inferCategoryFromPost(post) {
  const title = String(post?.frontmatter?.title ?? "");
  const tags = Array.isArray(post?.frontmatter?.tags) ? post.frontmatter.tags.join(" ") : "";
  return inferCategoryFromText(title, tags);
}

function isTechPost(post) {
  const category = inferCategoryFromPost(post);
  if (TECH_TOPIC_CATEGORIES.has(category)) return true;

  const title = String(post?.frontmatter?.title ?? "").toLowerCase();
  const description = String(post?.frontmatter?.description ?? "").toLowerCase();
  const tags = Array.isArray(post?.frontmatter?.tags)
    ? post.frontmatter.tags.map((item) => String(item).toLowerCase())
    : [];
  const text = `${title} ${description} ${tags.join(" ")}`;

  if (tags.some((tag) => normalizeCategoryValue(tag) === LEGACY_GENERIC_CATEGORY)) {
    return true;
  }

  return textMatchesAnyPattern(text, TECH_TOPIC_PATTERNS);
}

const CATEGORY_DISPLAY_LABELS = {
  前端: "前端",
  AI: "AI",
  后端: "后端",
  算法: "算法",
  其他: "其他",
  技术分享: "技术内容",
  TeamSpeak: "TeamSpeak",
  影视: "影视",
  未分类: "未分类",
  游戏: "游戏",
  电脑技巧: "电脑技巧",
  音乐: "音乐",
  直播: "直播",
};

export function getCategoryThemeLabel(category) {
  const normalized = normalizeCategoryValue(category);
  if (normalized) return CATEGORY_DISPLAY_LABELS[normalized] ?? normalized;

  const raw = String(category ?? "").trim();
  if (!raw) return "未分类";
  return CATEGORY_DISPLAY_LABELS[raw] ?? raw;
}

export function filterPostsByTaxonomy(posts, { category, tag, topic } = {}) {
  const categoryValue = normalizeCategoryValue(category) || String(category ?? "").trim();
  const tagValue = String(tag ?? "").trim();
  const topicValue = String(topic ?? "").trim().toLowerCase();

  return (posts ?? []).filter((post) => {
    if (topicValue === "tech" && !isTechPost(post)) {
      return false;
    }

    if (categoryValue) {
      if (categoryValue === LEGACY_GENERIC_CATEGORY) {
        if (!isTechPost(post)) return false;
      } else if (inferCategoryFromPost(post) !== categoryValue) {
        return false;
      }
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
