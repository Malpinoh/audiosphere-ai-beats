
import { Link } from "react-router-dom";
import { Music, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";

const NotFound = () => {
  return (
    <MainLayout hidePlayer={true}>
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-muted flex items-center justify-center animate-pulse-light">
          <Music className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-md">
          Oops! The beat dropped out. The page you're looking for doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="maudio-gradient-bg">
            <Link to="/" className="gap-2">
              <Home className="h-5 w-5" />
              Return Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/browse" className="gap-2">
              Browse Music
            </Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
