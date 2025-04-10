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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  CheckCircle, 
  ExternalLink, 
  Search, 
  ShieldCheck,
  Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Report {
  id: string;
  type: string;
  entityType: string;
  entity: string;
  reason: string;
  reportedBy: string;
  timestamp: string;
  status: string;
  entity_id?: string;
  user_id?: string;
}

export function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('reports')
          .select(`
            id,
            type,
            entity_type,
            entity_id,
            reason,
            user_id,
            created_at,
            status,
            profiles(username),
            entity_details
          `)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching reports:", error);
          setReports([
            { 
              id: "1", 
              type: "Content",
              entityType: "Song",
              entity: "Digital Revolution - Cyber Pulse",
              reason: "Copyright infringement",
              reportedBy: "johndoe",
              timestamp: "2023-04-05T14:25:00",
              status: "open"
            },
            { 
              id: "2", 
              type: "User",
              entityType: "User",
              entity: "MusicSpammer123",
              reason: "Spam accounts and comments",
              reportedBy: "sarahjones",
              timestamp: "2023-04-04T11:10:00",
              status: "open"
            },
            { 
              id: "3", 
              type: "Comment",
              entityType: "Comment",
              entity: "Comment on 'Summer Vibes'",
              reason: "Offensive language",
              reportedBy: "robertwilson",
              timestamp: "2023-04-03T16:45:00",
              status: "resolved"
            },
            { 
              id: "4", 
              type: "Playlist",
              entityType: "Playlist",
              entity: "Controversial Mix",
              reason: "Inappropriate content",
              reportedBy: "mikebrown",
              timestamp: "2023-04-02T09:30:00",
              status: "investigating"
            },
            { 
              id: "5", 
              type: "Content",
              entityType: "Song",
              entity: "Urban Stories - City Sounds",
              reason: "Explicit content not labeled",
              reportedBy: "janesmith",
              timestamp: "2023-04-01T19:15:00",
              status: "resolved"
            }
          ]);
        } else if (data) {
          const formattedReports = data.map(report => ({
            id: report.id,
            type: report.type,
            entityType: report.entity_type,
            entity: report.entity_details || 'Unknown entity',
            reason: report.reason,
            reportedBy: report.profiles?.username || 'Unknown',
            timestamp: report.created_at,
            status: report.status || 'open',
            entity_id: report.entity_id,
            user_id: report.user_id
          }));
          
          setReports(formattedReports);
        }
      } catch (error) {
        console.error('Error in report fetching:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
    
    const channel = supabase
      .channel('admin-reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        async (payload) => {
          try {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              const { data, error } = await supabase
                .from('reports')
                .select(`
                  id,
                  type,
                  entity_type,
                  entity_id,
                  reason,
                  user_id,
                  created_at,
                  status,
                  profiles(username),
                  entity_details
                `)
                .eq('id', newRecord.id)
                .single();
              
              if (error) throw error;
              
              const formattedReport = {
                id: data.id,
                type: data.type,
                entityType: data.entity_type,
                entity: data.entity_details || 'Unknown entity',
                reason: data.reason,
                reportedBy: data.profiles?.username || 'Unknown',
                timestamp: data.created_at,
                status: data.status || 'open',
                entity_id: data.entity_id,
                user_id: data.user_id
              };
              
              if (eventType === 'INSERT') {
                setReports(prevReports => [formattedReport, ...prevReports]);
              } else if (eventType === 'UPDATE') {
                setReports(prevReports => prevReports.map(report => 
                  report.id === formattedReport.id ? formattedReport : report
                ));
              }
            } else if (eventType === 'DELETE') {
              setReports(prevReports => prevReports.filter(report => 
                report.id !== oldRecord.id
              ));
            }
          } catch (error) {
            console.error('Error processing report update:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredReports = reports.filter(report => 
    report.entity.toLowerCase().includes(searchTerm.toLowerCase()) || 
    report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDetailsDialog = (reportId: string) => {
    setSelectedReport(reportId);
    setActionNotes("");
    setDialogOpen(true);
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      if (await checkReportsTableExists()) {
        const { error } = await supabase
          .from('reports')
          .update({ 
            status: newStatus,
            action_notes: actionNotes || undefined
          })
          .eq('id', reportId);
          
        if (error) throw error;
      } else {
        setReports(reports.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus } 
            : report
        ));
      }
      
      toast({
        title: "Report status updated",
        description: `The report status has been changed to ${newStatus}.`,
      });
      
      if (dialogOpen) {
        setDialogOpen(false);
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "Error updating report",
        description: "Failed to update the report status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "open":
        return "destructive";
      case "investigating":
        return "secondary";
      case "resolved":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "resolved") {
      return "bg-green-100 text-green-800 hover:bg-green-200";
    } else if (status === "investigating") {
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    }
    return "";
  };

  const selectedReportData = selectedReport 
    ? reports.find(report => report.id === selectedReport) 
    : null;

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
        <TableCaption>Manage user reports and complaints.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Reported By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Badge variant="outline">
                  {report.type}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{report.entity}</TableCell>
              <TableCell>{report.reason}</TableCell>
              <TableCell>{report.reportedBy}</TableCell>
              <TableCell>{new Date(report.timestamp).toLocaleString()}</TableCell>
              <TableCell>
                <Badge 
                  variant={getStatusBadgeVariant(report.status)}
                  className={getStatusBadgeClass(report.status)}
                >
                  {report.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetailsDialog(report.id)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  {report.status !== "resolved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(report.id, "resolved")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Report Details
            </DialogTitle>
            <DialogDescription>
              Review and take action on this reported content.
            </DialogDescription>
          </DialogHeader>
          {selectedReportData && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Report Type</h4>
                  <p>{selectedReportData.type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <Badge 
                    variant={getStatusBadgeVariant(selectedReportData.status)}
                    className={getStatusBadgeClass(selectedReportData.status)}
                  >
                    {selectedReportData.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Entity</h4>
                  <p>{selectedReportData.entity}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Reason</h4>
                  <p>{selectedReportData.reason}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Reported By</h4>
                  <p>{selectedReportData.reportedBy}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                  <p>{new Date(selectedReportData.timestamp).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Action Notes</h4>
                  <Input
                    placeholder="Add notes about actions taken..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {selectedReportData?.status !== "investigating" && (
              <Button 
                variant="outline" 
                onClick={() => handleUpdateStatus(selectedReport!, "investigating")}
                className="w-full sm:w-auto"
              >
                Mark as Investigating
              </Button>
            )}
            {selectedReportData?.status !== "resolved" && (
              <Button 
                variant="outline"
                onClick={() => handleUpdateStatus(selectedReport!, "resolved")}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                <ShieldCheck className="h-4 w-4 mr-1" />
                Resolve Report
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
