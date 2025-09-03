import React, { useState } from "react";
import { ChevronDown, ChevronRight, Play } from "lucide-react";
import { useMusicPlayer } from "@/contexts/music-player";
import { Track } from "@/types/track-types";
import { formatDuration } from "@/utils/formatTime";

interface CollapsibleAlbumProps {
  album: {
    name: string;
    type: string;
    cover: string;
    tracks: Track[];
    totalTracks: number;
  };
}

export function CollapsibleAlbum({ album }: CollapsibleAlbumProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { playTrack } = useMusicPlayer();

  const handleTrackPlay = (track: Track) => {
    playTrack(track);
  };


  return (
    <div className="bg-black/20 rounded-lg overflow-hidden hover:bg-black/30 transition-colors">
      {/* Album Header */}
      <div 
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <img 
          src={album.cover} 
          alt={album.name}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{album.name}</h3>
          <p className="text-sm text-white/60 capitalize">{album.type}</p>
          <p className="text-xs text-white/40">{album.tracks.length} tracks</p>
        </div>
        <div className="text-white/60">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Expandable Track List */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-1 border-t border-white/10">
          {album.tracks
            .sort((a, b) => (a.track_number || 0) - (b.track_number || 0))
            .map((track) => (
            <div 
              key={track.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer group"
              onClick={() => handleTrackPlay(track)}
            >
              {/* Track Number / Play Button */}
              <div className="w-6 flex items-center justify-center">
                <span className="text-white/40 text-sm group-hover:opacity-0 transition-opacity">
                  {track.track_number || '—'}
                </span>
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-3 w-3 text-white" />
                </div>
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{track.title}</p>
              </div>

              {/* Duration */}
              <span className="text-xs text-white/40">
                {track.duration ? formatDuration(track.duration) : '0:00'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}