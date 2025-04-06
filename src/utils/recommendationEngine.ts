
interface UserPreference {
  genre: Record<string, number>;
  artist: Record<string, number>;
  mood: Record<string, number>;
}

// Mock user history data - in a real app, this would come from a database
const mockUserHistory = {
  "user1": {
    listens: [
      { trackId: "1", count: 5 },
      { trackId: "3", count: 2 },
      { trackId: "5", count: 7 },
    ],
    likes: ["1", "5", "6"],
    follows: ["1", "4", "5"]
  }
};

// Mock track data - in a real app, this would come from a database
const mockTracks = [
  {
    id: "1",
    title: "Midnight Dreams",
    artist: "Luna Echo",
    artistId: "1",
    cover: "https://picsum.photos/id/65/300/300",
    plays: 1248000,
    genre: "electronic",
    mood: "chill"
  },
  {
    id: "2",
    title: "Cosmic Waves",
    artist: "Stellar Beats",
    artistId: "2",
    cover: "https://picsum.photos/id/240/300/300",
    plays: 876000,
    genre: "electronic",
    mood: "energetic"
  },
  {
    id: "3",
    title: "Urban Flow",
    artist: "City Sounds",
    artistId: "3",
    cover: "https://picsum.photos/id/334/300/300",
    plays: 2450000,
    genre: "hip-hop",
    mood: "energetic"
  },
  {
    id: "4",
    title: "Desert Wind",
    artist: "Nomad Soul",
    artistId: "4",
    cover: "https://picsum.photos/id/96/300/300",
    plays: 543000,
    genre: "world",
    mood: "calm"
  },
  {
    id: "5",
    title: "Neon Lights",
    artist: "Cyber Pulse",
    artistId: "5",
    cover: "https://picsum.photos/id/1062/300/300",
    plays: 1789000,
    genre: "electronic",
    mood: "party"
  },
  {
    id: "6",
    title: "Ocean Breeze",
    artist: "Wave Collective",
    artistId: "6",
    cover: "https://picsum.photos/id/1060/300/300",
    plays: 930000,
    genre: "ambient",
    mood: "relaxing"
  },
  {
    id: "7",
    title: "Mountain High",
    artist: "Alpine Echoes",
    artistId: "7",
    cover: "https://picsum.photos/id/1018/300/300",
    plays: 650000,
    genre: "folk",
    mood: "inspirational"
  },
  {
    id: "8",
    title: "City Lights",
    artist: "Urban Vibes",
    artistId: "8",
    cover: "https://picsum.photos/id/1019/300/300",
    plays: 1200000,
    genre: "jazz",
    mood: "chill"
  },
  {
    id: "9",
    title: "Electric Dreams",
    artist: "Synth Wave",
    artistId: "9",
    cover: "https://picsum.photos/id/1025/300/300",
    plays: 890000,
    genre: "electronic",
    mood: "energetic"
  },
  {
    id: "10",
    title: "Rainy Day",
    artist: "Mellow Mood",
    artistId: "10",
    cover: "https://picsum.photos/id/1039/300/300",
    plays: 750000,
    genre: "lofi",
    mood: "sad"
  }
];

/**
 * Calculate user preferences based on listening history, likes, and follows
 */
export const calculateUserPreferences = (userId: string = "user1"): UserPreference => {
  const userHistory = mockUserHistory[userId] || { listens: [], likes: [], follows: [] };
  
  // Initialize preference scores
  const preferences: UserPreference = {
    genre: {},
    artist: {},
    mood: {}
  };
  
  // Process listening history (strongest signal)
  userHistory.listens.forEach(listen => {
    const track = mockTracks.find(t => t.id === listen.trackId);
    if (track) {
      // Increase genre preference
      preferences.genre[track.genre] = (preferences.genre[track.genre] || 0) + listen.count * 2;
      
      // Increase artist preference
      preferences.artist[track.artistId] = (preferences.artist[track.artistId] || 0) + listen.count * 2;
      
      // Increase mood preference
      preferences.mood[track.mood] = (preferences.mood[track.mood] || 0) + listen.count * 2;
    }
  });
  
  // Process likes (medium signal)
  userHistory.likes.forEach(likedTrackId => {
    const track = mockTracks.find(t => t.id === likedTrackId);
    if (track) {
      // Increase genre preference
      preferences.genre[track.genre] = (preferences.genre[track.genre] || 0) + 5;
      
      // Increase artist preference
      preferences.artist[track.artistId] = (preferences.artist[track.artistId] || 0) + 5;
      
      // Increase mood preference
      preferences.mood[track.mood] = (preferences.mood[track.mood] || 0) + 5;
    }
  });
  
  // Process follows (weaker signal for track preference, but strong for artist)
  userHistory.follows.forEach(followedArtistId => {
    // Find all tracks by this artist
    const artistTracks = mockTracks.filter(t => t.artistId === followedArtistId);
    
    artistTracks.forEach(track => {
      // Increase genre preference
      preferences.genre[track.genre] = (preferences.genre[track.genre] || 0) + 2;
      
      // Increase artist preference (higher weight for follows)
      preferences.artist[track.artistId] = (preferences.artist[track.artistId] || 0) + 10;
      
      // Increase mood preference
      preferences.mood[track.mood] = (preferences.mood[track.mood] || 0) + 2;
    });
  });
  
  return preferences;
};

/**
 * Calculate a score for each track based on user preferences
 */
const calculateTrackScores = (preferences: UserPreference) => {
  return mockTracks.map(track => {
    let score = 0;
    
    // Add genre score
    score += preferences.genre[track.genre] || 0;
    
    // Add artist score
    score += preferences.artist[track.artistId] || 0;
    
    // Add mood score
    score += preferences.mood[track.mood] || 0;
    
    return {
      ...track,
      score
    };
  });
};

/**
 * Get recommended tracks based on user preferences
 */
export const getRecommendedTracks = (userId: string = "user1", limit: number = 5) => {
  const preferences = calculateUserPreferences(userId);
  const scoredTracks = calculateTrackScores(preferences);
  
  // Sort by score and take the top tracks
  const recommendedTracks = scoredTracks
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return recommendedTracks;
};

/**
 * Get recommended tracks based on mood
 */
export const getMoodBasedRecommendations = (mood: string, limit: number = 5) => {
  // Filter tracks by the specified mood
  return mockTracks
    .filter(track => track.mood === mood)
    .slice(0, limit);
};

/**
 * Get genre-based recommendations
 */
export const getGenreBasedRecommendations = (genre: string, limit: number = 5) => {
  // Filter tracks by the specified genre
  return mockTracks
    .filter(track => track.genre === genre)
    .slice(0, limit);
};

// Export the mock data for use in components
export const getAllTracks = () => mockTracks;
