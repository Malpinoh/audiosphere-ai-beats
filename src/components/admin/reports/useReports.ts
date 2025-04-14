
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
      // Check if the reports table exists in the database
      const { error: checkError } = await supabase
        .from('reports')
        .select('id')
        .limit(1)
        .single();

      // If there's an error (table doesn't exist), use mock data
      if (checkError) {
        if (checkError.code === "42P01") { // PostgreSQL code for "relation does not exist"
          setTableExists(false);
          // Use mock data
          const mockReports = getMockReports();
          setReports(mockReports as Report[]);
        } else {
          console.error("Error checking reports table:", checkError);
          toast.error("Failed to load reports");
        }
      } else {
        setTableExists(true);
        // Table exists, fetch real data
        const { data, error } = await supabase
          .from('reports')
          .select(`
            id, type, entity_type, entity_details, reason, created_at, status, entity_id, user_id,
            profiles:user_id (username)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Ensure the fetched data matches our Report type
        const typedReports = data.map(report => ({
          ...report,
          status: report.status as "open" | "investigating" | "resolved",
          profiles: report.profiles || { username: "Unknown" }
        }));

        setReports(typedReports);
      }
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
      if (!tableExists) {
        // Update local state only for mock data
        setReports(prev => 
          prev.map(report => 
            report.id === id ? { ...report, status } : report
          )
        );
        toast.success(`Report status updated to ${status}`);
        return;
      }

      // Update in database for real data
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setReports(prev => 
        prev.map(report => 
          report.id === id ? { ...report, status } : report
        )
      );
      
      toast.success(`Report status updated to ${status}`);
    } catch (error) {
      console.error("Error updating report status:", error);
      toast.error("Failed to update report status");
    }
  }, [tableExists]);

  const handleDeleteReport = useCallback(async (id: string) => {
    try {
      if (!tableExists) {
        // Update local state only for mock data
        setReports(prev => prev.filter(report => report.id !== id));
        toast.success("Report deleted");
        return;
      }

      // Delete from database for real data
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReports(prev => prev.filter(report => report.id !== id));
      toast.success("Report deleted");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    }
  }, [tableExists]);

  useEffect(() => {
    fetchReports();

    // Set up a subscription for real-time updates if the table exists
    let subscription: any;
    
    if (tableExists) {
      subscription = supabase
        .channel('reports-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'reports' 
        }, fetchReports)
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [fetchReports, tableExists]);

  return {
    reports,
    loading,
    tableExists,
    handleUpdateStatus,
    handleDeleteReport
  };
}
