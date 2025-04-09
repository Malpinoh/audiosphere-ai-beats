
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Music, User, Upload, MessageSquare, Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#EC7063'];

interface StatCard {
  title: string;
  value: string;
  change: string;
  timeframe: string;
  icon: React.ReactNode;
}

interface AnalyticsData {
  dailyUsage: any[];
  monthlyGrowth: any[];
  genreDistribution: any[];
  statCards: StatCard[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-2 border rounded-md shadow-sm">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Fetch total user count
        const { count: userCount, error: userError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        if (userError) throw userError;
        
        // Fetch total track count
        const { count: trackCount, error: trackError } = await supabase
          .from('tracks')
          .select('*', { count: 'exact', head: true });
          
        if (trackError) throw trackError;
        
        // Fetch uploads in the last month
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const { count: uploadCount, error: uploadError } = await supabase
          .from('tracks')
          .select('*', { count: 'exact', head: true })
          .gte('uploaded_at', lastMonth.toISOString());
          
        if (uploadError) throw uploadError;
        
        // Fetch genre distribution
        const { data: genreData, error: genreError } = await supabase
          .from('tracks')
          .select('genre');
          
        if (genreError) throw genreError;
        
        // Process genre distribution
        const genreCounts: Record<string, number> = {};
        genreData.forEach(item => {
          genreCounts[item.genre] = (genreCounts[item.genre] || 0) + 1;
        });
        
        const genreDistribution = Object.entries(genreCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
        
        // Get top genres and combine the rest
        const topGenres = genreDistribution.slice(0, 5);
        const otherGenres = genreDistribution.slice(5);
        
        let finalGenreDistribution = [...topGenres];
        if (otherGenres.length > 0) {
          const otherTotal = otherGenres.reduce((sum, item) => sum + item.value, 0);
          finalGenreDistribution.push({ name: 'Others', value: otherTotal });
        }
        
        // Mock data for daily usage and monthly growth for now
        // In a real scenario, this would be calculated from stream_logs and other activity data
        const dailyUsage = [
          { name: "Mon", users: 400, songs: 240, uploads: 40 },
          { name: "Tue", users: 300, songs: 139, uploads: 21 },
          { name: "Wed", users: 200, songs: 980, uploads: 29 },
          { name: "Thu", users: 278, songs: 390, uploads: 35 },
          { name: "Fri", users: 189, songs: 480, uploads: 48 },
          { name: "Sat", users: 239, songs: 380, uploads: 58 },
          { name: "Sun", users: 349, songs: 430, uploads: 32 }
        ];

        const monthlyGrowth = [
          { name: "Jan", users: 400, songs: 240 },
          { name: "Feb", users: 420, songs: 280 },
          { name: "Mar", users: 580, songs: 320 },
          { name: "Apr", users: 800, songs: 400 },
          { name: "May", users: 1000, songs: 480 },
          { name: "Jun", users: 1200, songs: 560 }
        ];
        
        // Create stat cards with real data where possible
        const statCards: StatCard[] = [
          { 
            title: "Total Users", 
            value: userCount?.toLocaleString() || "0", 
            change: "+12.5%", 
            timeframe: "from last month", 
            icon: <User className="h-4 w-4 text-blue-500" />
          },
          { 
            title: "Active Songs", 
            value: trackCount?.toLocaleString() || "0", 
            change: "+5.8%", 
            timeframe: "from last month", 
            icon: <Music className="h-4 w-4 text-purple-500" />
          },
          { 
            title: "New Uploads", 
            value: uploadCount?.toLocaleString() || "0", 
            change: "+8.3%", 
            timeframe: "from last month", 
            icon: <Upload className="h-4 w-4 text-green-500" />
          },
          { 
            title: "Comments", 
            value: "0", 
            change: "+0.0%", 
            timeframe: "from last month", 
            icon: <MessageSquare className="h-4 w-4 text-amber-500" />
          },
          { 
            title: "Reported Content", 
            value: "0", 
            change: "-0.0%", 
            timeframe: "from last month", 
            icon: <Flag className="h-4 w-4 text-red-500" />
          }
        ];
        
        setAnalyticsData({
          dailyUsage,
          monthlyGrowth,
          genreDistribution: finalGenreDistribution,
          statCards
        });
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
    
    // Set up realtime subscription to update stats
    const channel = supabase
      .channel('admin-analytics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracks'
        },
        () => {
          // Refresh data when tracks change
          fetchAnalyticsData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          // Refresh data when profiles change
          fetchAnalyticsData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Platform Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {analyticsData?.statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={card.change.startsWith("+") ? "text-green-500" : "text-red-500"}>
                  {card.change}
                </span>
                {" "}{card.timeframe}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8 w-[400px]">
          <TabsTrigger value="usage">Daily Usage</TabsTrigger>
          <TabsTrigger value="growth">Monthly Growth</TabsTrigger>
          <TabsTrigger value="genres">Genre Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Platform Activity</CardTitle>
              <CardDescription>
                User activity, song plays, and uploads over the past week
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData?.dailyUsage}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="users" fill="#3b82f6" name="Active Users" />
                    <Bar dataKey="songs" fill="#a855f7" name="Song Plays" />
                    <Bar dataKey="uploads" fill="#10b981" name="New Uploads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="growth" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Growth Trends</CardTitle>
              <CardDescription>
                User and content growth over the past 6 months
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analyticsData?.monthlyGrowth}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#3b82f6" 
                      name="Users" 
                      strokeWidth={2} 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="songs" 
                      stroke="#a855f7" 
                      name="Songs" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="genres" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Music Genre Distribution</CardTitle>
              <CardDescription>
                Breakdown of music by genre across the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[400px] flex flex-col md:flex-row items-center justify-center">
                <div className="w-full md:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData?.genreDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData?.genreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 grid grid-cols-2 gap-2 mt-4 md:mt-0">
                  {analyticsData?.genreDistribution.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center">
                      <div 
                        className="w-3 h-3 mr-2 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
