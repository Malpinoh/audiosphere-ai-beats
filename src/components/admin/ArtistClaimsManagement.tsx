
import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ArtistClaim {
  id: string;
  artist_name: string;
  claimant_user_id: string;
  artist_profile_id: string;
  claim_status: 'pending' | 'approved' | 'rejected';
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
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
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

  const handleReviewClaim = (claim: ArtistClaim, action: 'approve' | 'reject') => {
    setSelectedClaim(claim);
    setReviewAction(action);
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!selectedClaim) return;

    setProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Update the claim status
      const { error: claimError } = await supabase
        .from('artist_claims')
        .update({
          claim_status: reviewAction,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', selectedClaim.id);

      if (claimError) {
        throw claimError;
      }

      // If approved, transfer the artist profile ownership using the database function
      if (reviewAction === 'approve') {
        try {
          // Call the database function to handle the complex profile transfer
          const { data, error: functionError } = await supabase.rpc('approve_artist_claim', {
            claim_id: selectedClaim.id,
            admin_id: user.id
          });

          if (functionError) {
            console.warn('Database function not available, using fallback method:', functionError);
            
            // Fallback: Manual profile transfer
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                claimable: false,
                auto_created: false,
                role: 'artist'
              })
              .eq('id', selectedClaim.artist_profile_id);

            if (profileError) {
              console.error('Error updating profile:', profileError);
            }

            // Update tracks to point to the claiming user
            const { error: tracksError } = await supabase
              .from('tracks')
              .update({
                user_id: selectedClaim.claimant_user_id,
                artist_profile_id: selectedClaim.claimant_user_id
              })
              .eq('artist_profile_id', selectedClaim.artist_profile_id);

            if (tracksError) {
              console.error('Error updating tracks:', tracksError);
            }
          } else {
            console.log('Artist claim approved successfully via database function');
          }
        } catch (error) {
          console.error('Error in approval process:', error);
          toast.error("Claim approved but there may have been issues with profile transfer");
        }
      }

      toast.success(`Claim ${reviewAction}d successfully`);
      setReviewModalOpen(false);
      setSelectedClaim(null);
      setReviewNotes("");
      fetchClaims();
    } catch (error) {
      console.error('Error processing claim:', error);
      toast.error("Failed to process claim");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
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
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReviewClaim(claim, 'reject')}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
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
              {reviewAction && ` - ${reviewAction.charAt(0).toUpperCase() + reviewAction.slice(1)}`}
            </DialogTitle>
            <DialogDescription>
              Review the evidence provided by the claimant.
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Evidence Description:</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
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
                        className="block text-blue-600 hover:underline text-sm"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Add any notes about your decision..."
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
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {reviewAction === 'approve' ? 'Approve Claim' : 'Reject Claim'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
