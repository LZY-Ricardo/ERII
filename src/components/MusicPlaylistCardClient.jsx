"use client";

import { useMemo, useState } from "react";
import SpotifyEmbedPlayer from "@/src/components/argon/SpotifyEmbedPlayer";
import MusicPlaylistCard from "./MusicPlaylistCard";
import {
  getPlaylistUrl,
  getSpotifyPlayablePlaylists,
} from "@/src/lib/music";

export default function MusicPlaylistCardClient({ playlists, musicPlayerEnabled = true }) {
  const spotifyPlaylists = useMemo(() => getSpotifyPlayablePlaylists(playlists), [playlists]);
  const [selectedEntryId, setSelectedEntryId] = useState(() => spotifyPlaylists[0]?.entryId ?? "");
  const [playSignal, setPlaySignal] = useState(0);
  const activePlaylist =
    spotifyPlaylists.find((playlist) => playlist.entryId === selectedEntryId) ?? spotifyPlaylists[0] ?? null;
  const canRenderPlayer = musicPlayerEnabled && Boolean(activePlaylist);

  const handlePlaylistClick = (playlist) => {
    if (!playlist || !spotifyPlaylists.some((item) => item.entryId === playlist.entryId)) {
      return;
    }
    setSelectedEntryId(playlist.entryId);
    setPlaySignal((current) => current + 1);
  };

  if (!playlists.length) {
    return (
      <div className="nh-card nh-music-empty">
        <h2>还没有公开歌单</h2>
        <p>管理员还没有发布新的音乐分享，之后再来看看。</p>
      </div>
    );
  }

  return (
    <>
      {canRenderPlayer ? (
        <div className="nh-music-player-wrap">
          <div className="nh-music-player-header">
            <h2 className="nh-music-player-title">当前站内播放器</h2>
            <span className="nh-music-player-name">{activePlaylist.name}</span>
            {getPlaylistUrl(activePlaylist) !== "#" ? (
              <a
                href={getPlaylistUrl(activePlaylist)}
                target="_blank"
                rel="noreferrer"
                className="nh-music-external-mini"
              >
                在 Spotify 中打开
              </a>
            ) : null}
          </div>

          {activePlaylist ? (
            <div className="nh-music-page-embed">
              <SpotifyEmbedPlayer playlist={activePlaylist} playSignal={playSignal} />
            </div>
          ) : null}
        </div>
      ) : musicPlayerEnabled ? (
        <div className="nh-card nh-music-player-note">
          <h2>当前没有可站内播放的 Spotify 歌单</h2>
          <p>你仍然可以通过下方卡片进入 Spotify、QQ 音乐或网易云页面查看完整歌单。</p>
        </div>
      ) : (
        <div className="nh-card nh-music-player-note">
          <h2>站内播放器当前已关闭</h2>
          <p>音乐页仍然保留歌单分享与外链入口，如需恢复站内播放器，可在后台音乐管理中重新开启。</p>
        </div>
      )}

      <div className="nh-music-grid">
        {playlists.map((playlist) => (
          <MusicPlaylistCard
            key={playlist.entryId ?? `${playlist.platform}:${playlist.id}`}
            playlist={playlist}
            isActive={activePlaylist?.entryId === playlist.entryId}
            onPlay={handlePlaylistClick}
          />
        ))}
      </div>
    </>
  );
}
