
import { useState } from "react";
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

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Simple authentication for demo purposes
  const handleAdminAuth = (success: boolean) => {
    setIsAuthenticated(success);
    if (success) {
      toast({
        title: "Authentication successful",
        description: "Welcome to the admin panel",
      });
    }
  };

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button 
            variant="outline" 
            onClick={() => setIsAuthenticated(false)}
          >
            Logout
          </Button>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid grid-cols-6 mb-8">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="songs">Songs</TabsTrigger>
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6">
            <UsersManagement />
          </TabsContent>
          <TabsContent value="songs" className="mt-6">
            <SongsManagement />
          </TabsContent>
          <TabsContent value="uploads" className="mt-6">
            <UploadsManagement />
          </TabsContent>
          <TabsContent value="comments" className="mt-6">
            <CommentsManagement />
          </TabsContent>
          <TabsContent value="reports" className="mt-6">
            <ReportsManagement />
          </TabsContent>
          <TabsContent value="analytics" className="mt-6">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminPanel;
