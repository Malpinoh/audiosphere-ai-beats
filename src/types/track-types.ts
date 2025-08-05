
export interface Track {
  id: string;
  title: string;
  artist: string;
  cover_art_path: string;
  audio_file_path: string;
  genre: string;
  mood: string;
  play_count: number;
  like_count: number;
  tags: string[];
  published: boolean;
  description?: string;
  duration?: number;
  user_id: string;
  uploaded_at?: string;
  // New fields for track types
  track_type?: 'single' | 'ep' | 'album';
  album_name?: string;
  track_number?: number;
  total_tracks?: number;
  // Optional artist ID field for future use
  artist_id?: string;
  // Formatted URLs
  cover?: string;
  audioUrl?: string;
}

export interface StreamLog {
  id?: string;
  track_id: string;
  region_country: string;
  region_city?: string | null;
  ip_address?: string | null;
  user_id?: string | null;
  created_at?: string;
}

export interface ChartData {
  track_id: string;
  play_count: number;
  last_played_at?: string | null;
  region_country?: string | null;
}

export interface TracksFilter {
  published?: boolean;
  genre?: string;
  mood?: string;
  artist?: string;
  searchTerm?: string;
  tags?: string[];
  limit?: number;
  orderBy?: {
    column: string;
    ascending: boolean;
  };
  region?: string;
  chartType?: 'global' | 'regional';
  trackType?: 'single' | 'ep' | 'album';
  albumName?: string;
}
