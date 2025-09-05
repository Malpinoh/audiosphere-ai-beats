export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          active: boolean | null
          api_key: string
          created_at: string | null
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          api_key: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          api_key?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_claims: {
        Row: {
          admin_notes: string | null
          artist_name: string
          artist_profile_id: string | null
          claim_status: string
          claim_type: string | null
          claimant_user_id: string | null
          created_at: string | null
          evidence_text: string | null
          evidence_urls: string[] | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          artist_name: string
          artist_profile_id?: string | null
          claim_status?: string
          claim_type?: string | null
          claimant_user_id?: string | null
          created_at?: string | null
          evidence_text?: string | null
          evidence_urls?: string[] | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          artist_name?: string
          artist_profile_id?: string | null
          claim_status?: string
          claim_type?: string | null
          claimant_user_id?: string | null
          created_at?: string | null
          evidence_text?: string | null
          evidence_urls?: string[] | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_claims_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "artist_claims_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          flagged: boolean | null
          id: string
          likes_count: number | null
          parent_id: string | null
          status: string
          track_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          flagged?: boolean | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          status?: string
          track_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          flagged?: boolean | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          status?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      earnings: {
        Row: {
          artist_id: string
          created_at: string
          earnings_amount: number
          id: string
          rate_per_stream: number
          region_country: string | null
          stream_log_id: string
          track_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          earnings_amount: number
          id?: string
          rate_per_stream: number
          region_country?: string | null
          stream_log_id: string
          track_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          earnings_amount?: number
          id?: string
          rate_per_stream?: number
          region_country?: string | null
          stream_log_id?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "earnings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "earnings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_stream_log_id_fkey"
            columns: ["stream_log_id"]
            isOneToOne: false
            referencedRelation: "stream_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          artist_id: string
          followed_at: string
          follower_id: string
          id: string
        }
        Insert: {
          artist_id: string
          followed_at?: string
          follower_id: string
          id?: string
        }
        Update: {
          artist_id?: string
          followed_at?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "followers_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          artist_id: string
          id: string
          payment_details: Json | null
          payment_method: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          artist_id: string
          id?: string
          payment_details?: Json | null
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          transaction_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          artist_id?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "payout_requests_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "payout_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_followers: {
        Row: {
          followed_at: string | null
          id: string
          playlist_id: string | null
          profile_id: string | null
        }
        Insert: {
          followed_at?: string | null
          id?: string
          playlist_id?: string | null
          profile_id?: string | null
        }
        Update: {
          followed_at?: string | null
          id?: string
          playlist_id?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlist_followers_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_followers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "playlist_followers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string | null
          id: string
          playlist_id: string | null
          position: number
          track_id: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          playlist_id?: string | null
          position: number
          track_id?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          playlist_id?: string | null
          position?: number
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_image_path: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          follower_count: number | null
          id: string
          is_editorial: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_path?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          follower_count?: number | null
          id?: string
          is_editorial?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_path?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          follower_count?: number | null
          id?: string
          is_editorial?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "playlists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auto_created: boolean | null
          avatar_url: string | null
          bio: string | null
          claimable: boolean | null
          created_at: string | null
          follower_count: number | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          monthly_listeners: number | null
          role: Database["public"]["Enums"]["app_role"]
          slug: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          auto_created?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          claimable?: boolean | null
          created_at?: string | null
          follower_count?: number | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          monthly_listeners?: number | null
          role?: Database["public"]["Enums"]["app_role"]
          slug?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          auto_created?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          claimable?: boolean | null
          created_at?: string | null
          follower_count?: number | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          monthly_listeners?: number | null
          role?: Database["public"]["Enums"]["app_role"]
          slug?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          comment_id: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      royalty_rates: {
        Row: {
          created_at: string
          id: string
          minimum_payout: number
          rate_per_stream: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          minimum_payout?: number
          rate_per_stream: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          minimum_payout?: number
          rate_per_stream?: number
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_tracks: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_logs: {
        Row: {
          browser_name: string | null
          browser_version: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          region_city: string | null
          region_country: string
          track_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser_name?: string | null
          browser_version?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          region_city?: string | null
          region_country: string
          track_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser_name?: string | null
          browser_version?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          region_city?: string | null
          region_country?: string
          track_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_logs_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string | null
          id: string
          message: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          album_name: string | null
          artist: string
          artist_profile_id: string | null
          audio_file_path: string
          cover_art_path: string
          description: string | null
          duration: number | null
          genre: string
          id: string
          like_count: number | null
          lyrics: string | null
          mood: string
          play_count: number | null
          published: boolean | null
          tags: string[] | null
          title: string
          total_tracks: number | null
          track_number: number | null
          track_type: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          album_name?: string | null
          artist: string
          artist_profile_id?: string | null
          audio_file_path: string
          cover_art_path: string
          description?: string | null
          duration?: number | null
          genre: string
          id?: string
          like_count?: number | null
          lyrics?: string | null
          mood: string
          play_count?: number | null
          published?: boolean | null
          tags?: string[] | null
          title: string
          total_tracks?: number | null
          track_number?: number | null
          track_type?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          album_name?: string | null
          artist?: string
          artist_profile_id?: string | null
          audio_file_path?: string
          cover_art_path?: string
          description?: string | null
          duration?: number | null
          genre?: string
          id?: string
          like_count?: number | null
          lyrics?: string | null
          mood?: string
          play_count?: number | null
          published?: boolean | null
          tags?: string[] | null
          title?: string
          total_tracks?: number | null
          track_number?: number | null
          track_type?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "tracks_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "tracks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_scores: {
        Row: {
          created_at: string
          engagement_score: number
          id: string
          last_calculated: string
          recency_score: number
          regional_boost: number
          track_id: string | null
          trending_score: number
          velocity_score: number
        }
        Insert: {
          created_at?: string
          engagement_score?: number
          id?: string
          last_calculated?: string
          recency_score?: number
          regional_boost?: number
          track_id?: string | null
          trending_score?: number
          velocity_score?: number
        }
        Update: {
          created_at?: string
          engagement_score?: number
          id?: string
          last_calculated?: string
          recency_score?: number
          regional_boost?: number
          track_id?: string | null
          trending_score?: number
          velocity_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "trending_scores_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          status: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      artist_earnings_summary: {
        Row: {
          artist_id: string | null
          artist_name: string | null
          available_balance: number | null
          pending_payouts: number | null
          total_earnings: number | null
          total_paid_out: number | null
          total_streams: number | null
          total_tracks: number | null
        }
        Relationships: []
      }
      comments_with_details: {
        Row: {
          avatar_url: string | null
          content: string | null
          created_at: string | null
          flagged: boolean | null
          follower_count: number | null
          id: string | null
          is_verified: boolean | null
          likes_count: number | null
          status: string | null
          track_artist: string | null
          track_id: string | null
          track_title: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "artist_earnings_summary"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_charts: {
        Row: {
          last_played_at: string | null
          play_count: number | null
          track_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_logs_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_charts: {
        Row: {
          last_played_at: string | null
          play_count: number | null
          region_country: string | null
          track_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_logs_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_track_to_playlist: {
        Args: { p_playlist_id: string; p_position?: number; p_track_id: string }
        Returns: string
      }
      approve_artist_claim: {
        Args: { admin_id: string; claim_id: string }
        Returns: boolean
      }
      calculate_trending_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_claim_profile: {
        Args: { profile_id: string; user_id: string }
        Returns: boolean
      }
      create_artist_profile_if_not_exists: {
        Args: { artist_name: string }
        Returns: string
      }
      create_regional_chart_playlists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
      get_african_regional_charts: {
        Args: Record<PropertyKey, never>
        Returns: {
          last_played_at: string
          play_count: number
          region_country: string
          track_id: string
        }[]
      }
      get_avatar_url: {
        Args: { avatar_path: string; fallback_name: string }
        Returns: string
      }
      get_chart_data: {
        Args: { region_code?: string; view_name: string }
        Returns: {
          last_played_at: string
          play_count: number
          region_country: string
          track_id: string
        }[]
      }
      get_cover_art_url: {
        Args: { cover_path: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_region_display_name: {
        Args: { country_code: string }
        Returns: string
      }
      get_trending_tracks: {
        Args: { limit_count?: number }
        Returns: {
          engagement_score: number
          recency_score: number
          regional_boost: number
          track_id: string
          trending_score: number
          velocity_score: number
        }[]
      }
      increment_play_count: {
        Args: { track_uuid: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_following_playlist: {
        Args: { p_playlist_id: string; p_user_id: string }
        Returns: boolean
      }
      reorder_playlist_tracks: {
        Args: { p_playlist_id: string; p_track_positions: Json }
        Returns: undefined
      }
      update_monthly_listeners: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "distributor"
        | "editorial"
        | "user"
        | "artist"
        | "support"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "distributor",
        "editorial",
        "user",
        "artist",
        "support",
      ],
    },
  },
} as const
