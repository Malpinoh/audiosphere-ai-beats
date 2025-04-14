
import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function VerificationBadgeRequest() {
  const { user, profile } = useAuth();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerificationRequest = async () => {
    if (!user) {
      toast.error("You must be logged in to request verification");
      return;
    }

    if (!requestReason.trim()) {
      toast.error("Please provide a reason for verification");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if an existing request is pending
      const { data: existingRequest, error: checkError } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        toast.error("You already have a pending verification request");
        return;
      }

      // Submit new verification request
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          status: 'pending',
          reason: requestReason
        });

      if (error) throw error;

      toast.success("Verification request submitted successfully!");
      setIsRequestModalOpen(false);
      setRequestReason('');
    } catch (error) {
      console.error("Verification request error:", error);
      toast.error("Failed to submit verification request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show for artists
  if (profile?.role !== 'artist') return null;

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsRequestModalOpen(true)}
        disabled={profile.is_verified}
      >
        <Shield className="mr-2 h-4 w-4" />
        {profile.is_verified ? 'Verified' : 'Request Verification'}
      </Button>

      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Verification Badge</DialogTitle>
            <DialogDescription>
              Tell us why you believe you should receive a verification badge.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea 
            placeholder="Explain your achievements, impact, or reasons for verification"
            value={requestReason}
            onChange={(e) => setRequestReason(e.target.value)}
            className="min-h-[120px]"
          />
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerificationRequest} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
