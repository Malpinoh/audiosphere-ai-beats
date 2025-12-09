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
  DollarSign,
  Menu
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const adminTabs = [
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "users", label: "Users", icon: Users },
  { value: "songs", label: "Songs", icon: Music },
  { value: "uploads", label: "Uploads", icon: Upload },
  { value: "verification", label: "Verification", icon: Shield },
  { value: "reports", label: "Reports", icon: Flag },
  { value: "comments", label: "Comments", icon: MessageSquare },
  { value: "payouts", label: "Payouts", icon: DollarSign },
];

export default function AdminPanel() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("analytics");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  const TabContent = () => {
    switch (activeTab) {
      case "analytics": return <Analytics />;
      case "users": return <UsersManagement />;
      case "songs": return <SongsManagement />;
      case "uploads": return <UploadsManagement />;
      case "verification": return <VerificationManagement />;
      case "reports": return <ReportsManagement />;
      case "comments": return <CommentsManagement />;
      case "payouts": return <PayoutsManagement />;
      default: return <Analytics />;
    }
  };

  const TabButton = ({ tab, onClick }: { tab: typeof adminTabs[0], onClick?: () => void }) => (
    <button
      onClick={() => {
        setActiveTab(tab.value);
        onClick?.();
      }}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-all ${
        activeTab === tab.value 
          ? 'bg-primary text-primary-foreground shadow-md' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <tab.icon className="h-5 w-5 flex-shrink-0" />
      <span className="font-medium">{tab.label}</span>
    </button>
  );
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="container py-6 lg:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm lg:text-base text-muted-foreground mt-1">Manage your music platform</p>
            </div>
            
            {/* Mobile menu trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold">Admin Navigation</h2>
                </div>
                <ScrollArea className="h-[calc(100vh-80px)]">
                  <div className="p-4 space-y-2">
                    {adminTabs.map((tab) => (
                      <TabButton 
                        key={tab.value} 
                        tab={tab} 
                        onClick={() => setMobileMenuOpen(false)} 
                      />
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex gap-6 lg:gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-2">
                {adminTabs.map((tab) => (
                  <TabButton key={tab.value} tab={tab} />
                ))}
              </div>
            </aside>
            
            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <div className="bg-card rounded-xl border border-border p-4 lg:p-6">
                <TabContent />
              </div>
            </main>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
