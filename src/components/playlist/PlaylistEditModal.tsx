import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

interface PlaylistEditModalProps {
  playlistId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  currentTitle: string;
  currentDescription: string;
  currentCoverPath: string;
}

export function PlaylistEditModal({
  playlistId,
  isOpen,
  onClose,
  onUpdated,
  currentTitle,
  currentDescription,
  currentCoverPath
}: PlaylistEditModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    setTitle(currentTitle);
    setDescription(currentDescription);
    
    if (currentCoverPath) {
      setPreviewUrl(`https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${currentCoverPath}`);
    }
  }, [currentTitle, currentDescription, currentCoverPath]);

  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [coverFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file must be less than 5MB');
        return;
      }
      
      setCoverFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a playlist title');
      return;
    }

    setLoading(true);
    try {
      let newCoverPath = currentCoverPath;

      // Upload new cover image if provided
      if (coverFile) {
        const fileName = `${playlistId}-${Date.now()}.${coverFile.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cover_art')
          .upload(fileName, coverFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading cover:', uploadError);
          toast.error('Failed to upload cover image');
          return;
        }

        newCoverPath = fileName;
      }

      // Update playlist
      const { error } = await supabase
        .from('playlists')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          cover_image_path: newCoverPath,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlistId);

      if (error) {
        console.error('Error updating playlist:', error);
        toast.error('Failed to update playlist');
        return;
      }

      toast.success('Playlist updated successfully');
      onUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast.error('Failed to update playlist');
    } finally {
      setLoading(false);
    }
  };

  const removeCoverImage = () => {
    setCoverFile(null);
    setPreviewUrl('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter playlist title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter playlist description"
              rows={3}
            />
          </div>

          <div>
            <Label>Cover Image</Label>
            <div className="space-y-3">
              {previewUrl && (
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Playlist cover preview"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removeCoverImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {previewUrl ? 'Change Cover' : 'Upload Cover'}
                </Button>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="maudio-gradient-bg">
              {loading ? 'Updating...' : 'Update Playlist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}