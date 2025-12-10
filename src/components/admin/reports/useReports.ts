import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Report } from "./types";

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch reports with related comment and reporter data
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          comments!reports_comment_id_fkey (
            content,
            tracks!comments_track_id_fkey (
              title
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to load reports");
        return;
      }

      // Get reporter usernames separately
      const reporterIds = [...new Set((data || []).map(r => r.reporter_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', reporterIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

      // Transform the data to match our Report interface
      const transformedReports: Report[] = (data || []).map(report => ({
        id: report.id,
        reporter_id: report.reporter_id,
        comment_id: report.comment_id,
        reason: report.reason,
        description: report.description,
        status: report.status as "pending" | "resolved",
        created_at: report.created_at,
        resolved_at: report.resolved_at,
        resolved_by: report.resolved_by,
        reporter_username: profileMap.get(report.reporter_id) || 'Unknown',
        comment_content: report.comments?.content || 'Comment not found',
        comment_track_title: report.comments?.tracks?.title || 'Unknown track'
      }));

      setReports(transformedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, status: "pending" | "resolved") => {
    try {
      const updateData: { status: string; resolved_at?: string; resolved_by?: string } = { 
        status 
      };

      if (status === 'resolved') {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user?.id || null;
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error("Error updating report status:", error);
        toast.error("Failed to update report status");
        return;
      }

      // Update local state
      setReports(prev => 
        prev.map(report => 
          report.id === id ? { ...report, status, resolved_at: updateData.resolved_at || null } : report
        )
      );
      toast.success(`Report marked as ${status}`);
    } catch (error) {
      console.error("Error updating report status:", error);
      toast.error("Failed to update report status");
    }
  }, []);

  const handleDeleteReport = useCallback(async (id: string) => {
    // Note: The reports table doesn't allow DELETE by RLS policy
    // Instead, we mark it as resolved
    toast.error("Reports cannot be deleted. Mark as resolved instead.");
  }, []);

  useEffect(() => {
    fetchReports();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('reports-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reports' }, 
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchReports]);

  return {
    reports,
    loading,
    handleUpdateStatus,
    handleDeleteReport
  };
}
