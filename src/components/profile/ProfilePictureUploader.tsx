
import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, Camera } from "lucide-react";

interface ProfilePictureUploaderProps {
  size?: 'sm' | 'md' | 'lg';
}

export function ProfilePictureUploader({ size = 'md' }: ProfilePictureUploaderProps) {
  const { user, profile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const sizeClasses = {
    'sm': 'w-10 h-10',
    'md': 'w-20 h-20',
    'lg': 'w-32 h-32'
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error("You must be logged in to upload a profile picture");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error("Only JPG, PNG, and GIF files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile_picture_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profile_pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL - this is the part that needs fixing
      const { data } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(fileName);

      // Make sure data.publicUrl exists before proceeding
      if (!data.publicUrl) {
        throw new Error("Failed to get public URL");
      }

      // Update profile with new avatar URL
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      toast.success("Profile picture updated successfully!");
      
      // Force a reload of the page to show updated profile picture
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Profile picture upload error:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <input 
        type="file" 
        accept="image/jpeg,image/png,image/gif" 
        className="hidden" 
        id="profile-picture-upload"
        onChange={handleProfilePictureUpload}
        disabled={isUploading}
      />
      <label htmlFor="profile-picture-upload" className="cursor-pointer">
        <Avatar className={`${sizeClasses[size]} ${isUploading ? 'opacity-50' : ''}`}>
          <AvatarImage 
            src={profile?.avatar_url || undefined} 
            alt="Profile Picture" 
          />
          <AvatarFallback>{profile?.full_name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1">
          <Camera className="w-4 h-4" />
        </div>
      </label>
    </div>
  );
}
