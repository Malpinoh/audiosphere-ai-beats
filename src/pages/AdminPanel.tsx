
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { SongsManagement } from "@/components/admin/SongsManagement";
import { UploadsManagement } from "@/components/admin/UploadsManagement";
import { CommentsManagement } from "@/components/admin/CommentsManagement";
import { ReportsManagement } from "@/components/admin/ReportsManagement";
import { Analytics } from "@/components/admin/Analytics";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Check if the logged-in user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      // If user is not logged in, they can't be an admin
      if (!user) {
        setIsAdminChecked(true);
        return;
      }

      // If we already have the profile and role from the auth context
      if (profile) {
        if (profile.role === 'admin') {
          setIsAuthenticated(true);
        }
        setIsAdminChecked(true);
        return;
      }

      // If profile is not loaded yet, fetch it
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data.role === 'admin') {
          setIsAuthenticated(true);
        } else {
          // Redirect non-admin users
          toast({
            title: "Access Denied",
            description: "You do not have permission to access the admin panel",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate('/');
      } finally {
        setIsAdminChecked(true);
      }
    };

    checkAdminStatus();
  }, [user, profile, navigate, toast]);

  // Simple authentication for admin login
  const handleAdminAuth = (success: boolean) => {
    setIsAuthenticated(success);
    if (!success) {
      toast({
        title: "Authentication Failed",
        description: "Invalid credentials or insufficient permissions",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (!isAdminChecked) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
          <p className="text-center">Checking admin privileges...</p>
        </div>
      </MainLayout>
    );
  }

  // Show admin login form if not authenticated
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
          <AdminAuth onAuth={handleAdminAuth} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
          <Button 
            variant="outline" 
            onClick={() => setIsAuthenticated(false)}
          >
            Logout
          </Button>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-6'} w-full mb-4 md:mb-8`}>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="songs">Songs</TabsTrigger>
              <TabsTrigger value="uploads">Uploads</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="users" className="mt-4 md:mt-6">
            <UsersManagement />
          </TabsContent>
          <TabsContent value="songs" className="mt-4 md:mt-6">
            <SongsManagement />
          </TabsContent>
          <TabsContent value="uploads" className="mt-4 md:mt-6">
            <UploadsManagement />
          </TabsContent>
          <TabsContent value="comments" className="mt-4 md:mt-6">
            <CommentsManagement />
          </TabsContent>
          <TabsContent value="reports" className="mt-4 md:mt-6">
            <ReportsManagement />
          </TabsContent>
          <TabsContent value="analytics" className="mt-4 md:mt-6">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminPanel;
