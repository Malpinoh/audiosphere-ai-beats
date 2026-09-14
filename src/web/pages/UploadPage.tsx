
import React, { useEffect } from "react";
import { useAuth } from "@web/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import MainLayout from "@web/components/layout/MainLayout";
import { UploadForm } from "@web/components/upload/UploadForm";
import { AudioDebugPanel } from "@web/components/debug/AudioDebugPanel";
import { StorageSetup } from "@web/components/admin/StorageSetup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@web/components/ui/card";
import { toast } from "sonner";

export default function UploadPage() {
  const { user, profile } = useAuth();
  
  useEffect(() => {
    // Notify user if they don't have upload permissions
    if (user && profile && profile.role !== 'admin') {
      toast.error("Only admins can upload music to the platform");
    }
  }, [user, profile]);
  
  // Redirect if user is not logged in
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has admin role only
  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-overlay-foreground">Upload Music</h1>
            <p className="text-lg text-overlay-foreground/60">Admin panel - Upload music to the platform</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="bg-overlay/40 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-overlay-foreground">Upload Track</CardTitle>
                  <CardDescription className="text-overlay-foreground/60">
                    Upload music as an admin. You can specify any artist name to auto-register them on the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadForm />
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-1 space-y-6">
              <StorageSetup />
              
              <Card className="bg-overlay/40 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-overlay-foreground">Admin Upload Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-overlay-foreground/80">
                    <li className="flex items-start">
                      <span className="font-medium mr-2 text-primary">•</span> 
                      <span>Upload high-quality audio files (320kbps MP3 or WAV)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2 text-primary">•</span> 
                      <span>Artists will be auto-registered when you upload their music</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2 text-primary">•</span> 
                      <span>Use square cover art (minimum 1400x1400px)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2 text-primary">•</span> 
                      <span>Include accurate metadata and genre information</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2 text-primary">•</span> 
                      <span>Add lyrics when available to increase engagement</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2 text-primary">•</span> 
                      <span>Setup storage buckets before uploading</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <AudioDebugPanel />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
