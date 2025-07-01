
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function ensureStorageBuckets(supabase: any) {
  try {
    // Check if audio_files bucket exists
    const { data: audioBucket } = await supabase.storage.getBucket('audio_files');
    
    if (!audioBucket) {
      console.log('Creating audio_files bucket...');
      const { error: audioError } = await supabase.storage.createBucket('audio_files', {
        public: true,
        allowedMimeTypes: ['audio/*'],
        fileSizeLimit: 104857600 // 100MB
      });
      
      if (audioError) {
        console.error('Error creating audio_files bucket:', audioError);
      } else {
        console.log('audio_files bucket created successfully');
      }
    }

    // Check if cover_art bucket exists
    const { data: coverBucket } = await supabase.storage.getBucket('cover_art');
    
    if (!coverBucket) {
      console.log('Creating cover_art bucket...');
      const { error: coverError } = await supabase.storage.createBucket('cover_art', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (coverError) {
        console.error('Error creating cover_art bucket:', coverError);
      } else {
        console.log('cover_art bucket created successfully');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring storage buckets:', error);
    return false;
  }
}
