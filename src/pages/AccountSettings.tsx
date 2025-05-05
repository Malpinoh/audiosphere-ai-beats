import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserCircle, Bell, Lock, LogOut, Camera, Music, Globe, Line, Users } from "lucide-react";
import { VerificationBadgeRequest } from "@/components/profile/VerificationBadgeRequest";

export default function AccountSettings() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    website: profile?.website || "",
    email: user?.email || "",
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false
  });

  const isArtist = profile?.role === 'artist';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          username: formData.username,
          bio: formData.bio,
          website: formData.website
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // Upload new avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        // Update avatar URL in profile
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        if (urlData) {
          await supabase
            .from('profiles')
            .update({ avatar_url: urlData.publicUrl })
            .eq('id', user.id);
        }
      }
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="container py-10">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p>Please log in to access your account settings.</p>
                <Button onClick={() => navigate("/login")} className="mt-4">Login</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          {isArtist && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
              >
                <Link to={`/artist/${user.id}`}>
                  <Users className="mr-2 h-4 w-4" />
                  View Public Profile
                </Link>
              </Button>
              <VerificationBadgeRequest />
            </div>
          )}
        </div>
        
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Profile
            </TabsTrigger>
            {isArtist && (
              <TabsTrigger value="artist" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Artist Info
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>
          
          {/* Basic Profile Tab - For All Users */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and how others see you on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-6">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Profile" 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <UserCircle className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0">
                      <label 
                        htmlFor="avatar-upload" 
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                      >
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Upload avatar</span>
                      </label>
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                        <Input 
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium">Username</label>
                        <Input 
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          placeholder="Your username"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="bio" className="text-sm font-medium">Bio</label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                  <Input 
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Your email address is used for login and cannot be changed here.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={isUpdating}
                    className="maudio-gradient-bg"
                  >
                    {isUpdating ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Artist-specific Tab */}
          {isArtist && (
            <TabsContent value="artist" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Artist Information</CardTitle>
                  <CardDescription>
                    Additional details for your public artist profile.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="website" className="text-sm font-medium">Website/Social Link</label>
                    <Input 
                      id="website"
                      name="website"
                      value={formData.website || ''}
                      onChange={handleInputChange}
                      placeholder="https://yourdomain.com or social media link"
                    />
                    <p className="text-xs text-muted-foreground">
                      Add your official website or main social media profile link.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Verification Status</label>
                    <div className="bg-muted p-3 rounded-md flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {profile?.is_verified ? "Verified Artist" : "Not Verified"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {profile?.is_verified 
                            ? "Your account has been verified. A blue checkmark appears next to your name."
                            : "Request verification to get a blue checkmark next to your name."}
                        </p>
                      </div>
                      <VerificationBadgeRequest />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Follower Count</label>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="font-medium">{profile?.follower_count.toLocaleString() || 0} followers</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleUpdateProfile} 
                      disabled={isUpdating}
                      className="maudio-gradient-bg"
                    >
                      {isUpdating ? "Updating..." : "Save Artist Info"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Choose how and when you want to be notified.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about your track activities and followers via email.
                    </p>
                  </div>
                  <Switch 
                    checked={formData.emailNotifications} 
                    onCheckedChange={(checked) => handleSwitchChange("emailNotifications", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser.
                    </p>
                  </div>
                  <Switch 
                    checked={formData.pushNotifications}
                    onCheckedChange={(checked) => handleSwitchChange("pushNotifications", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Marketing Emails</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new features, promotions, and tips.
                    </p>
                  </div>
                  <Switch 
                    checked={formData.marketingEmails}
                    onCheckedChange={(checked) => handleSwitchChange("marketingEmails", checked)}
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <Button className="maudio-gradient-bg">Save Notification Preferences</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and connected devices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Password</h3>
                  <Button variant="outline">Change Password</Button>
                </div>
                
                <div className="pt-6 border-t space-y-4">
                  <h3 className="font-medium">Account Actions</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="destructive" 
                      className="flex items-center gap-2"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                    <Button variant="outline" className="text-destructive">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Resources section */}
        <div className="mt-8 pt-8 border-t border-border">
          <h2 className="text-xl font-semibold mb-4">Resources</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn how we collect, use, and protect your personal information.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/privacy-policy")}
                >
                  View Privacy Policy
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Terms of Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Read the terms and conditions for using our platform.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/terms-of-service")}
                >
                  View Terms of Service
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Contact Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Need help? Contact our support team for assistance.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/contact-us")}
                >
                  Contact Us
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
