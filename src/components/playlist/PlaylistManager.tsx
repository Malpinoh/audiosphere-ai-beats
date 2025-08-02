import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { Track } from "@/types/track-types";
import { useMusicPlayer } from "@/contexts/music-player";

interface PlaylistTrack {
  id: string;
  track_id: string;
  position: number;
  track: Track;
}

interface PlaylistManagerProps {
  playlistId: string;
  isOwner: boolean;
}

export function PlaylistManager({ playlistId, isOwner }: PlaylistManagerProps) {
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTracks, setShowAddTracks] = useState(false);
  const { user, profile } = useAuth();
  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    loadPlaylistTracks();
    if (isOwner) {
      loadAvailableTracks();
    }
  }, [playlistId, isOwner]);

  const loadPlaylistTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('playlist_tracks')
        .select(`
          id,
          track_id,
          position,
          tracks (*)
        `)
        .eq('playlist_id', playlistId)
        .order('position');

      if (error) {
        console.error('Error loading playlist tracks:', error);
        return;
      }

      setTracks(data?.map(item => ({
        id: item.id,
        track_id: item.track_id,
        position: item.position,
        track: {
          ...item.tracks as any,
          track_type: (item.tracks as any)?.track_type as "single" | "ep" | "album" || "single"
        }
      })) || []);
    } catch (error) {
      console.error('Error loading playlist tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('published', true)
        .order('uploaded_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading available tracks:', error);
        return;
      }

      setAvailableTracks((data || []).map(track => ({
        ...track,
        track_type: track.track_type as "single" | "ep" | "album" || "single"
      })));
    } catch (error) {
      console.error('Error loading available tracks:', error);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !isOwner) {
      return;
    }

    const items = Array.from(tracks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately
    const updatedTracks = items.map((item, index) => ({
      ...item,
      position: index + 1
    }));
    setTracks(updatedTracks);

    try {
      // Call the database function to reorder tracks
      const { error } = await supabase.rpc('reorder_playlist_tracks', {
        p_playlist_id: playlistId,
        p_track_positions: updatedTracks.map(track => ({
          track_id: track.track_id,
          position: track.position
        }))
      });

      if (error) {
        console.error('Error reordering tracks:', error);
        toast.error('Failed to reorder tracks');
        // Revert local state
        loadPlaylistTracks();
        return;
      }

      toast.success('Track order updated');
    } catch (error) {
      console.error('Error reordering tracks:', error);
      toast.error('Failed to reorder tracks');
      loadPlaylistTracks();
    }
  };

  const addTrackToPlaylist = async (track: Track) => {
    if (!isOwner) return;

    try {
      const { error } = await supabase.rpc('add_track_to_playlist', {
        p_playlist_id: playlistId,
        p_track_id: track.id
      });

      if (error) {
        console.error('Error adding track to playlist:', error);
        toast.error('Failed to add track to playlist');
        return;
      }

      toast.success('Track added to playlist');
      loadPlaylistTracks();
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      toast.error('Failed to add track to playlist');
    }
  };

  const removeTrackFromPlaylist = async (playlistTrackId: string) => {
    if (!isOwner) return;

    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('id', playlistTrackId);

      if (error) {
        console.error('Error removing track from playlist:', error);
        toast.error('Failed to remove track from playlist');
        return;
      }

      toast.success('Track removed from playlist');
      loadPlaylistTracks();
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      toast.error('Failed to remove track from playlist');
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading playlist tracks...</div>;
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Manage Tracks</h3>
          <Button
            onClick={() => setShowAddTracks(!showAddTracks)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tracks
          </Button>
        </div>
      )}

      {showAddTracks && isOwner && (
        <div className="bg-white/5 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-white">Available Tracks</h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {availableTracks.map((track) => (
              <div key={track.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{track.title}</p>
                  <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => addTrackToPlaylist(track)}
                  className="ml-2 maudio-gradient-bg"
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">
          Playlist Tracks ({tracks.length})
        </h3>
        
        {tracks.length === 0 ? (
          <p className="text-gray-400">No tracks in this playlist yet.</p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="playlist-tracks" isDropDisabled={!isOwner}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {tracks.map((playlistTrack, index) => (
                    <Draggable
                      key={playlistTrack.id}
                      draggableId={playlistTrack.id}
                      index={index}
                      isDragDisabled={!isOwner}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          {isOwner && (
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab text-gray-400 hover:text-white"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-400 w-8">{index + 1}</div>
                          
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => playTrack(playlistTrack.track)}
                              className="text-left w-full hover:text-primary transition-colors"
                            >
                              <p className="font-medium text-white truncate">
                                {playlistTrack.track.title}
                              </p>
                              <p className="text-sm text-gray-400 truncate">
                                {playlistTrack.track.artist}
                              </p>
                            </button>
                          </div>
                          
                          {isOwner && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeTrackFromPlaylist(playlistTrack.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}