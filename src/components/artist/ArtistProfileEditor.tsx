
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProfilePictureUploader } from "@/components/profile/ProfilePictureUploader";
import { VerificationBadgeRequest } from "@/components/profile/VerificationBadgeRequest";
import { useArtistProfile } from "@/hooks/use-artist-profile";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function ArtistProfileEditor() {
  const { profile } = useAuth();
  const { artistProfile, loading, updateProfile } = useArtistProfile();
  const [formData, setFormData] = useState({
    full_name: artistProfile?.full_name || '',
    username: artistProfile?.username || '',
    bio: artistProfile?.bio || '',
    website: artistProfile?.website || ''
  });
  const [saving, setSaving] = useState(false);

  // Update form data when profile loads
  if (artistProfile && !loading && !formData.full_name) {
    setFormData({
      full_name: artistProfile.full_name || '',
      username: artistProfile.username || '',
      bio: artistProfile.bio || '',
      website: artistProfile.website || ''
    });
  }

  const handleSave = async () => {
    setSaving(true);
    const success = await updateProfile(formData);
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </CardContent>
      </Card>
    );
  }

  // Only show for artists
  if (profile?.role !== 'artist') {
    return null;
  }

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Edit Artist Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <ProfilePictureUploader size="lg" />
          <div className="flex gap-2">
            <VerificationBadgeRequest />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Full Name
            </label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Your artist name"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Username
            </label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="@username"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Bio
          </label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell your fans about yourself..."
            className="bg-white/10 border-white/20 text-white min-h-[100px]"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Website
          </label>
          <Input
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="https://yourwebsite.com"
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full maudio-gradient-bg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
