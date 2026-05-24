import ArgonShell from "@/src/components/argon/ArgonShell";
import MusicPlaylistCardClient from "@/src/components/MusicPlaylistCardClient";
import { getPublicMusicCatalog } from "@/src/lib/musicCatalog";
import { getSpotifyPlayablePlaylists } from "@/src/lib/music";
import { getSortedPostsData } from "@/src/lib/posts";

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

  const pageSubtitleParts = [`${playlists.length} 个已发布歌单`];
  if (spotifyPlayablePlaylists.length > 0) {
    pageSubtitleParts.push(`${spotifyPlayablePlaylists.length} 个支持站内播放`);
  }

  return (
    <ArgonShell
      currentPath="/music"
      posts={posts}
      title="音乐收藏"
      subtitle={pageSubtitleParts.join(" · ")}
    >
      <section className="nh-music-hub" aria-label="音乐歌单">
          <MusicPlaylistCardClient
          playlists={playlists}
          musicPlayerEnabled={musicPlayerEnabled}
        />
      </section>
    </ArgonShell>
  );
}
