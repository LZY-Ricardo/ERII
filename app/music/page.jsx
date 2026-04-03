import ArgonShell from "@/src/components/argon/ArgonShell";
import MusicPlaylistCardClient from "@/src/components/MusicPlaylistCardClient";
import { getAllPlaylists, getSpotifyPlayablePlaylists } from "@/src/lib/music";
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
  description: "Ricardo 的 Spotify 精选歌单分享，适合在站内直接播放与切换。",
  keywords: ["Spotify歌单", "音乐推荐", "精选音乐"],
  alternates: { canonical: `${SITE_URL}/music` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/music`,
    title: "音乐收藏 | 象龟的水坑",
    description: "Ricardo 的 Spotify 精选歌单分享，可在页面内直接播放。",
  },
};

export default async function MusicPage() {
  const posts = await getSortedPostsData();
  const playlists = getSpotifyPlayablePlaylists(getAllPlaylists());

  // 直接在页面中获取封面
  const playlistsWithCovers = await Promise.all(
    playlists.map(async (playlist) => {
      let coverUrl = playlist.coverUrl || null;

      if (!coverUrl && playlist.platform === "spotify") {
        coverUrl = await getSpotifyCover(playlist.id);
      }
      return { ...playlist, coverUrl };
    })
  );

  return (
    <ArgonShell posts={posts} title="音乐收藏" subtitle={`${playlists.length} 个精选歌单`}>
      <section className="nh-music-hub" aria-label="音乐歌单">
        <MusicPlaylistCardClient playlists={playlistsWithCovers} />
      </section>
    </ArgonShell>
  );
}
