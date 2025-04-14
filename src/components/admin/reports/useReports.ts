
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Report } from "./types";
import { getMockReports } from "../helpers/mockData";

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      // Use mock data by default - the reports table doesn't exist in the supabase schema
      setTableExists(false);
      const mockReports = getMockReports();
      setReports(mockReports as Report[]);
      
      // If in the future the reports table is created, this code will be ready to use it
      // For now, we won't attempt to check for or query a non-existent table
      // which would cause TypeScript errors
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
      
      // Fallback to mock data on error
      const mockReports = getMockReports();
      setReports(mockReports as Report[]);
      setTableExists(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, status: "open" | "investigating" | "resolved") => {
    try {
      // Update local state for mock data
      setReports(prev => 
        prev.map(report => 
          report.id === id ? { ...report, status } : report
        )
      );
      toast.success(`Report status updated to ${status}`);
      
      // In the future, if the table exists, we would add code here to update the database
    } catch (error) {
      console.error("Error updating report status:", error);
      toast.error("Failed to update report status");
    }
  }, []);

  const handleDeleteReport = useCallback(async (id: string) => {
    try {
      // Update local state for mock data
      setReports(prev => prev.filter(report => report.id !== id));
      toast.success("Report deleted");
      
      // In the future, if the table exists, we would add code here to update the database
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    }
  }, []);

  useEffect(() => {
    fetchReports();
    
    // No need for a subscription since we're using mock data
    // In the future, if the table exists, we would set up a subscription here
  }, [fetchReports]);

  return {
    reports,
    loading,
    tableExists,
    handleUpdateStatus,
    handleDeleteReport
  };
}
