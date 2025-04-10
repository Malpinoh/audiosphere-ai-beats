
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const TracksTab = () => {
  return (
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
  );
};
