
import MainLayout from "@/components/layout/MainLayout";
import ReportForm from "@/components/report/ReportForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const ReportPage = () => {
  const { user } = useAuth();
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Report Content</h1>
        
        {!user ? (
          <Alert variant="destructive" className="max-w-lg mx-auto mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription className="flex flex-col gap-4">
              <p>You need to be logged in to submit a report.</p>
              <div className="flex gap-4">
                <Button variant="outline" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <ReportForm />
        )}
      </div>
    </MainLayout>
  );
};

export default ReportPage;
