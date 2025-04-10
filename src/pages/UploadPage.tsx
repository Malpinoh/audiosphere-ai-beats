
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { UploadForm } from "@/components/upload/UploadForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function UploadPage() {
  const { user, profile } = useAuth();
  
  useEffect(() => {
    // Notify user if they don't have upload permissions
    if (user && profile && profile.role === 'user') {
      toast.error("Only artists, distributors, and admins can upload music");
    }
  }, [user, profile]);
  
  // Redirect if user is not logged in or doesn't have appropriate role
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has appropriate role
  if (!['artist', 'distributor', 'admin'].includes(profile.role)) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Upload Your Music</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload Track</CardTitle>
                <CardDescription>
                  Share your music with the world. Upload MP3 or WAV files, add cover art, and provide details about your track.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadForm />
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="font-medium mr-1">•</span> 
                    <span>Use high-quality audio files (320kbps MP3 or WAV)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-1">•</span> 
                    <span>Upload square cover art (minimum 1400x1400px)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-1">•</span> 
                    <span>Add detailed metadata to help listeners find your music</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-1">•</span> 
                    <span>Include lyrics to increase engagement</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-1">•</span> 
                    <span>Select the right mood and genre tags</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
