
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle,
  Loader2, 
  MoreVertical, 
  Search, 
  XCircle,
  ClipboardList,
  Trash2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getMockFormattedReports, checkTableExists } from "./helpers/mockData";

interface Report {
  id: string;
  type: string;
  entity_type: string;
  entity_details: string;
  reason: string;
  profiles: { username: string };
  created_at: string;
  status: "open" | "investigating" | "resolved";
  entity_id: string;
  user_id: string;
}

export function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [tableExists, setTableExists] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        // Check if the reports table exists
        const exists = await checkTableExists('reports', supabase);
        setTableExists(exists);
        
        if (exists) {
          // Fetch from real database
          const { data, error } = await supabase
            .from('reports')
            .select(`
              id,
              type,
              entity_type,
              entity_details,
              reason,
              profiles:user_id (username),
              created_at,
              status,
              entity_id,
              user_id
            `)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          setReports(data as Report[]);
        } else {
          // Use mock data
          setReports(getMockFormattedReports());
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Error loading reports",
          description: "Could not load reports data. Using mock data instead.",
          variant: "destructive",
        });
        // Fallback to mock data on error
        setReports(getMockFormattedReports());
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
    
    // Set up real-time listener only if the table exists
    if (tableExists) {
      const channel = supabase
        .channel('admin-reports-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reports'
          },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'INSERT') {
              // Fetch the full report with joins
              fetchReport(newRecord.id).then(report => {
                if (report) {
                  setReports(prevReports => [report, ...prevReports]);
                }
              });
            } else if (eventType === 'UPDATE') {
              // Fetch the updated report with joins
              fetchReport(newRecord.id).then(report => {
                if (report) {
                  setReports(prevReports => prevReports.map(r => 
                    r.id === report.id ? report : r
                  ));
                }
              });
            } else if (eventType === 'DELETE') {
              setReports(prevReports => prevReports.filter(r => r.id !== oldRecord.id));
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [toast, tableExists]);
  
  // Helper function to fetch a single report with its relationships
  const fetchReport = async (reportId: string) => {
    if (!tableExists) return null;
    
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          type,
          entity_type,
          entity_details,
          reason,
          profiles:user_id (username),
          created_at,
          status,
          entity_id,
          user_id
        `)
        .eq('id', reportId)
        .single();
        
      if (error) throw error;
      return data as Report;
    } catch (error) {
      console.error('Error fetching report:', error);
      return null;
    }
  };

  const filteredReports = reports.filter(report => 
    report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.entity_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.profiles.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateStatus = async (reportId: string, status: "open" | "investigating" | "resolved") => {
    try {
      if (tableExists) {
        // Update in database
        const { error } = await supabase
          .from('reports')
          .update({ status })
          .eq('id', reportId);
          
        if (error) throw error;
      }
      
      // Always update local state
      setReports(reports.map(report => 
        report.id === reportId ? { ...report, status } : report
      ));
      
      toast({
        title: "Report status updated",
        description: `Report has been marked as ${status}.`,
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "Error updating report",
        description: "Could not update the report status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      if (tableExists) {
        // Delete from database
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('id', reportId);
          
        if (error) throw error;
      }
      
      // Always update local state
      setReports(reports.filter(report => report.id !== reportId));
      
      toast({
        title: "Report deleted",
        description: "The report has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Error deleting report",
        description: "Could not delete the report.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Reports</h2>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableCaption>Manage user-submitted reports.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Reported By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">
                No reports found
              </TableCell>
            </TableRow>
          ) : (
            filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <Badge variant="outline">{report.type}</Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{report.entity_type}</span>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">{report.entity_details}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="truncate max-w-xs">{report.reason}</div>
                </TableCell>
                <TableCell>{report.profiles.username}</TableCell>
                <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      report.status === "open" 
                        ? "destructive" 
                        : report.status === "investigating" 
                          ? "secondary" 
                          : "outline"
                    }
                    className={
                      report.status === "resolved" 
                        ? "bg-green-100 text-green-800 hover:bg-green-200" 
                        : ""
                    }
                  >
                    {report.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(report.id, "open")}
                        disabled={report.status === "open"}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Mark as Open
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(report.id, "investigating")}
                        disabled={report.status === "investigating"}
                      >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Mark as Investigating
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(report.id, "resolved")}
                        disabled={report.status === "resolved"}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Resolved
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!tableExists && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
          <p className="font-medium">Using mock report data</p>
          <p className="mt-1">The reports table doesn't exist in your database yet. The data shown is mock data for demonstration purposes.</p>
        </div>
      )}
    </div>
  );
}
