
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { UploadForm } from "@/components/upload/UploadForm";
import { AudioDebugPanel } from "@/components/debug/AudioDebugPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-slate-900/50">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-white">Upload Music</h1>
            <p className="text-lg text-white/60">Admin panel - Upload music to the platform</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Upload Track</CardTitle>
                  <CardDescription className="text-white/60">
                    Upload music as an admin. You can specify any artist name to auto-register them on the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadForm />
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-1 space-y-6">
              <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Admin Upload Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-white/80">
                    <li className="flex items-start">
                      <span className="font-medium mr-2 text-purple-400">•</span> 
                      <span>Upload high-quality audio files (320kbps MP3 or WAV)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2 text-purple-400">•</span> 
                      <span>Artists will be auto-registered when you upload their music</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2 text-purple-400">•</span> 
                      <span>Use square cover art (minimum 1400x1400px)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2 text-purple-400">•</span> 
                      <span>Include accurate metadata and genre information</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2 text-purple-400">•</span> 
                      <span>Add lyrics when available to increase engagement</span>
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
