
import { Loader2 } from "lucide-react";
import { ReportsList } from "./reports/ReportsList";
import { useReports } from "./reports/useReports";

export function ReportsManagement() {
  const { 
    reports, 
    loading, 
    tableExists,
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

      {!tableExists && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
          <p className="font-medium">Using mock report data</p>
          <p className="mt-1">The reports table doesn't exist in your database yet. The data shown is mock data for demonstration purposes.</p>
        </div>
      )}
    </div>
  );
}
