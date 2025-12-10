import { Loader2 } from "lucide-react";
import { ReportsList } from "./reports/ReportsList";
import { useReports } from "./reports/useReports";

export function ReportsManagement() {
  const { 
    reports, 
    loading, 
    handleUpdateStatus, 
    handleDeleteReport
  } = useReports();

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
      <div>
        <h2 className="text-2xl font-bold">Manage Reports</h2>
        <p className="text-muted-foreground">Handle user-submitted reports</p>
      </div>

      <ReportsList
        reports={reports}
        onUpdateStatus={handleUpdateStatus}
        onDeleteReport={handleDeleteReport}
      />

      {reports.length === 0 && (
        <div className="p-4 bg-muted/50 border border-border rounded-md text-muted-foreground text-sm">
          <p className="font-medium">No reports yet</p>
          <p className="mt-1">Reports will appear here when users report comments.</p>
        </div>
      )}
    </div>
  );
}
