import { NextResponse } from "next/server";
import { getSpotifyPublicUrl, parseSpotifyUri } from "@/src/lib/music";

export const dynamic = "force-dynamic";

function parseHtmlTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  if (!match?.[1]) {
    return "";
  }

  return match[1]
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function deriveSubtitleFromTitle(pageTitle, fallbackTitle) {
  if (!pageTitle) {
    return "";
  }

  const normalized = pageTitle.replace(/\s*\|\s*Spotify\s*$/i, "").trim();

  if (normalized.includes(" - song and lyrics by ")) {
    return normalized.split(" - song and lyrics by ")[1]?.trim() ?? "";
  }

  if (normalized.startsWith(`${fallbackTitle} - `)) {
    return normalized.slice(fallbackTitle.length + 3).trim();
  }

  const segments = normalized.split(" - ").map((segment) => segment.trim()).filter(Boolean);
  if (segments.length > 1) {
    return segments.slice(1).join(" · ");
  }

  return "";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const uri = searchParams.get("uri") ?? "";
  const parsed = parseSpotifyUri(uri);
  const publicUrl = getSpotifyPublicUrl(uri);

  if (!parsed || !publicUrl) {
    return NextResponse.json({ error: "Invalid Spotify URI." }, { status: 400 });
  }

  try {
    const [oembedResponse, pageResponse] = await Promise.all([
      fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(publicUrl)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
        next: { revalidate: 86400 },
      }),
      fetch(publicUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html",
        },
        next: { revalidate: 86400 },
      }),
    ]);

    if (!oembedResponse.ok) {
      throw new Error(`Spotify oEmbed failed: ${oembedResponse.status}`);
    }

    const oembed = await oembedResponse.json();
    const pageTitle = pageResponse.ok ? parseHtmlTitle(await pageResponse.text()) : "";
    const title = oembed?.title?.trim() || "正在播放此歌单";
    const subtitle = deriveSubtitleFromTitle(pageTitle, title);

    return NextResponse.json({
      type: parsed.type,
      id: parsed.id,
      title,
      subtitle,
      coverUrl: oembed?.thumbnail_url || "",
      url: publicUrl,
    });
  } catch (error) {
    console.error("[spotify-meta] failed to resolve metadata:", error);
    return NextResponse.json(
      {
        type: parsed.type,
        id: parsed.id,
        title: "正在播放此歌单",
        subtitle: "",
        coverUrl: "",
        url: publicUrl,
      },
      { status: 200 }
    );
  }
}
