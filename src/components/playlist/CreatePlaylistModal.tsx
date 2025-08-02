import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { X, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreatePlaylistModalProps {
  onPlaylistCreated: () => void;
}

export function CreatePlaylistModal({ onPlaylistCreated }: CreatePlaylistModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile || !['admin', 'editorial'].includes(profile.role)) {
      toast.error('You do not have permission to create playlists');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a playlist title');
      return;
    }

    setLoading(true);

    try {
      let coverImagePath = null;

      // Upload cover image if provided
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Date.now()}-${title.replace(/[^a-zA-Z0-9]/g, '-')}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cover_art')
          .upload(fileName, coverFile);

        if (uploadError) {
          console.error('Error uploading cover:', uploadError);
          toast.error('Failed to upload cover image');
          return;
        }

        coverImagePath = fileName;
      }

      // Create playlist
      const { error } = await supabase
        .from('playlists')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          cover_image_path: coverImagePath,
          created_by: user.id,
          is_editorial: profile.role === 'editorial' || profile.role === 'admin'
        });

      if (error) {
        console.error('Error creating playlist:', error);
        toast.error('Failed to create playlist');
        return;
      }

      toast.success('Playlist created successfully');
      setOpen(false);
      setTitle('');
      setDescription('');
      setCoverFile(null);
      onPlaylistCreated();
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile || !['admin', 'editorial'].includes(profile.role)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="maudio-gradient-bg">
          Create Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-maudio-dark border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Playlist</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new editorial playlist to showcase music.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter playlist title..."
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter playlist description..."
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cover" className="text-white">Cover Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="bg-white/5 border-white/10 text-white"
              />
              {coverFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCoverFile(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="maudio-gradient-bg"
            >
              {loading ? 'Creating...' : 'Create Playlist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}