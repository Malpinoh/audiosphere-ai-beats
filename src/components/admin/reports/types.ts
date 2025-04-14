
export interface Report {
  id: string;
  type: string;
  entity_type: string;
  entity_details: string;
  reason: string;
  profiles: { username: string };
  created_at: string;
  status: "open" | "investigating" | "resolved";
  entity_id: string;
  user_id: string;
}
