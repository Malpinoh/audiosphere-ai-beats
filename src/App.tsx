import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useCapacitor } from "@/hooks/use-capacitor";
import { useIsMobile } from "@/hooks/use-mobile";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AuthPage from "./pages/AuthPage";
import UploadPage from "./pages/UploadPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import AdminPanel from "./pages/AdminPanel";
import ArtistProfile from "./pages/ArtistProfile";
import ArtistsPage from "./pages/ArtistsPage";
import ApiDocumentation from "./pages/ApiDocumentation";
import NotFound from "./pages/NotFound";
import TrackPage from "./pages/TrackPage";
import BrowsePage from "./pages/BrowsePage";
import ChartsPage from "./pages/ChartsPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import ReportPage from "./pages/ReportPage";
import AccountSettings from "./pages/AccountSettings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";
import ArtistDashboard from "./pages/ArtistDashboard";
import PromotePage from "./pages/PromotePage";
import ServiceInfoPage from "./pages/ServiceInfoPage";
import LibraryPage from "./pages/LibraryPage";
import PlaylistDetailPage from "./pages/PlaylistDetailPage";
import AlbumPage from "./pages/AlbumPage";
import GenrePage from "./pages/GenrePage";
import TrendingPage from "./pages/TrendingPage";

const queryClient = new QueryClient();

// Protected route component for admin access
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  
  // Show nothing while loading auth state
  if (loading) return null;
  
  // If not logged in or not an admin, redirect to home
  if (!user || !profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Protected route component for artist access
const ArtistRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  
  // Show nothing while loading auth state
  if (loading) return null;
  
  // If not logged in or not an artist, redirect to home
  if (!user || !profile || profile.role !== 'artist') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Protected route component for content creators (artists, distributors, admins)
const ContentCreatorRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  
  // Show nothing while loading auth state
  if (loading) return null;
  
  // If not logged in or doesn't have appropriate role, redirect to home
  if (!user || !profile || !['artist', 'distributor', 'admin'].includes(profile.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Mobile authentication guard
const MobileAuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  
  // Show nothing while loading auth state
  if (loading) return null;
  
  // On mobile, require authentication for homepage access
  if (isMobile && !user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isNative } = useCapacitor();

  return (
    <Routes>
      <Route path="/" element={
        <MobileAuthGuard>
          <Index />
        </MobileAuthGuard>
      } />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route 
        path="/upload" 
        element={
          <ContentCreatorRoute>
            <UploadPage />
          </ContentCreatorRoute>
        } 
      />
      <Route path="/recommendations" element={<RecommendationsPage />} />
      <Route path="/artists" element={<ArtistsPage />} />
      <Route path="/artist/:artistSlug" element={<ArtistProfile />} />
      <Route path="/album/:albumId" element={<AlbumPage />} />
      <Route path="/track/:trackId" element={<TrackPage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } 
      />
      <Route path="/api/docs" element={<ApiDocumentation />} />
      <Route path="/browse" element={<BrowsePage />} /> 
      <Route path="/charts" element={<ChartsPage />} />
      <Route path="/playlists" element={<PlaylistsPage />} />
      <Route path="/playlist/:playlistId" element={<PlaylistDetailPage />} />
      <Route path="/genre/:genreId" element={<GenrePage />} />
      <Route path="/genres" element={<BrowsePage />} />
      <Route path="/trending" element={<TrendingPage />} />
      
      {/* Settings and info pages */}
      <Route path="/account-settings" element={<AccountSettings />} />
      <Route path="/account" element={<AccountSettings />} />
      <Route path="/profile" element={<AccountSettings />} />
      <Route path="/service-info" element={<ServiceInfoPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route 
        path="/artist-dashboard" 
        element={
          <ArtistRoute>
            <ArtistDashboard />
          </ArtistRoute>
        }
      />
      <Route 
        path="/promote" 
        element={
          <ContentCreatorRoute>
            <PromotePage />
          </ContentCreatorRoute>
        }
      />
      
      {/* Catch-all route for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Initialize Capacitor if needed
  useCapacitor();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <MusicPlayerProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </MusicPlayerProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
