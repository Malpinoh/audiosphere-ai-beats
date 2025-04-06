
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Music, User, Upload, MessageSquare, Flag } from "lucide-react";

// Mock data for analytics
const dailyUsage = [
  { name: "Mon", users: 4000, songs: 2400, uploads: 400 },
  { name: "Tue", users: 3000, songs: 1398, uploads: 210 },
  { name: "Wed", users: 2000, songs: 9800, uploads: 290 },
  { name: "Thu", users: 2780, songs: 3908, uploads: 350 },
  { name: "Fri", users: 1890, songs: 4800, uploads: 480 },
  { name: "Sat", users: 2390, songs: 3800, uploads: 580 },
  { name: "Sun", users: 3490, songs: 4300, uploads: 320 }
];

const monthlyGrowth = [
  { name: "Jan", users: 4000, songs: 2400 },
  { name: "Feb", users: 4200, songs: 2800 },
  { name: "Mar", users: 5800, songs: 3200 },
  { name: "Apr", users: 8000, songs: 4000 },
  { name: "May", users: 10000, songs: 4800 },
  { name: "Jun", users: 12000, songs: 5600 }
];

const genreDistribution = [
  { name: "Pop", value: 30 },
  { name: "Hip Hop", value: 25 },
  { name: "Electronic", value: 15 },
  { name: "Rock", value: 12 },
  { name: "Jazz", value: 8 },
  { name: "Others", value: 10 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#EC7063'];

// Cards for high-level metrics
const statCards = [
  { 
    title: "Total Users", 
    value: "45,289", 
    change: "+12.5%", 
    timeframe: "from last month", 
    icon: <User className="h-4 w-4 text-blue-500" />
  },
  { 
    title: "Active Songs", 
    value: "87,432", 
    change: "+5.8%", 
    timeframe: "from last month", 
    icon: <Music className="h-4 w-4 text-purple-500" />
  },
  { 
    title: "New Uploads", 
    value: "1,456", 
    change: "+8.3%", 
    timeframe: "from last month", 
    icon: <Upload className="h-4 w-4 text-green-500" />
  },
  { 
    title: "Comments", 
    value: "32,785", 
    change: "+15.2%", 
    timeframe: "from last month", 
    icon: <MessageSquare className="h-4 w-4 text-amber-500" />
  },
  { 
    title: "Reported Content", 
    value: "237", 
    change: "-3.1%", 
    timeframe: "from last month", 
    icon: <Flag className="h-4 w-4 text-red-500" />
  }
];

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
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Platform Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, index) => (
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
                    data={dailyUsage}
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
                    data={monthlyGrowth}
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
                        data={genreDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {genreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 grid grid-cols-2 gap-2 mt-4 md:mt-0">
                  {genreDistribution.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center">
                      <div 
                        className="w-3 h-3 mr-2 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">
                        {entry.name}: {entry.value}%
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
