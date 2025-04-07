
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  ThumbsDown, 
  XCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Mock data for uploads awaiting approval
const mockUploads = [
  { 
    id: "1", 
    title: "Autumn Rain", 
    artist: "Mountain Echo", 
    genre: "Indie Folk",
    uploadDate: "2023-04-05",
    status: "pending",
    reason: ""
  },
  { 
    id: "2", 
    title: "Neon City", 
    artist: "Digital Dreams", 
    genre: "Synthwave",
    uploadDate: "2023-04-04",
    status: "pending",
    reason: ""
  },
  { 
    id: "3", 
    title: "Ocean Waves", 
    artist: "Coastal Sounds", 
    genre: "Ambient",
    uploadDate: "2023-04-03",
    status: "approved",
    reason: ""
  },
  { 
    id: "4", 
    title: "Street Beats", 
    artist: "Urban Flow", 
    genre: "Hip Hop",
    uploadDate: "2023-04-02",
    status: "rejected",
    reason: "Copyrighted material"
  },
  { 
    id: "5", 
    title: "Midnight Drive", 
    artist: "Night Cruiser", 
    genre: "Electronic",
    uploadDate: "2023-04-01",
    status: "pending",
    reason: ""
  }
];

export function UploadsManagement() {
  const [uploads, setUploads] = useState(mockUploads);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [uploadToReject, setUploadToReject] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredUploads = uploads.filter(upload => 
    upload.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    upload.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    upload.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveUpload = (uploadId: string) => {
    setUploads(uploads.map(upload => 
      upload.id === uploadId 
        ? { ...upload, status: "approved", reason: "" } 
        : upload
    ));
    
    toast({
      title: "Upload approved",
      description: "The upload has been approved and is now available on the platform.",
    });
  };

  const handleOpenRejectDialog = (uploadId: string) => {
    setUploadToReject(uploadId);
    setRejectReason("");
    setDialogOpen(true);
  };

  const handleRejectUpload = () => {
    if (uploadToReject) {
      setUploads(uploads.map(upload => 
        upload.id === uploadToReject 
          ? { ...upload, status: "rejected", reason: rejectReason } 
          : upload
      ));
      
      setDialogOpen(false);
      setUploadToReject(null);
      setRejectReason("");
      
      toast({
        title: "Upload rejected",
        description: "The upload has been rejected with the provided reason.",
      });
    }
  };

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
          {filteredUploads.map((upload) => (
            <TableRow key={upload.id}>
              <TableCell className="font-medium">{upload.title}</TableCell>
              <TableCell>{upload.artist}</TableCell>
              <TableCell>{upload.genre}</TableCell>
              <TableCell>{upload.uploadDate}</TableCell>
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
                  {upload.status === "approved" && <CheckCircle className="h-3 w-3" />}
                  {upload.status === "pending" && <Clock className="h-3 w-3" />}
                  {upload.status === "rejected" && <XCircle className="h-3 w-3" />}
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
          ))}
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
