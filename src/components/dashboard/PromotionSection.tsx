
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

export const PromotionSection = () => {
  return (
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
  );
};
