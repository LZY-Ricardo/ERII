"use client";

import { useState } from "react";
import MusicPlaylistCard from "./MusicPlaylistCard";
import { getPlaylistUrl, getMusicEmbedUrl, PLATFORM_CONFIG } from "@/src/lib/music";

export default function MusicPlaylistCardClient({ playlists }) {
  const [activePlaylist, setActivePlaylist] = useState(playlists[0] ?? null);

  const handlePlaylistClick = (playlist) => {
    setActivePlaylist(playlist);
    const platform = playlist.platform || "qq";
    const platformConfig = PLATFORM_CONFIG[platform];

    // 网易云和Spotify支持嵌入，可以在这里实现iframe播放器
    // QQ音乐不支持嵌入，直接跳转
    window.open(getPlaylistUrl(playlist), "_blank");
  };

  return (
    <>
      {/* 当前选中歌单提示 */}
      {activePlaylist && (
        <div className="nh-music-player-wrap">
          <div className="nh-music-player-header">
            <h2 className="nh-music-player-title">精选歌单</h2>
            <span className="nh-music-player-name">{activePlaylist.name}</span>
            <span
              className="nh-music-platform-tag"
              style={{ "--platform-color": PLATFORM_CONFIG[activePlaylist.platform || "qq"].color }}
            >
              {PLATFORM_CONFIG[activePlaylist.platform || "qq"].name}
            </span>
            <a
              href={getPlaylistUrl(activePlaylist)}
              target="_blank"
              rel="noreferrer"
              className="nh-music-external-mini"
            >
              在{PLATFORM_CONFIG[activePlaylist.platform || "qq"].name}打开 →
            </a>
          </div>
        </div>
      )}

      {/* 歌单网格 */}
      <div className="nh-music-grid">
        {playlists.map((playlist) => (
          <MusicPlaylistCard
            key={playlist.id}
            playlist={playlist}
            isActive={activePlaylist?.id === playlist.id}
            onPlay={handlePlaylistClick}
          />
        ))}
      </div>
    </>
  );
}
