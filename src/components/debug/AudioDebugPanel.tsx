
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useMusicPlayer } from '@/contexts/music-player';

export function AudioDebugPanel() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const { playTrack, currentTrack, isPlaying, isLoading } = useMusicPlayer();

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .limit(5)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
    setLoading(false);
  };

  const testAudioUrl = async (track: any) => {
    setTestResults(prev => ({ ...prev, [track.id]: { testing: true } }));
    
    try {
      const audioUrl = track.audio_file_path.startsWith('http') 
        ? track.audio_file_path 
        : `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files/${track.audio_file_path}`;
      
      // Test HEAD request
      const headResponse = await fetch(audioUrl, { method: 'HEAD' });
      
      // Test GET request for first few bytes
      const getResponse = await fetch(audioUrl, { 
        headers: { 'Range': 'bytes=0-1023' } 
      });
      
      const contentType = headResponse.headers.get('content-type');
      const contentLength = headResponse.headers.get('content-length');
      
      setTestResults(prev => ({
        ...prev,
        [track.id]: {
          testing: false,
          url: audioUrl,
          headStatus: headResponse.status,
          getStatus: getResponse.status,
          contentType,
          contentLength,
          accessible: headResponse.ok && getResponse.ok
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [track.id]: {
          testing: false,
          error: error.message,
          accessible: false
        }
      }));
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Audio Debug Panel</CardTitle>
        <Button onClick={fetchTracks} disabled={loading} size="sm">
          {loading ? 'Loading...' : 'Refresh Tracks'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentTrack && (
          <div className="p-3 bg-purple-900/20 rounded-lg">
            <h4 className="text-white font-medium">Currently Playing</h4>
            <p className="text-white/60 text-sm">{currentTrack.title} by {currentTrack.artist}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={isPlaying ? "default" : "secondary"}>
                {isPlaying ? 'Playing' : 'Paused'}
              </Badge>
              <Badge variant={isLoading ? "outline" : "secondary"}>
                {isLoading ? 'Loading' : 'Ready'}
              </Badge>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <h4 className="text-white font-medium">Recent Tracks ({tracks.length})</h4>
          {tracks.map((track) => {
            const result = testResults[track.id];
            return (
              <div key={track.id} className="p-3 bg-white/5 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white text-sm font-medium">{track.title}</p>
                    <p className="text-white/60 text-xs">{track.artist}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testAudioUrl(track)}
                      disabled={result?.testing}
                    >
                      {result?.testing ? 'Testing...' : 'Test URL'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => playTrack(track)}
                      disabled={isLoading}
                    >
                      Play
                    </Button>
                  </div>
                </div>
                
                {result && !result.testing && (
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex gap-2">
                      <Badge variant={result.accessible ? "default" : "destructive"}>
                        {result.accessible ? 'Accessible' : 'Not Accessible'}
                      </Badge>
                      {result.headStatus && (
                        <Badge variant="outline">HEAD: {result.headStatus}</Badge>
                      )}
                      {result.getStatus && (
                        <Badge variant="outline">GET: {result.getStatus}</Badge>
                      )}
                    </div>
                    {result.contentType && (
                      <p className="text-white/60">Type: {result.contentType}</p>
                    )}
                    {result.contentLength && (
                      <p className="text-white/60">Size: {Math.round(parseInt(result.contentLength) / 1024)} KB</p>
                    )}
                    {result.error && (
                      <p className="text-red-400">Error: {result.error}</p>
                    )}
                    {result.url && (
                      <p className="text-white/40 break-all text-xs">URL: {result.url}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
