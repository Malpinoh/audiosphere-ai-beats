
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MoreVertical, Search, Trash, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  uploaded_at: string;
  play_count: number;
  like_count: number;
  status: string;
}

export function SongsManagement() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [songToDelete, setSongToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch songs from database
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tracks')
          .select('*')
          .order('uploaded_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Transform the data to match our Song interface
        const formattedSongs = data.map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          uploaded_at: new Date(track.uploaded_at).toISOString().split('T')[0],
          play_count: track.play_count || 0,
          like_count: track.like_count || 0,
          status: track.published ? 'active' : 'pending'
        }));
        
        setSongs(formattedSongs);
      } catch (error) {
        console.error('Error fetching songs:', error);
        toast({
          title: "Error fetching songs",
          description: "Could not load songs from the database.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSongs();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('admin-songs-changes')
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
            setSongs(prevSongs => [{
              id: newRecord.id,
              title: newRecord.title,
              artist: newRecord.artist,
              genre: newRecord.genre,
              uploaded_at: new Date(newRecord.uploaded_at).toISOString().split('T')[0],
              play_count: newRecord.play_count || 0,
              like_count: newRecord.like_count || 0,
              status: newRecord.published ? 'active' : 'pending'
            }, ...prevSongs]);
          } else if (eventType === 'UPDATE') {
            setSongs(prevSongs => prevSongs.map(song => 
              song.id === newRecord.id 
                ? {
                    ...song,
                    title: newRecord.title,
                    artist: newRecord.artist,
                    genre: newRecord.genre,
                    play_count: newRecord.play_count || 0,
                    like_count: newRecord.like_count || 0,
                    status: newRecord.published ? 'active' : 'pending'
                  }
                : song
            ));
          } else if (eventType === 'DELETE') {
            setSongs(prevSongs => prevSongs.filter(song => song.id !== oldRecord.id));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteSong = async () => {
    if (songToDelete) {
      try {
        const { error } = await supabase
          .from('tracks')
          .delete()
          .eq('id', songToDelete);
          
        if (error) {
          throw error;
        }
        
        setSongToDelete(null);
        setDialogOpen(false);
        
        toast({
          title: "Song deleted",
          description: "The song has been successfully removed from the system.",
        });
      } catch (error) {
        console.error('Error deleting song:', error);
        toast({
          title: "Error deleting song",
          description: "Could not delete the song. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleStatusChange = async (songId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tracks')
        .update({ published: newStatus === 'active' })
        .eq('id', songId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Song status updated",
        description: `The song has been marked as ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating song status:', error);
      toast({
        title: "Error updating song status",
        description: "Could not update the song status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading songs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Songs</h2>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search songs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableCaption>List of all songs in the system.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead>Plays</TableHead>
            <TableHead>Likes</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSongs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6">
                No songs found
              </TableCell>
            </TableRow>
          ) : (
            filteredSongs.map((song) => (
              <TableRow key={song.id}>
                <TableCell className="font-medium">{song.title}</TableCell>
                <TableCell>{song.artist}</TableCell>
                <TableCell>{song.genre}</TableCell>
                <TableCell>{song.uploaded_at}</TableCell>
                <TableCell>{song.play_count.toLocaleString()}</TableCell>
                <TableCell>{song.like_count.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      song.status === "active" 
                        ? "outline" 
                        : song.status === "flagged" 
                          ? "secondary" 
                          : "destructive"
                    }
                    className={
                      song.status === "active" 
                        ? "bg-green-100 text-green-800 hover:bg-green-200" 
                        : song.status === "flagged" 
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" 
                          : ""
                    }
                  >
                    {song.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog open={dialogOpen && songToDelete === song.id} onOpenChange={setDialogOpen}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(song.id, "active")}
                          disabled={song.status === "active"}
                        >
                          Mark as Active
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(song.id, "flagged")}
                          disabled={song.status === "flagged"}
                        >
                          Flag Content
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(song.id, "restricted")}
                          disabled={song.status === "restricted"}
                        >
                          Restrict Content
                        </DropdownMenuItem>
                        <DialogTrigger asChild>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setSongToDelete(song.id)}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Song
                          </DropdownMenuItem>
                        </DialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Confirm Song Deletion
                        </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete "{song.title}" by {song.artist}? 
                          This action cannot be undone and will permanently remove the song from the system.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteSong}>
                          Delete Song
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
