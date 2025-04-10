
import { Card, CardContent } from "@/components/ui/card";
import { Play, TrendingUp, Users, Music, Share } from "lucide-react";

export const QuickStats = () => {
  return (
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
  );
};
