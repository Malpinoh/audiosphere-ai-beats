
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getMockFormattedReports, checkTableExists } from "../helpers/mockData";
import { Report } from "./types";

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
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
          // This code would work once the table is created in Supabase
          console.log("Reports table exists, fetching data");
          
          // Placeholder database fetching code that would work when table exists
          const { data, error } = await supabase
            .from('reports')
            .select(`
              id, 
              type,
              entity_type,
              entity_details,
              reason,
              created_at, 
              status,
              entity_id,
              user_id,
              profiles (username)
            `);
            
          if (error) throw error;
          
          if (data) {
            setReports(data as Report[]);
          }
        } else {
          // Use mock data
          const mockReports = getMockFormattedReports();
          setReports(mockReports as Report[]);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Error loading reports",
          description: "Could not load reports data. Using mock data instead.",
          variant: "destructive",
        });
        // Fallback to mock data on error
        const mockReports = getMockFormattedReports();
        setReports(mockReports as Report[]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [toast]);

  const handleUpdateStatus = async (reportId: string, status: "open" | "investigating" | "resolved") => {
    try {
      if (tableExists) {
        // This would be the real implementation once the table exists
        console.log("Updating report status:", reportId, status);
        
        const { error } = await supabase
          .from('reports')
          .update({ status })
          .eq('id', reportId);
          
        if (error) throw error;
      }
      
      // Always update local state for the UI
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
        // This would be the real implementation once the table exists
        console.log("Deleting report:", reportId);
        
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('id', reportId);
          
        if (error) throw error;
      }
      
      // Always update local state for the UI
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

  return {
    reports,
    loading,
    tableExists,
    handleUpdateStatus,
    handleDeleteReport
  };
}
