
export interface Comment {
  id: string;
  content: string;
  profiles: { username: string };
  tracks: { title: string; artist: string };
  created_at: string;
  status: "active" | "hidden" | "deleted";
  flagged: boolean;
  user_id: string;
  track_id: string;
}
