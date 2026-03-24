import { NextResponse } from "next/server";
import { load } from "cheerio";

export const dynamic = "force-dynamic";

const REPO_URL = "https://github.com";

async function fetchTrending(period = "weekly") {
  const since = period === "monthly" ? "monthly" : "weekly";
  const url = `https://github.com/trending?since=${since}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      next: { revalidate: 3600 }, // 缓存 1 小时
    });

    if (!response.ok) {
      throw new Error(`GitHub trending fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);
    const repos = [];

    $("article.Box-row").each((_, el) => {
      const $el = $(el);

      // 获取仓库所有者和名称
      const fullName = $el.find("h2 a").attr("href")?.slice(1) || "";
      const [owner, name] = fullName.split("/");

      // 获取描述
      const description = $el.find("p").first().text().trim() || "";

      // 获取编程语言
      const language = $el.find('[itemprop="programmingLanguage"]').text().trim() || "";

      // 获取 star 数和本周新增
      const starsText =
        $el
          .find(`a[href="/${fullName}/stargazers"]`)
          .text()
          .match(/[\d,]+/)?.[0] || "0";
      const stars = parseInt(starsText.replace(/,/g, ""), 10);

      // 本周/本月新增 stars
      const periodStarsText = $el.find("span.d-inline-block.float-sm-right").text().trim() || "";
      const periodStarsMatch = periodStarsText.match(/([\d,]+)\s*stars/);
      const periodStars = periodStarsMatch
        ? parseInt(periodStarsMatch[1].replace(/,/g, ""), 10)
        : 0;

      // 获取 fork 数
      const forksText =
        $el
          .find(`a[href="/${fullName}/forks"]`)
          .text()
          .match(/[\d,]+/)?.[0] || "0";
      const forks = parseInt(forksText.replace(/,/g, ""), 10);

      // 获取 avatar
      const avatar = $el.find("img.avatar").attr("src") || "";

      repos.push({
        id: fullName,
        owner,
        name,
        fullName,
        description,
        language,
        stars,
        forks,
        periodStars,
        avatar: avatar.replace(/\?s=\d+/, "?s=200"),
        url: `${REPO_URL}/${fullName}`,
      });
    });

    return repos.slice(0, 5);
  } catch (error) {
    console.error("Failed to fetch trending:", error);
    return [];
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "weekly";

  const repos = await fetchTrending(period);

  return NextResponse.json({
    repos,
    fetchedAt: new Date().toISOString(),
    period,
  });
}
