
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { Analytics } from "@/components/admin/Analytics";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { SongsManagement } from "@/components/admin/SongsManagement";
import { UploadsManagement } from "@/components/admin/UploadsManagement";
import { ReportsManagement } from "@/components/admin/ReportsManagement";
import { CommentsManagement } from "@/components/admin/CommentsManagement";
import { VerificationManagement } from "@/components/admin/VerificationManagement";
import { PayoutsManagement } from "@/components/admin/PayoutsManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Users, 
  Music, 
  Upload, 
  Flag, 
  MessageSquare,
  Shield,
  DollarSign
} from "lucide-react";

export default function AdminPanel() {
  const { user, profile } = useAuth();
  
  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Show auth component if not admin
  if (!profile || profile.role !== 'admin') {
    return (
      <MainLayout>
        <AdminAuth onAuth={() => {}} />
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-slate-900/50">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 text-white">Admin Panel</h1>
            <p className="text-lg text-white/60">Manage your music platform</p>
          </div>
          
          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="bg-black/20 border-white/10 p-1">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="songs" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Songs
              </TabsTrigger>
              <TabsTrigger value="uploads" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Uploads
              </TabsTrigger>
              <TabsTrigger value="verification" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Verification
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="payouts" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payouts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics">
              <Analytics />
            </TabsContent>
            
            <TabsContent value="users">
              <UsersManagement />
            </TabsContent>
            
            <TabsContent value="songs">
              <SongsManagement />
            </TabsContent>
            
            <TabsContent value="uploads">
              <UploadsManagement />
            </TabsContent>
            
            <TabsContent value="verification">
              <VerificationManagement />
            </TabsContent>
            
            <TabsContent value="reports">
              <ReportsManagement />
            </TabsContent>
            
            <TabsContent value="comments">
              <CommentsManagement />
            </TabsContent>
            
            <TabsContent value="payouts">
              <PayoutsManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
