
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ArtistClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistName: string;
  artistProfileId: string;
}

export function ArtistClaimModal({ isOpen, onClose, artistName, artistProfileId }: ArtistClaimModalProps) {
  const { user } = useAuth();
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to claim an artist profile");
      return;
    }

    if (!evidenceText.trim()) {
      toast.error("Please provide evidence for your claim");
      return;
    }

    setIsSubmitting(true);

    try {
      const evidenceUrlsArray = evidenceUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const { error } = await supabase
        .from('artist_claims')
        .insert({
          artist_name: artistName,
          claimant_user_id: user.id,
          artist_profile_id: artistProfileId,
          evidence_text: evidenceText.trim(),
          evidence_urls: evidenceUrlsArray.length > 0 ? evidenceUrlsArray : null
        });

      if (error) {
        throw error;
      }

      toast.success("Artist profile claim submitted successfully! We'll review it and get back to you.");
      setEvidenceText("");
      setEvidenceUrls("");
      onClose();
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error("Failed to submit claim. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Claim Artist Profile: {artistName}</DialogTitle>
          <DialogDescription>
            Submit evidence that you are this artist to claim this profile. Our support team will review your submission.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="evidence-text">Evidence Description *</Label>
            <Textarea
              id="evidence-text"
              placeholder="Describe why you should be able to claim this profile. Include details about your identity as this artist..."
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              rows={4}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="evidence-urls">Supporting Links (Optional)</Label>
            <Textarea
              id="evidence-urls"
              placeholder="Add links to your social media, official website, streaming platforms, etc. (one per line)"
              value={evidenceUrls}
              onChange={(e) => setEvidenceUrls(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Claim
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
