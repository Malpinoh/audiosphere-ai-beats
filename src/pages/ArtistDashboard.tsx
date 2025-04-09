
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { BarChart, LineChart, PieChart, Trendline } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Upload, 
  TrendingUp, 
  BarChart3, 
  Globe, 
  Users, 
  Music, 
  Play, 
  Share,
  FileBarChart,
  BookMarked,
  Megaphone
} from "lucide-react";

export default function ArtistDashboard() {
  const { user, profile } = useAuth();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  
  // Redirect non-artists
  if (!user || !profile || profile.role !== 'artist') {
    return <Navigate to="/" replace />;
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Artist Dashboard</h1>
            <p className="text-muted-foreground">
              Track your music performance and engage with your audience
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button asChild className="maudio-gradient-bg">
              <Link to="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Track
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/promote">
                <Megaphone className="mr-2 h-4 w-4" />
                Promote Music
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Plays</p>
                  <h3 className="text-2xl font-bold">54.2K</h3>
                </div>
                <Play className="h-8 w-8 text-primary opacity-80" />
              </div>
              <p className="text-xs flex items-center mt-2 text-green-500">
                <TrendingUp className="h-3 w-3 mr-1" /> 
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Followers</p>
                  <h3 className="text-2xl font-bold">1,254</h3>
                </div>
                <Users className="h-8 w-8 text-primary opacity-80" />
              </div>
              <p className="text-xs flex items-center mt-2 text-green-500">
                <TrendingUp className="h-3 w-3 mr-1" /> 
                +8.3% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tracks</p>
                  <h3 className="text-2xl font-bold">12</h3>
                </div>
                <Music className="h-8 w-8 text-primary opacity-80" />
              </div>
              <p className="text-xs flex items-center mt-2">
                <span className="text-muted-foreground">Last upload 5 days ago</span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Shares</p>
                  <h3 className="text-2xl font-bold">327</h3>
                </div>
                <Share className="h-8 w-8 text-primary opacity-80" />
              </div>
              <p className="text-xs flex items-center mt-2 text-green-500">
                <TrendingUp className="h-3 w-3 mr-1" /> 
                +24.1% from last month
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="analytics" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="tracks" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              My Tracks
            </TabsTrigger>
            <TabsTrigger value="audience" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Audience
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Plays Over Time</CardTitle>
                      <CardDescription>Track plays over the selected period</CardDescription>
                    </div>
                    <select 
                      className="border border-border rounded px-3 py-1 text-sm" 
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as "week" | "month" | "year")}
                    >
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <LineChart 
                      data={[
                        { date: "Mon", plays: 120 },
                        { date: "Tue", plays: 240 },
                        { date: "Wed", plays: 180 },
                        { date: "Thu", plays: 350 },
                        { date: "Fri", plays: 410 },
                        { date: "Sat", plays: 320 },
                        { date: "Sun", plays: 280 },
                      ]}
                      categories={["plays"]}
                      index="date"
                      colors={["primary"]}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Tracks</CardTitle>
                  <CardDescription>Your most popular music</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <BarChart 
                      data={[
                        { track: "Summer Vibes", plays: 1240 },
                        { track: "Midnight Dreams", plays: 980 },
                        { track: "City Lights", plays: 750 },
                        { track: "Mountain High", plays: 540 },
                        { track: "Ocean Waves", plays: 320 },
                      ]}
                      categories={["plays"]}
                      index="track"
                      colors={["primary"]}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Audience Demographics</CardTitle>
                  <CardDescription>Understand your listener base</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="mb-2 font-medium text-sm">Age Distribution</h4>
                      <div className="h-[250px]">
                        <PieChart 
                          data={[
                            { age: "18-24", value: 35 },
                            { age: "25-34", value: 45 },
                            { age: "35-44", value: 15 },
                            { age: "45+", value: 5 },
                          ]}
                          category="value"
                          index="age"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 font-medium text-sm">Regional Distribution</h4>
                      <div className="h-[250px]">
                        <PieChart 
                          data={[
                            { region: "North America", value: 55 },
                            { region: "Europe", value: 25 },
                            { region: "Asia", value: 15 },
                            { region: "Other", value: 5 },
                          ]}
                          category="value"
                          index="region"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tracks">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Your Music</h3>
                <Button asChild>
                  <Link to="/upload">Upload New Track</Link>
                </Button>
              </div>
              
              <div className="bg-card border border-border rounded-lg">
                <div className="p-4 border-b border-border">
                  <div className="grid grid-cols-12 text-sm text-muted-foreground">
                    <div className="col-span-6 font-medium">Track</div>
                    <div className="col-span-2 font-medium text-center">Plays</div>
                    <div className="col-span-2 font-medium text-center">Likes</div>
                    <div className="col-span-2 font-medium text-center">Date</div>
                  </div>
                </div>
                
                <div className="divide-y divide-border">
                  {[1, 2, 3, 4, 5].map((track) => (
                    <div key={track} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="grid grid-cols-12 items-center">
                        <div className="col-span-6 flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-primary/20"></div>
                          <div>
                            <h4 className="font-medium">Track Title {track}</h4>
                            <p className="text-xs text-muted-foreground">3:45</p>
                          </div>
                        </div>
                        <div className="col-span-2 text-center">
                          {Math.floor(Math.random() * 1000) + 100}
                        </div>
                        <div className="col-span-2 text-center">
                          {Math.floor(Math.random() * 100) + 10}
                        </div>
                        <div className="col-span-2 text-center text-sm text-muted-foreground">
                          {new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
                            .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="audience">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Audience Growth</CardTitle>
                  <CardDescription>Track your follower growth over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <LineChart 
                      data={[
                        { date: "Jan", followers: 120 },
                        { date: "Feb", followers: 240 },
                        { date: "Mar", followers: 330 },
                        { date: "Apr", followers: 520 },
                        { date: "May", followers: 750 },
                        { date: "Jun", followers: 920 },
                        { date: "Jul", followers: 1050 },
                        { date: "Aug", followers: 1254 },
                      ]}
                      categories={["followers"]}
                      index="date"
                      colors={["primary"]}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Listener Behavior</CardTitle>
                    <CardDescription>Understand how people interact with your music</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Average Listen Time</h4>
                        <div className="h-2 bg-muted rounded-full">
                          <div className="h-2 bg-primary rounded-full w-[75%]"></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>0%</span>
                          <span className="font-medium">75% of track length</span>
                          <span>100%</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Save Rate</h4>
                        <div className="h-2 bg-muted rounded-full">
                          <div className="h-2 bg-primary rounded-full w-[23%]"></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>0%</span>
                          <span className="font-medium">23% save music</span>
                          <span>100%</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Playlist Addition Rate</h4>
                        <div className="h-2 bg-muted rounded-full">
                          <div className="h-2 bg-primary rounded-full w-[18%]"></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>0%</span>
                          <span className="font-medium">18% add to playlists</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Listening Sources</CardTitle>
                    <CardDescription>Where your audience is discovering your music</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <PieChart 
                        data={[
                          { source: "Direct Profile", value: 35 },
                          { source: "Search", value: 25 },
                          { source: "Playlists", value: 20 },
                          { source: "External Links", value: 15 },
                          { source: "Other", value: 5 },
                        ]}
                        category="value"
                        index="source"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-primary" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="p-3 bg-muted/50 rounded-md flex">
                  <div className="mr-4 mt-1 h-8 w-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">Growing audience in Europe</h4>
                    <p className="text-sm text-muted-foreground">
                      Your European audience has grown by 34% in the last month.
                      Consider promoting more in this region.
                    </p>
                  </div>
                </li>
                <li className="p-3 bg-muted/50 rounded-md flex">
                  <div className="mr-4 mt-1 h-8 w-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">New listener demographic</h4>
                    <p className="text-sm text-muted-foreground">
                      You're gaining traction with listeners aged 35-44.
                      This is a new audience segment for your music.
                    </p>
                  </div>
                </li>
                <li className="p-3 bg-muted/50 rounded-md flex">
                  <div className="mr-4 mt-1 h-8 w-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
                    <BookMarked className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">Playlist opportunity</h4>
                    <p className="text-sm text-muted-foreground">
                      Your track "Summer Vibes" is being added to playlists at a high rate.
                      Consider promoting this track further.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Promotion Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors">
                  <h4 className="font-medium">Boost Your Latest Release</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Promote your newest track to reach more listeners and increase engagement.
                  </p>
                  <Button size="sm" className="w-full">Boost Track</Button>
                </div>
                
                <div className="p-4 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors">
                  <h4 className="font-medium">Submit to Editorial Playlists</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get your music in front of our editorial team for playlist consideration.
                  </p>
                  <Button size="sm" variant="outline" className="w-full">Submit Music</Button>
                </div>
                
                <Link to="/promote" className="block mt-4 text-sm text-center text-primary underline">
                  View all promotion options
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
