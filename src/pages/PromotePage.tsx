
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  TrendingUp, 
  Globe, 
  Radio, 
  Rocket, 
  Target, 
  Users, 
  Volume2,
  Megaphone,
  Share,
  Music
} from "lucide-react";
import { toast } from "sonner";

export default function PromotePage() {
  const [selectedTrack, setSelectedTrack] = React.useState("");
  const [selectedPromotion, setSelectedPromotion] = React.useState("standard");
  const [loading, setLoading] = React.useState(false);
  
  const handlePromoteClick = () => {
    if (!selectedTrack) {
      toast.error("Please select a track to promote");
      return;
    }
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Promotion campaign created successfully!");
      setLoading(false);
    }, 1500);
  };
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Promote Your Music</h1>
            <p className="text-muted-foreground">
              Reach new listeners and grow your audience with our promotion tools
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-500/30">
            <CardContent className="p-6 flex items-start">
              <div className="mr-4 rounded-full bg-purple-500/20 p-3">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Boost Your Reach</h3>
                <p className="text-sm text-muted-foreground">
                  Get your music in front of new listeners who are likely to enjoy your style
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30">
            <CardContent className="p-6 flex items-start">
              <div className="mr-4 rounded-full bg-blue-500/20 p-3">
                <Globe className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Global Audience</h3>
                <p className="text-sm text-muted-foreground">
                  Target listeners by region, genre preferences, and listening habits
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500/30">
            <CardContent className="p-6 flex items-start">
              <div className="mr-4 rounded-full bg-red-500/20 p-3">
                <Trophy className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Chart Potential</h3>
                <p className="text-sm text-muted-foreground">
                  Increase your chances of charting with strategic promotion
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="targeted">
          <TabsList className="mb-8">
            <TabsTrigger value="targeted" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Targeted Promotion
            </TabsTrigger>
            <TabsTrigger value="radio" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Radio & Playlists
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Social Media
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="targeted">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Create a Promotion Campaign</CardTitle>
                    <CardDescription>
                      Select a track and promotion package to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Select Track to Promote</Label>
                      <div className="grid gap-3">
                        {[1, 2, 3].map(track => (
                          <div 
                            key={track}
                            className={`p-3 border rounded-md flex items-center cursor-pointer ${
                              selectedTrack === `track-${track}` 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedTrack(`track-${track}`)}
                          >
                            <div className="h-12 w-12 rounded bg-muted"></div>
                            <div className="ml-3">
                              <h4 className="font-medium">Track Title {track}</h4>
                              <p className="text-xs text-muted-foreground">Uploaded on {new Date().toLocaleDateString()}</p>
                            </div>
                            <RadioGroupItem 
                              value={`track-${track}`} 
                              id={`track-${track}`}
                              className="ml-auto"
                              checked={selectedTrack === `track-${track}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label>Choose Promotion Package</Label>
                      <RadioGroup 
                        defaultValue="standard"
                        className="grid gap-3"
                        value={selectedPromotion}
                        onValueChange={setSelectedPromotion}
                      >
                        <div className={`p-3 border rounded-md flex items-start cursor-pointer ${
                          selectedPromotion === "basic" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:bg-muted/50"
                        }`}>
                          <RadioGroupItem value="basic" id="basic" className="mt-1" />
                          <div className="ml-3">
                            <Label htmlFor="basic" className="text-base font-medium">Basic</Label>
                            <p className="text-sm text-muted-foreground">
                              Targeted promotion to 1,000+ potential listeners
                            </p>
                            <p className="text-sm font-medium mt-1">$9.99</p>
                          </div>
                        </div>
                        <div className={`p-3 border rounded-md flex items-start cursor-pointer ${
                          selectedPromotion === "standard" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:bg-muted/50"
                        }`}>
                          <RadioGroupItem value="standard" id="standard" className="mt-1" />
                          <div className="ml-3">
                            <Label htmlFor="standard" className="text-base font-medium">Standard</Label>
                            <p className="text-sm text-muted-foreground">
                              Targeted promotion to 5,000+ potential listeners with detailed analytics
                            </p>
                            <p className="text-sm font-medium mt-1">$24.99</p>
                          </div>
                        </div>
                        <div className={`p-3 border rounded-md flex items-start cursor-pointer ${
                          selectedPromotion === "premium" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:bg-muted/50"
                        }`}>
                          <RadioGroupItem value="premium" id="premium" className="mt-1" />
                          <div className="ml-3">
                            <Label htmlFor="premium" className="text-base font-medium">Premium</Label>
                            <p className="text-sm text-muted-foreground">
                              Targeted promotion to 20,000+ potential listeners with detailed analytics and playlist placement opportunities
                            </p>
                            <p className="text-sm font-medium mt-1">$49.99</p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-4">
                      <Label>Target Regions (Optional)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <Button variant="outline" className="justify-start">
                          <input type="checkbox" className="mr-2" /> North America
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <input type="checkbox" className="mr-2" /> Europe
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <input type="checkbox" className="mr-2" /> Asia
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <input type="checkbox" className="mr-2" /> South America
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <input type="checkbox" className="mr-2" /> Africa
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <input type="checkbox" className="mr-2" /> Oceania
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full maudio-gradient-bg" 
                      onClick={handlePromoteClick}
                      disabled={loading}
                    >
                      {loading ? "Creating Campaign..." : "Create Promotion Campaign"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Promotion Benefits</CardTitle>
                    <CardDescription>
                      How our promotion services help your music reach new heights
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <Rocket className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">Accelerated Growth</h4>
                        <p className="text-sm text-muted-foreground">
                          Quickly increase your streams and followers with targeted promotion to interested listeners.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <Target className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">Precision Targeting</h4>
                        <p className="text-sm text-muted-foreground">
                          Reach listeners most likely to enjoy your music based on genre, listening habits, and location.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">Authentic Engagement</h4>
                        <p className="text-sm text-muted-foreground">
                          We connect you with real listeners who are more likely to become fans and follow your future releases.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <Volume2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">Algorithmic Boost</h4>
                        <p className="text-sm text-muted-foreground">
                          Increased engagement helps your music perform better in streaming platform algorithms.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Success Stories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-md">
                      <p className="italic text-sm mb-2">
                        "After using MAUDIO's promotion service, my monthly listeners increased by 300%. 
                        My track even made it to several popular playlists!"
                      </p>
                      <p className="text-sm font-medium">- Alex Rivera, Electronic Artist</p>
                    </div>
                    
                    <div className="bg-muted/50 p-4 rounded-md">
                      <p className="italic text-sm mb-2">
                        "The targeted promotion helped me find my audience. I'm now connecting with listeners 
                        who truly appreciate my style of music."
                      </p>
                      <p className="text-sm font-medium">- Maya Johnson, Singer-Songwriter</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="radio">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-primary" />
                    Radio Promotion
                  </CardTitle>
                  <CardDescription>
                    Get your music played on radio stations and streaming playlists
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium mb-1">Internet Radio Campaign</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get your track submitted to 200+ internet radio stations that match your genre.
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">$99.99</span>
                        <Button size="sm">Select</Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium mb-1">College Radio Promotion</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Target college radio stations across North America with your music.
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">$149.99</span>
                        <Button size="sm">Select</Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium mb-1">Commercial Radio Introduction</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get your music in front of commercial radio programmers and DJs.
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">$299.99</span>
                        <Button size="sm">Select</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    Playlist Placement
                  </CardTitle>
                  <CardDescription>
                    Get your music featured on popular playlists across streaming platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium mb-1">Independent Playlist Campaign</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Submit your track to 50+ independent curators with audiences matching your genre.
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">$79.99</span>
                        <Button size="sm">Select</Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium mb-1">Premium Playlist Package</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get your music submitted to 100+ popular playlists with significant listener bases.
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">$149.99</span>
                        <Button size="sm">Select</Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium mb-1">Editorial Playlist Consideration</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Professional pitching service to increase chances of editorial playlist placement.
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">$199.99</span>
                        <Button size="sm">Select</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="social">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    Social Media Promotion
                  </CardTitle>
                  <CardDescription>
                    Amplify your music across social platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Select Your Track</Label>
                    <select className="w-full p-2 border border-border rounded-md bg-background">
                      <option value="">Select a track</option>
                      <option value="1">Track 1</option>
                      <option value="2">Track 2</option>
                      <option value="3">Track 3</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Campaign Type</Label>
                    <RadioGroup defaultValue="engagement">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="engagement" id="engagement" />
                        <Label htmlFor="engagement">Engagement Campaign</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="awareness" id="awareness" />
                        <Label htmlFor="awareness">Awareness Campaign</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="conversion" id="conversion" />
                        <Label htmlFor="conversion">Conversion Campaign</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Platforms</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="instagram" className="w-4 h-4" />
                        <Label htmlFor="instagram">Instagram</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="tiktok" className="w-4 h-4" />
                        <Label htmlFor="tiktok">TikTok</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="facebook" className="w-4 h-4" />
                        <Label htmlFor="facebook">Facebook</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="twitter" className="w-4 h-4" />
                        <Label htmlFor="twitter">Twitter</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Budget (USD)</Label>
                    <Input type="number" min="50" step="10" placeholder="Min: $50" />
                    <p className="text-xs text-muted-foreground">
                      Recommended: $100-$300 for best results
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Campaign Duration</Label>
                    <select className="w-full p-2 border border-border rounded-md bg-background">
                      <option value="7">7 days</option>
                      <option value="14" selected>14 days</option>
                      <option value="30">30 days</option>
                    </select>
                  </div>
                  
                  <Button className="w-full maudio-gradient-bg">Create Campaign</Button>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Promotion Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">Increased Visibility</h4>
                        <p className="text-sm text-muted-foreground">
                          Get your music in front of thousands of potential fans on the platforms they use most.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">Audience Building</h4>
                        <p className="text-sm text-muted-foreground">
                          Convert casual listeners into followers and fans who will support your future releases.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <Share className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">Viral Potential</h4>
                        <p className="text-sm text-muted-foreground">
                          Strategic social campaigns increase the chances of your music being shared organically.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      Our promotion experts can help you create a custom campaign strategy
                      tailored to your music and goals.
                    </p>
                    <Button variant="outline" className="w-full">Schedule Consultation</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
