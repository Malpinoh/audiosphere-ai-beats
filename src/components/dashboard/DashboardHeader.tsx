
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Megaphone } from "lucide-react";

export const DashboardHeader = () => {
  return (
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
  );
};
