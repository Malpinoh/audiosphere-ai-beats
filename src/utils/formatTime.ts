/**
 * Utility functions for formatting time and duration
 */

/**
 * Format seconds into mm:ss format
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "3:45" or "0:00" if invalid)
 */
export function formatTime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Alias for formatTime to maintain consistency across the app
 */
export const formatDuration = formatTime;