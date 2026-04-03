"use client";

import { useMemo, useState } from "react";
import SpotifyEmbedPlayer from "@/src/components/argon/SpotifyEmbedPlayer";
import MusicPlaylistCard from "./MusicPlaylistCard";
import {
  getPlaylistUrl,
  getSpotifyPlayablePlaylists,
} from "@/src/lib/music";

export default function MusicPlaylistCardClient({ playlists }) {
  const spotifyPlaylists = useMemo(() => getSpotifyPlayablePlaylists(playlists), [playlists]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(() => spotifyPlaylists[0] ?? null);
  const [playSignal, setPlaySignal] = useState(0);
  const activePlaylist = selectedPlaylist ?? spotifyPlaylists[0] ?? null;

  const handlePlaylistClick = (playlist) => {
    setSelectedPlaylist(playlist);
    setPlaySignal((current) => current + 1);
  };

  return (
    <>
      {/* 当前选中歌单提示 */}
      {activePlaylist && (
        <div className="nh-music-player-wrap">
          <div className="nh-music-player-header">
            <h2 className="nh-music-player-title">Spotify 歌单</h2>
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
      )}

      {/* 歌单网格 */}
      <div className="nh-music-grid">
        {spotifyPlaylists.map((playlist) => (
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
