/**
 * Audio utility functions for calculating duration and other audio metadata
 */

/**
 * Calculate the duration of an audio file in seconds
 * @param file - Audio file to analyze
 * @returns Promise<number> - Duration in seconds
 */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    
    audio.addEventListener('loadedmetadata', () => {
      // Clean up the object URL
      URL.revokeObjectURL(audio.src);
      resolve(Math.floor(audio.duration) || 0);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to load audio file'));
    });
    
    // Create object URL for the file
    audio.src = URL.createObjectURL(file);
    audio.preload = 'metadata';
    audio.load();
  });
}

/**
 * Validate if a file is a supported audio format
 * @param file - File to validate
 * @returns boolean - True if the file is a supported audio format
 */
export function isValidAudioFile(file: File): boolean {
  const supportedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/m4a',
    'audio/flac'
  ];
  
  return supportedTypes.some(type => 
    file.type.includes(type.split('/')[1]) || 
    file.name.toLowerCase().endsWith(`.${type.split('/')[1]}`)
  );
}

/**
 * Get audio file metadata including duration
 * @param file - Audio file to analyze
 * @returns Promise with audio metadata
 */
export async function getAudioMetadata(file: File): Promise<{
  duration: number;
  size: number;
  type: string;
  name: string;
}> {
  const duration = await getAudioDuration(file);
  
  return {
    duration,
    size: file.size,
    type: file.type,
    name: file.name
  };
}