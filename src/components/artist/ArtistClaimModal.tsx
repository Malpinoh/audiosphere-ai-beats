import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ArtistClaimModalProps {
  artistProfileId: string;
  artistName: string;
  isOpen: boolean;
  onClose: () => void;
  onClaimed: () => void;
}

export function ArtistClaimModal({
  artistProfileId,
  artistName,
  isOpen,
  onClose,
  onClaimed
}: ArtistClaimModalProps) {
  const { user } = useAuth();
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidenceFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to claim an artist profile');
      return;
    }

    if (!evidenceText.trim() && evidenceFiles.length === 0) {
      toast.error('Please provide evidence to support your claim');
      return;
    }

    setLoading(true);
    try {
      let evidenceUrls: string[] = [];

      // Upload evidence files if any
      if (evidenceFiles.length > 0) {
        const uploadPromises = evidenceFiles.map(async (file, index) => {
          const fileName = `${artistProfileId}-${user.id}-${Date.now()}-${index}.${file.name.split('.').pop()}`;
          
          const { error: uploadError } = await supabase.storage
            .from('cover_art') // Using existing bucket for evidence files
            .upload(`evidence/${fileName}`, file);

          if (uploadError) {
            console.error('Error uploading evidence file:', uploadError);
            throw new Error(`Failed to upload ${file.name}`);
          }

          return `evidence/${fileName}`;
        });

        evidenceUrls = await Promise.all(uploadPromises);
      }

      // Create the claim
      const { error } = await supabase
        .from('artist_claims')
        .insert({
          artist_profile_id: artistProfileId,
          artist_name: artistName,
          claimant_user_id: user.id,
          evidence_text: evidenceText.trim() || null,
          evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : null,
          claim_type: 'profile_attach',
          claim_status: 'pending'
        });

      if (error) {
        console.error('Error creating claim:', error);
        toast.error('Failed to submit claim');
        return;
      }

      toast.success('Artist claim submitted successfully! Our team will review it shortly.');
      onClaimed();
      onClose();
      
      // Reset form
      setEvidenceText('');
      setEvidenceFiles([]);
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim Artist Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            You are claiming the artist profile for <strong>{artistName}</strong>. 
            Please provide evidence that you are this artist or authorized to manage this profile.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="evidence">Evidence Description *</Label>
              <Textarea
                id="evidence"
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="Describe why you should have access to this profile. Include social media links, official websites, or other proof of identity..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label>Supporting Files (Optional)</Label>
              <div className="space-y-3">
                {evidenceFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('evidence-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add Files
                  </Button>
                  <input
                    id="evidence-upload"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-xs text-muted-foreground">
                    Images, PDFs, or documents
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Our team will review your claim within 24-48 hours. You will be notified via email once processed.
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="maudio-gradient-bg">
                {loading ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}