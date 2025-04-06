
import { useState } from "react";
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
import { AlertTriangle, MoreVertical, Search, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Mock data for songs
const mockSongs = [
  { 
    id: "1", 
    title: "Summer Vibes", 
    artist: "Luna Echo", 
    genre: "Pop",
    uploadDate: "2023-12-15",
    plays: 12458,
    likes: 843,
    status: "active"
  },
  { 
    id: "2", 
    title: "Midnight Dreams", 
    artist: "Stellar Beats", 
    genre: "Electronic",
    uploadDate: "2024-01-20",
    plays: 8752,
    likes: 621,
    status: "active"
  },
  { 
    id: "3", 
    title: "Urban Stories", 
    artist: "City Sounds", 
    genre: "Hip Hop",
    uploadDate: "2023-11-05",
    plays: 15932,
    likes: 1245,
    status: "active"
  },
  { 
    id: "4", 
    title: "Mountain Echo", 
    artist: "Nomad Soul", 
    genre: "Ambient",
    uploadDate: "2024-02-10",
    plays: 6243,
    likes: 415,
    status: "flagged"
  },
  { 
    id: "5", 
    title: "Digital Revolution", 
    artist: "Cyber Pulse", 
    genre: "Techno",
    uploadDate: "2023-10-30",
    plays: 9871,
    likes: 736,
    status: "restricted"
  }
];

export function SongsManagement() {
  const [songs, setSongs] = useState(mockSongs);
  const [searchTerm, setSearchTerm] = useState("");
  const [songToDelete, setSongToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteSong = () => {
    if (songToDelete) {
      setSongs(songs.filter(song => song.id !== songToDelete));
      setSongToDelete(null);
      setDialogOpen(false);
      
      toast({
        title: "Song deleted",
        description: "The song has been successfully removed from the system.",
      });
    }
  };

  const handleStatusChange = (songId: string, newStatus: string) => {
    setSongs(songs.map(song => 
      song.id === songId 
        ? { ...song, status: newStatus } 
        : song
    ));
    
    toast({
      title: "Song status updated",
      description: `The song has been marked as ${newStatus}.`,
    });
  };

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
          {filteredSongs.map((song) => (
            <TableRow key={song.id}>
              <TableCell className="font-medium">{song.title}</TableCell>
              <TableCell>{song.artist}</TableCell>
              <TableCell>{song.genre}</TableCell>
              <TableCell>{song.uploadDate}</TableCell>
              <TableCell>{song.plays.toLocaleString()}</TableCell>
              <TableCell>{song.likes.toLocaleString()}</TableCell>
              <TableCell>
                <Badge 
                  variant={
                    song.status === "active" 
                      ? "success" 
                      : song.status === "flagged" 
                        ? "warning" 
                        : "destructive"
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
