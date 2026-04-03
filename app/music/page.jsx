import ArgonShell from "@/src/components/argon/ArgonShell";
import MusicPlaylistCardClient from "@/src/components/MusicPlaylistCardClient";
import { getPublicMusicCatalog } from "@/src/lib/musicCatalog";
import { getSpotifyPlayablePlaylists } from "@/src/lib/music";
import { getSortedPostsData } from "@/src/lib/posts";

/**
 * 获取Spotify封面
 */
async function getSpotifyCover(id) {
  try {
    // 使用Spotify OEmbed API获取歌单信息
    const oembedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/${id}`;
    const res = await fetch(oembedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.thumbnail_url || null;
  } catch {
    return null;
  }
}

const SITE_URL = "https://blog.sunandyu.top";

export const metadata = {
  title: "音乐收藏",
  description: "Ricardo 的音乐收藏页，集中分享 Spotify、QQ 音乐与网易云歌单。",
  keywords: ["Spotify歌单", "QQ音乐歌单", "网易云歌单", "音乐推荐", "精选音乐"],
  alternates: { canonical: `${SITE_URL}/music` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/music`,
    title: "音乐收藏 | 象龟的水坑",
    description: "Ricardo 的多平台音乐收藏页，支持 Spotify 站内播放与歌单分享。",
  },
};

export default async function MusicPage() {
  const posts = await getSortedPostsData();
  const { playlists, musicPlayerEnabled } = await getPublicMusicCatalog();
  const spotifyPlayablePlaylists = getSpotifyPlayablePlaylists(playlists);

  const playlistsWithCovers = await Promise.all(
    playlists.map(async (playlist) => {
      let coverUrl = playlist.coverUrl || null;

      if (!coverUrl && playlist.platform === "spotify") {
        coverUrl = await getSpotifyCover(playlist.id);
      }
      return { ...playlist, coverUrl };
    })
  );

  const pageSubtitleParts = [`${playlistsWithCovers.length} 个已发布歌单`];
  if (spotifyPlayablePlaylists.length > 0) {
    pageSubtitleParts.push(`${spotifyPlayablePlaylists.length} 个支持站内播放`);
  }

  return (
    <ArgonShell posts={posts} title="音乐收藏" subtitle={pageSubtitleParts.join(" · ")}>
      <section className="nh-music-hub" aria-label="音乐歌单">
        <MusicPlaylistCardClient
          playlists={playlistsWithCovers}
          musicPlayerEnabled={musicPlayerEnabled}
        />
      </section>
    </ArgonShell>
  );
}
