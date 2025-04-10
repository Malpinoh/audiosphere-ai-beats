
// Mock data for tables that don't exist yet in the database
export const mockComments = [
  { 
    id: "1", 
    content: "This song is amazing! I've been listening to it on repeat.", 
    user: "johndoe", 
    song: "Autumn Rain - Mountain Echo",
    timestamp: "2023-04-05T10:30:00",
    status: "active",
    flagged: false
  },
  { 
    id: "2", 
    content: "Not really my style, but I can appreciate the production quality.", 
    user: "sarahjones", 
    song: "Neon City - Digital Dreams",
    timestamp: "2023-04-04T15:45:00",
    status: "active",
    flagged: false
  },
  { 
    id: "3", 
    content: "This artist always delivers! Can't wait for more music.", 
    user: "mikebrown", 
    song: "Ocean Waves - Coastal Sounds",
    timestamp: "2023-04-03T09:15:00",
    status: "hidden",
    flagged: true
  },
  { 
    id: "4", 
    content: "The lyrics are so meaningful, really speaks to me.", 
    user: "robertwilson", 
    song: "Street Beats - Urban Flow",
    timestamp: "2023-04-02T20:10:00",
    status: "active",
    flagged: false
  },
  { 
    id: "5", 
    content: "The beat is sick! Perfect for workouts.", 
    user: "janesmith", 
    song: "Midnight Drive - Night Cruiser",
    timestamp: "2023-04-01T13:20:00",
    status: "active",
    flagged: true
  }
];

export const mockReports = [
  { 
    id: "1", 
    type: "Content",
    entityType: "Song",
    entity: "Digital Revolution - Cyber Pulse",
    reason: "Copyright infringement",
    reportedBy: "johndoe",
    timestamp: "2023-04-05T14:25:00",
    status: "open"
  },
  { 
    id: "2", 
    type: "User",
    entityType: "User",
    entity: "MusicSpammer123",
    reason: "Spam accounts and comments",
    reportedBy: "sarahjones",
    timestamp: "2023-04-04T11:10:00",
    status: "open"
  },
  { 
    id: "3", 
    type: "Comment",
    entityType: "Comment",
    entity: "Comment on 'Summer Vibes'",
    reason: "Offensive language",
    reportedBy: "robertwilson",
    timestamp: "2023-04-03T16:45:00",
    status: "resolved"
  },
  { 
    id: "4", 
    type: "Playlist",
    entityType: "Playlist",
    entity: "Controversial Mix",
    reason: "Inappropriate content",
    reportedBy: "mikebrown",
    timestamp: "2023-04-02T09:30:00",
    status: "investigating"
  },
  { 
    id: "5", 
    type: "Content",
    entityType: "Song",
    entity: "Urban Stories - City Sounds",
    reason: "Explicit content not labeled",
    reportedBy: "janesmith",
    timestamp: "2023-04-01T19:15:00",
    status: "resolved"
  }
];

// Helper functions to check if tables exist
export const checkTableExists = async (tableName: string, supabase: any) => {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    return !error;
  } catch (error) {
    return false;
  }
};
