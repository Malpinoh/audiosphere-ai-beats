
export interface Comment {
  id: string;
  content: string;
  username: string;
  avatar_url?: string;
  follower_count: number;
  is_verified: boolean;
  track_title: string;
  track_artist: string;
  created_at: string;
  status: "active" | "hidden" | "deleted";
  flagged: boolean;
  user_id: string;
  track_id: string;
  likes_count: number;
}
