import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Edit, Loader2, Play, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Track {
  id: string;
  title: string;
  genre: string;
  play_count: number;
  like_count: number;
  uploaded_at: string;
  published: boolean;
}

export function TracksTab() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistTracks = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get distributor ID for the current artist
        const { data: distributorData, error: distributorError } = await supabase
          .from('distributors')
          .select('id')
          .eq('auth_id', user.id)
          .single();
          
        if (distributorError) {
          console.error("Error fetching distributor data:", distributorError);
          return;
        }
        
        const distributorId = distributorData.id;
        
        // Get tracks for this distributor
        const { data, error } = await supabase
          .from('tracks')
          .select('id, title, genre, play_count, like_count, uploaded_at, published')
          .eq('distributor_id', distributorId)
          .order('uploaded_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching tracks:", error);
          return;
        }
        
        setTracks(data as Track[]);
      } catch (error) {
        console.error("Error in fetchArtistTracks:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArtistTracks();
    
    // Setup real-time listener for tracks
    const channel = supabase
      .channel('artist-tracks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracks'
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === 'INSERT') {
            const typedNewRecord = newRecord as Track;
            setTracks(prevTracks => [typedNewRecord, ...prevTracks]);
          } else if (eventType === 'UPDATE') {
            const typedNewRecord = newRecord as Track;
            setTracks(prevTracks => prevTracks.map(track => 
              track.id === typedNewRecord.id ? typedNewRecord : track
            ));
          } else if (eventType === 'DELETE') {
            setTracks(prevTracks => prevTracks.filter(track => 
              track.id !== oldRecord.id
            ));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Tracks</CardTitle>
          <CardDescription>
            Manage and monitor all your uploaded music
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading your tracks...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Tracks</CardTitle>
          <CardDescription>
            Manage and monitor all your uploaded music
          </CardDescription>
        </div>
        <Button asChild>
          <Link to="/upload">
            <Plus className="mr-2 h-4 w-4" /> Upload Track
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {tracks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">You haven't uploaded any tracks yet</p>
            <Button asChild>
              <Link to="/upload">
                <Plus className="mr-2 h-4 w-4" /> Upload Your First Track
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead className="text-right">Plays</TableHead>
                <TableHead className="text-right">Likes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.map((track) => (
                <TableRow key={track.id}>
                  <TableCell className="font-medium">{track.title}</TableCell>
                  <TableCell>{track.genre}</TableCell>
                  <TableCell className="text-right">{track.play_count?.toLocaleString() || 0}</TableCell>
                  <TableCell className="text-right">{track.like_count?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    <Badge variant={track.published ? "outline" : "secondary"} className={track.published ? "bg-green-100 text-green-800" : ""}>
                      {track.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(track.uploaded_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link to={`/track/${track.id}`}>
                          <Play className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {tracks.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link to="/track-analytics">
                View Detailed Analytics <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
