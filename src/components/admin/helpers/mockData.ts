
import { v4 as uuidv4 } from 'uuid';
import { Comment } from '../comments/types';
import { Report } from '../reports/types';

// Mock data for when the comments table doesn't exist
export const getMockComments = (): Comment[] => {
  return [
    {
      id: uuidv4(),
      content: "This track is amazing! Love the bass line.",
      profiles: { username: "music_lover_42" },
      tracks: { title: "Summer Groove", artist: "DJ Horizon" },
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      flagged: false,
      user_id: uuidv4(),
      track_id: uuidv4()
    },
    {
      id: uuidv4(),
      content: "First!!! This song is fire 🔥🔥🔥",
      profiles: { username: "beat_master" },
      tracks: { title: "Midnight Drive", artist: "Luna Wave" },
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      status: "active",
      flagged: false,
      user_id: uuidv4(),
      track_id: uuidv4()
    },
    {
      id: uuidv4(),
      content: "The lyrics are really deep. Makes me think about life.",
      profiles: { username: "deep_thoughts" },
      tracks: { title: "Reflections", artist: "Echo Mind" },
      created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      status: "active",
      flagged: false,
      user_id: uuidv4(),
      track_id: uuidv4()
    },
    {
      id: uuidv4(),
      content: "Check out my mixtape at [spam link removed]",
      profiles: { username: "promo_spammer" },
      tracks: { title: "Urban Whispers", artist: "Street Poet" },
      created_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
      status: "hidden",
      flagged: true,
      user_id: uuidv4(),
      track_id: uuidv4()
    },
    {
      id: uuidv4(),
      content: "This is terrible. The mixing is awful and the vocals are off-key.",
      profiles: { username: "harsh_critic" },
      tracks: { title: "First Try", artist: "Newbie Artist" },
      created_at: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
      status: "active",
      flagged: true,
      user_id: uuidv4(),
      track_id: uuidv4()
    },
    {
      id: uuidv4(),
      content: "I've listened to this track 100 times already! Can't get enough.",
      profiles: { username: "superfan2023" },
      tracks: { title: "Hypnotic", artist: "Trance Master" },
      created_at: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
      status: "active",
      flagged: false,
      user_id: uuidv4(),
      track_id: uuidv4()
    },
    {
      id: uuidv4(),
      content: "[Comment removed for violation of community guidelines]",
      profiles: { username: "banned_user" },
      tracks: { title: "Controversial", artist: "Rebel Artist" },
      created_at: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(),
      status: "deleted",
      flagged: true,
      user_id: uuidv4(),
      track_id: uuidv4()
    }
  ];
};

// Mock data for when the reports table doesn't exist
export const getMockReports = (): Report[] => {
  return [
    {
      id: uuidv4(),
      type: "spam",
      entity_type: "comment",
      entity_details: "Check out my mixtape at [spam link removed]",
      reason: "Contains promotional spam",
      profiles: { username: "music_lover_42" },
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      entity_id: uuidv4(),
      user_id: uuidv4()
    },
    {
      id: uuidv4(),
      type: "copyright",
      entity_type: "track",
      entity_details: "Electronic Dreams by Unknown Artist",
      reason: "This track uses my copyrighted material without permission",
      profiles: { username: "original_producer" },
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      status: "investigating",
      entity_id: uuidv4(),
      user_id: uuidv4()
    },
    {
      id: uuidv4(),
      type: "abuse",
      entity_type: "comment",
      entity_details: "[Content hidden for moderation]",
      reason: "Comment contains offensive language and personal attacks",
      profiles: { username: "community_guardian" },
      created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      status: "resolved",
      entity_id: uuidv4(),
      user_id: uuidv4()
    },
    {
      id: uuidv4(),
      type: "inappropriate",
      entity_type: "profile",
      entity_details: "User: inappropriate_username",
      reason: "Username contains vulgar language",
      profiles: { username: "concerned_parent" },
      created_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
      status: "open",
      entity_id: uuidv4(),
      user_id: uuidv4()
    },
    {
      id: uuidv4(),
      type: "copyright",
      entity_type: "track",
      entity_details: "Summer Vibes by Beach DJ",
      reason: "Unauthorized use of samples from my track",
      profiles: { username: "sample_creator" },
      created_at: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
      status: "investigating",
      entity_id: uuidv4(),
      user_id: uuidv4()
    },
    {
      id: uuidv4(),
      type: "other",
      entity_type: "playlist",
      entity_details: "Party Hits 2023",
      reason: "Playlist contains misleading title and description",
      profiles: { username: "truth_seeker" },
      created_at: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
      status: "open",
      entity_id: uuidv4(),
      user_id: uuidv4()
    },
    {
      id: uuidv4(),
      type: "technical",
      entity_type: "track",
      entity_details: "Broken Audio - New Release",
      reason: "Track audio cuts out after 1 minute",
      profiles: { username: "quality_controller" },
      created_at: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(),
      status: "resolved",
      entity_id: uuidv4(),
      user_id: uuidv4()
    }
  ];
};
