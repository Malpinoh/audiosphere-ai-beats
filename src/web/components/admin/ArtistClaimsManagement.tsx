
import React, { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@web/components/ui/table";
import { Button } from "@web/components/ui/button";
import { Badge } from "@web/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@web/components/ui/dialog";
import { Textarea } from "@web/components/ui/textarea";
import { Label } from "@web/components/ui/label";
import { Check, X, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@shared/integrations/supabase/client";

interface ArtistClaim {
  id: string;
  artist_name: string;
  claimant_user_id: string;
  artist_profile_id: string;
  claim_status: 'pending' | 'approved' | 'rejected' | 'needs_evidence';
  evidence_text: string;
  evidence_urls: string[] | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export function ArtistClaimsManagement() {
  const [claims, setClaims] = useState<ArtistClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<ArtistClaim | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'evidence'>('approve');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchClaims();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('artist-claims-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'artist_claims'
        },
        () => {
          fetchClaims();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('artist_claims')
        .select('*')
        .order('submitted_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setClaims(data as ArtistClaim[]);
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast.error("Failed to load artist claims");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClaim = (claim: ArtistClaim, action: 'approve' | 'reject' | 'evidence') => {
    setSelectedClaim(claim);
    setReviewAction(action);
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!selectedClaim) return;

    setProcessing(true);
    
    try {
      // Single transactional server-side call — no browser fallback.
      if (reviewAction === 'evidence' && reviewNotes.trim().length < 5) {
        toast.error("Tell the artist what evidence is needed");
        setProcessing(false);
        return;
      }
      const { error } = reviewAction === 'evidence'
        ? await (supabase.rpc as any)('request_artist_claim_evidence', { claim_id: selectedClaim.id, message: reviewNotes.trim() })
        : await (supabase.rpc as any)(reviewAction === 'approve' ? 'approve_artist_claim' : 'reject_artist_claim', {
            claim_id: selectedClaim.id,
            admin_notes: reviewNotes.trim() || null,
          });
      if (error) throw error;

      toast.success(reviewAction === 'approve' ? 'Claim approved — artist now manages this page' : reviewAction === 'evidence' ? 'Evidence request sent to the artist' : 'Claim rejected');
      setReviewModalOpen(false);
      setSelectedClaim(null);
      setReviewNotes("");
      fetchClaims();
    } catch (error: any) {
      console.error('Error processing claim:', error);
      toast.error(error?.message ? `Could not update claim: ${error.message}` : "Failed to process claim");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" >Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'needs_evidence':
        return <Badge variant="outline" className="border-accent text-accent">Evidence requested</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading claims...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Artist Profile Claims</h2>
      </div>

      <Table>
        <TableCaption>List of artist profile claims awaiting review.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Artist Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Evidence</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map((claim) => (
            <TableRow key={claim.id}>
              <TableCell className="font-medium">{claim.artist_name}</TableCell>
              <TableCell>{getStatusBadge(claim.claim_status)}</TableCell>
              <TableCell>{new Date(claim.submitted_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedClaim(claim);
                    setReviewModalOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </TableCell>
              <TableCell className="text-right">
                {claim.claim_status === 'pending' && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewClaim(claim, 'approve')}
                      className="text-primary border-primary"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewClaim(claim, 'reject')}
                      className="text-destructive border-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleReviewClaim(claim, 'evidence')}>
                      Request evidence
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Review Claim: {selectedClaim?.artist_name}
              {reviewAction === 'evidence' ? ' - Request more evidence' : ` - ${reviewAction.charAt(0).toUpperCase() + reviewAction.slice(1)}`}
            </DialogTitle>
            <DialogDescription>
              Review the evidence provided by the claimant.
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Evidence Description:</Label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                  {selectedClaim.evidence_text}
                </div>
              </div>
              
              {selectedClaim.evidence_urls && selectedClaim.evidence_urls.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Supporting Links:</Label>
                  <div className="mt-1 space-y-1">
                    {selectedClaim.evidence_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-primary hover:underline text-sm"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="review-notes">{reviewAction === 'evidence' ? 'Message to the artist (they will see this)' : 'Review Notes (Optional, private)'}</Label>
                <Textarea
                  id="review-notes"
                  placeholder={reviewAction === 'evidence' ? "e.g. Please share a link to your Spotify for Artists or distributor dashboard" : "Add any notes about your decision..."}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            {reviewAction && (
              <Button
                onClick={submitReview}
                disabled={processing}
                variant={reviewAction === 'reject' ? 'destructive' : 'default'}
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {reviewAction === 'approve' ? 'Approve Claim' : reviewAction === 'evidence' ? 'Send Request' : 'Reject Claim'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
