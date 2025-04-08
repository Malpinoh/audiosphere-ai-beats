
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ReportForm = () => {
  const [type, setType] = useState("Content");
  const [entityType, setEntityType] = useState("Song");
  const [entity, setEntity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entity || !reason) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, this would insert into a Supabase table
      // For now, we'll simulate success and display a success message
      
      toast({
        title: "Report submitted",
        description: "Thank you for your report. Our team will review it shortly.",
      });
      
      // Clear form
      setEntity("");
      setReason("");
      
      // Optional: redirect user back to home page
      // navigate("/");
    } catch (error: any) {
      toast({
        title: "Error submitting report",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Submit a Report
        </CardTitle>
        <CardDescription>
          Report content or users that violate our community guidelines.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Report Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Content">Content</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Comment">Comment</SelectItem>
                <SelectItem value="Playlist">Playlist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="entityType">What are you reporting?</Label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger id="entityType">
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Song">Song</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Comment">Comment</SelectItem>
                <SelectItem value="Playlist">Playlist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="entity">Name/Title {entityType === 'User' ? '(Username)' : ''}</Label>
            <Input 
              id="entity" 
              value={entity} 
              onChange={(e) => setEntity(e.target.value)}
              placeholder={`Enter ${entityType.toLowerCase()} name/title`}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Report</Label>
            <Textarea 
              id="reason" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe the issue in detail"
              rows={4}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ReportForm;
