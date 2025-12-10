export interface Report {
  id: string;
  reporter_id: string;
  comment_id: string;
  reason: string;
  description: string | null;
  status: "pending" | "resolved";
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  // Joined data
  reporter_username?: string;
  comment_content?: string;
  comment_track_title?: string;
}
