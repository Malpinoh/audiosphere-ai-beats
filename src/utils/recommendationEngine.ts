/**
 * Recommendation Engine Utilities
 * 
 * This module provides utility functions for the recommendation system.
 * The main recommendation logic is now handled by Supabase database functions.
 * 
 * @see src/hooks/use-recommendations.tsx for React hooks
 * @see Database functions: get_personalized_recommendations, get_similar_tracks, etc.
 */

import { supabase } from '@/integrations/supabase/client';

export interface TrackData {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  cover: string;
  plays: number;
  genre: string;
  mood: string;
  score?: number;
}

// Get cover art URL helper
const getCoverUrl = (path: string): string => {
  if (!path) return '/placeholder.svg';
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('audio').getPublicUrl(path);
  return data?.publicUrl || '/placeholder.svg';
};

/**
 * Get recommended tracks for a user (uses database hybrid algorithm)
 */
export const getRecommendedTracks = async (
  userId: string | null = null, 
  limit: number = 10
): Promise<TrackData[]> => {
  try {
    const { data, error } = await supabase.rpc('get_personalized_recommendations', {
      p_user_id: userId,
      p_limit: limit
    });

    if (error) throw error;

    return (data || []).map((track: any) => ({
      id: track.track_id,
      title: track.title,
      artist: track.artist,
      artistId: track.artist_profile_id || '',
      cover: getCoverUrl(track.cover_art_path),
      plays: track.play_count || 0,
      genre: track.genre,
      mood: track.mood,
      score: track.recommendation_score
    }));
  } catch (err) {
    console.error('Error getting recommendations:', err);
    return getFallbackTracks(limit);
  }
};

/**
 * Get mood-based recommendations
 */
export const getMoodBasedRecommendations = async (
  mood: string, 
  limit: number = 10
): Promise<TrackData[]> => {
  try {
    const { data, error } = await supabase.rpc('get_mood_recommendations', {
      p_mood: mood,
      p_limit: limit
    });

    if (error) throw error;

    return (data || []).map((track: any) => ({
      id: track.track_id,
      title: track.title,
      artist: track.artist,
      artistId: track.artist_profile_id || '',
      cover: getCoverUrl(track.cover_art_path),
      plays: track.play_count || 0,
      genre: track.genre,
      mood: track.mood
    }));
  } catch (err) {
    console.error('Error getting mood recommendations:', err);
    return [];
  }
};

/**
 * Get genre-based recommendations
 */
export const getGenreBasedRecommendations = async (
  genre: string, 
  limit: number = 10
): Promise<TrackData[]> => {
  try {
    const { data, error } = await supabase.rpc('get_genre_recommendations', {
      p_genre: genre,
      p_limit: limit
    });

    if (error) throw error;

    return (data || []).map((track: any) => ({
      id: track.track_id,
      title: track.title,
      artist: track.artist,
      artistId: track.artist_profile_id || '',
      cover: getCoverUrl(track.cover_art_path),
      plays: track.play_count || 0,
      genre: track.genre,
      mood: track.mood
    }));
  } catch (err) {
    console.error('Error getting genre recommendations:', err);
    return [];
  }
};

/**
 * Get similar tracks to a given track (content-based filtering)
 */
export const getSimilarTracks = async (
  trackId: string, 
  limit: number = 10
): Promise<TrackData[]> => {
  try {
    const { data, error } = await supabase.rpc('get_similar_tracks', {
      p_track_id: trackId,
      p_limit: limit
    });

    if (error) throw error;

    return (data || []).map((track: any) => ({
      id: track.track_id,
      title: track.title,
      artist: track.artist,
      artistId: track.artist_profile_id || '',
      cover: getCoverUrl(track.cover_art_path),
      plays: track.play_count || 0,
      genre: track.genre,
      mood: track.mood,
      score: track.similarity_score
    }));
  } catch (err) {
    console.error('Error getting similar tracks:', err);
    return [];
  }
};

/**
 * Fallback to popular tracks when recommendations fail
 */
const getFallbackTracks = async (limit: number): Promise<TrackData[]> => {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('id, title, artist, artist_profile_id, cover_art_path, genre, mood, play_count')
      .eq('published', true)
      .order('play_count', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(track => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      artistId: track.artist_profile_id || '',
      cover: getCoverUrl(track.cover_art_path),
      plays: track.play_count || 0,
      genre: track.genre,
      mood: track.mood
    }));
  } catch (err) {
    console.error('Error getting fallback tracks:', err);
    return [];
  }
};

/**
 * Get all available moods from the database
 */
export const getAvailableMoods = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('mood')
      .eq('published', true);

    if (error) throw error;

    const moods = [...new Set((data || []).map(t => t.mood).filter(Boolean))];
    return moods.sort();
  } catch (err) {
    console.error('Error getting moods:', err);
    return ['energetic', 'chill', 'happy', 'sad', 'romantic', 'party', 'calm', 'inspirational'];
  }
};

/**
 * Get all available genres from the database
 */
export const getAvailableGenres = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('genre')
      .eq('published', true);

    if (error) throw error;

    const genres = [...new Set((data || []).map(t => t.genre).filter(Boolean))];
    return genres.sort();
  } catch (err) {
    console.error('Error getting genres:', err);
    return ['afrobeats', 'hip-hop', 'r&b', 'pop', 'electronic', 'jazz', 'gospel', 'reggae', 'rock', 'classical'];
  }
};
