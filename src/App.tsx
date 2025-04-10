
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UploadPage from "./pages/UploadPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import AdminPanel from "./pages/AdminPanel";
import ArtistProfile from "./pages/ArtistProfile";
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

// Home route that redirects based on role
const HomeRoute = () => {
  const { user, profile, loading } = useAuth();
  
  // Show loading or home page while auth is loading
  if (loading || !user || !profile) {
    return <Index />;
  }
  
  // Redirect based on role
  if (profile.role === 'artist') {
    return <Navigate to="/artist-dashboard" replace />;
  } else if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Index />;
  }
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
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
      <Route path="/artist/:artistId" element={<ArtistProfile />} />
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
      
      {/* New routes */}
      <Route path="/account-settings" element={<AccountSettings />} />
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
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
);

export default App;
