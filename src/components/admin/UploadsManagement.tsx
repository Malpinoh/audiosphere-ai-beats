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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  ThumbsDown, 
  XCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Upload {
  id: string;
  title: string;
  artist: string;
  genre: string;
  uploaded_at: string;
  status: string;
  reason: string;
}

export function UploadsManagement() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [uploadToReject, setUploadToReject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch uploads from database
  useEffect(() => {
    const fetchUploads = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tracks')
          .select('*')
          .order('uploaded_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Transform the data to match our Upload interface
        const formattedUploads = data.map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          uploaded_at: new Date(track.uploaded_at).toISOString().split('T')[0],
          status: track.published ? 'approved' : 'pending',
          reason: track.description || ''
        }));
        
        setUploads(formattedUploads);
      } catch (error) {
        console.error('Error fetching uploads:', error);
        toast({
          title: "Error fetching uploads",
          description: "Could not load uploads from the database.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUploads();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('admin-uploads-changes')
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
            setUploads(prevUploads => [{
              id: newRecord.id,
              title: newRecord.title,
              artist: newRecord.artist,
              genre: newRecord.genre,
              uploaded_at: new Date(newRecord.uploaded_at).toISOString().split('T')[0],
              status: newRecord.published ? 'approved' : 'pending',
              reason: newRecord.description || ''
            }, ...prevUploads]);
          } else if (eventType === 'UPDATE') {
            setUploads(prevUploads => prevUploads.map(upload => 
              upload.id === newRecord.id 
                ? {
                    ...upload,
                    title: newRecord.title,
                    artist: newRecord.artist,
                    genre: newRecord.genre,
                    status: newRecord.published ? 'approved' : 'pending',
                    reason: newRecord.description || ''
                  }
                : upload
            ));
          } else if (eventType === 'DELETE') {
            setUploads(prevUploads => prevUploads.filter(upload => upload.id !== oldRecord.id));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const filteredUploads = uploads.filter(upload => 
    upload.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    upload.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    upload.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveUpload = async (uploadId: string) => {
    try {
      const { error } = await supabase
        .from('tracks')
        .update({ published: true, description: null })
        .eq('id', uploadId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Upload approved",
        description: "The upload has been approved and is now available on the platform.",
      });
    } catch (error) {
      console.error('Error approving upload:', error);
      toast({
        title: "Error approving upload",
        description: "Could not approve the upload. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenRejectDialog = (uploadId: string) => {
    setUploadToReject(uploadId);
    setRejectReason("");
    setDialogOpen(true);
  };

  const handleRejectUpload = async () => {
    if (uploadToReject) {
      try {
        const { error } = await supabase
          .from('tracks')
          .update({ published: false, description: rejectReason })
          .eq('id', uploadToReject);
          
        if (error) {
          throw error;
        }
        
        setDialogOpen(false);
        setUploadToReject(null);
        setRejectReason("");
        
        toast({
          title: "Upload rejected",
          description: "The upload has been rejected with the provided reason.",
        });
      } catch (error) {
        console.error('Error rejecting upload:', error);
        toast({
          title: "Error rejecting upload",
          description: "Could not reject the upload. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading uploads...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Uploads</h2>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search uploads..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableCaption>Manage artist uploads and approvals.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason (if rejected)</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUploads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">
                No uploads found
              </TableCell>
            </TableRow>
          ) : (
            filteredUploads.map((upload) => (
              <TableRow key={upload.id}>
                <TableCell className="font-medium">{upload.title}</TableCell>
                <TableCell>{upload.artist}</TableCell>
                <TableCell>{upload.genre}</TableCell>
                <TableCell>{upload.uploaded_at}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      upload.status === "approved" 
                        ? "outline" 
                        : upload.status === "pending" 
                          ? "outline" 
                          : "destructive"
                    }
                    className={
                      upload.status === "approved" 
                        ? "bg-green-100 text-green-800 hover:bg-green-200" 
                        : upload.status === "pending" 
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200" 
                          : ""
                    }
                    
                  >
                    {upload.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {upload.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                    {upload.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                    {upload.status}
                  </Badge>
                </TableCell>
                <TableCell>{upload.reason}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {upload.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveUpload(upload.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOpenRejectDialog(upload.id)}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {upload.status === "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApproveUpload(upload.id)}
                      >
                        Reconsider
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Provide Rejection Reason
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this upload. This will be shared with the artist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="Reason for rejection"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectUpload} disabled={!rejectReason.trim()}>
              Reject Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
