import ArgonShell from "@/src/components/argon/ArgonShell";
import MusicPlaylistCardClient from "@/src/components/MusicPlaylistCardClient";
import { getAllPlaylists } from "@/src/lib/music";
import { getSortedPostsData } from "@/src/lib/posts";

/**
 * 获取网易云音乐封面
 */
async function getNeteaseCover(id) {
  try {
    const res = await fetch(`https://music.163.com/api/playlist/detail?id=${id}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://music.163.com/",
      },
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.result?.coverImgUrl || null;
  } catch {
    return null;
  }
}

/**
 * 获取QQ音乐封面
 */
async function getQQMusicCover(id) {
  const mod = Number(id) % 100;
  const urls = [
    `https://y.qq.com/music/photo_new/pl540/${mod}/${id}.jpg`,
    `https://i.y.qq.com/v8/fav-song-music-center/pl540/${id}.jpg`,
  ];

  for (const url of urls) {
    try {
      const check = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 3600 },
      });
      if (check.ok) {
        return url;
      }
    } catch {
      continue;
    }
  }
  return null;
}

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
    console.log(`[Spotify API] Response:`, JSON.stringify(data).slice(0, 200));
    return data?.thumbnail_url || null;
  } catch (err) {
    console.error(`[Spotify API] Error:`, err.message);
    return null;
  }
}

export const metadata = {
  title: "音乐收藏 | 象龟的水坑",
  description: "精选音乐歌单分享，涵盖多种风格。",
};

export default async function MusicPage() {
  const posts = await getSortedPostsData();
  const playlists = getAllPlaylists();

  console.log(`[MusicPage] Fetching covers for ${playlists.length} playlists...`);

  // 直接在页面中获取封面
  const playlistsWithCovers = await Promise.all(
    playlists.map(async (playlist) => {
      let coverUrl = playlist.coverUrl || null;

      if (!coverUrl) {
        if (playlist.platform === "netease") {
          console.log(`[MusicPage] Fetching NetEase cover for ${playlist.id}...`);
          coverUrl = await getNeteaseCover(playlist.id);
          console.log(`[MusicPage] NetEase result for ${playlist.id}:`, coverUrl);
        } else if (playlist.platform === "qq") {
          console.log(`[MusicPage] Fetching QQ Music cover for ${playlist.id}...`);
          coverUrl = await getQQMusicCover(playlist.id);
          console.log(`[MusicPage] QQ Music result for ${playlist.id}:`, coverUrl);
        } else if (playlist.platform === "spotify") {
          console.log(`[MusicPage] Fetching Spotify cover for ${playlist.id}...`);
          coverUrl = await getSpotifyCover(playlist.id);
          console.log(`[MusicPage] Spotify result for ${playlist.id}:`, coverUrl);
        }
      }

      console.log(`[MusicPage] ${playlist.name}: coverUrl = ${coverUrl || 'NULL'}`);
      return { ...playlist, coverUrl };
    })
  );

  console.log(`[MusicPage] Done fetching covers`);

  return (
    <ArgonShell posts={posts} title="音乐收藏" subtitle={`${playlists.length} 个精选歌单`}>
      <section className="nh-music-hub" aria-label="音乐歌单">
        <MusicPlaylistCardClient playlists={playlistsWithCovers} />
      </section>
    </ArgonShell>
  );
}
