export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          active: boolean | null
          api_key: string
          created_at: string | null
          distributor_id: string
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string
        }
        Insert: {
          active?: boolean | null
          api_key: string
          created_at?: string | null
          distributor_id: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name: string
        }
        Update: {
          active?: boolean | null
          api_key?: string
          created_at?: string | null
          distributor_id?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
        ]
      }
      distributor_earnings: {
        Row: {
          amount: number
          created_at: string | null
          distributor_id: string | null
          earnings_period: string
          earnings_type: string
          id: string
          track_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          distributor_id?: string | null
          earnings_period: string
          earnings_type: string
          id?: string
          track_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          distributor_id?: string | null
          earnings_period?: string
          earnings_type?: string
          id?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distributor_earnings_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_earnings_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      distributors: {
        Row: {
          auth_id: string | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          follower_count: number | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          follower_count?: number | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          follower_count?: number | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          username?: string | null
        }
        Relationships: []
      }
      stream_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          region_city: string | null
          region_country: string
          track_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          region_city?: string | null
          region_country: string
          track_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          region_city?: string | null
          region_country?: string
          track_id?: string
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
      tracks: {
        Row: {
          artist: string
          audio_file_path: string
          cover_art_path: string
          description: string | null
          distributor_id: string
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
          uploaded_at: string | null
        }
        Insert: {
          artist: string
          audio_file_path: string
          cover_art_path: string
          description?: string | null
          distributor_id: string
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
          uploaded_at?: string | null
        }
        Update: {
          artist?: string
          audio_file_path?: string
          cover_art_path?: string
          description?: string | null
          distributor_id?: string
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
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
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
      generate_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_chart_data: {
        Args: { view_name: string; region_code?: string }
        Returns: {
          track_id: string
          play_count: number
          last_played_at: string
          region_country: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "distributor" | "editorial" | "user" | "artist"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "distributor", "editorial", "user", "artist"],
    },
  },
} as const
