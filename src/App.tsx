
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <MusicPlayerProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/artist/:artistId" element={<ArtistProfile />} />
              <Route path="/track/:trackId" element={<TrackPage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/api/docs" element={<ApiDocumentation />} />
              <Route path="/browse" element={<BrowsePage />} /> 
              <Route path="/charts" element={<ChartsPage />} />
              <Route path="/playlists" element={<PlaylistsPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </MusicPlayerProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
