
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileBarChart, TrendingUp, Users, BookMarked } from "lucide-react";

export const InsightsSection = () => {
  return (
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
  );
};
