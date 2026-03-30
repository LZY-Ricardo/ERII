const SITE_URL = "https://blog.sunandyu.top";

// 主流 AI 爬虫列表（允许全量访问，提升 GEO 引用率）
const AI_BOTS = [
  "GPTBot",
  "Google-Extended",
  "PerplexityBot",
  "ClaudeBot",
  "anthropic-ai",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "FacebookBot",
  "cohere-ai",
  "Diffbot",
  "ImagesiftBot",
  "Omgilibot",
  "YouBot",
];

export default function robots() {
  return {
    rules: [
      // 通用规则：允许全站，屏蔽后台
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/write", "/admin", "/api/"],
      },
      // AI 爬虫：明确允许全站公开内容
      ...AI_BOTS.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: ["/write", "/admin", "/api/"],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
