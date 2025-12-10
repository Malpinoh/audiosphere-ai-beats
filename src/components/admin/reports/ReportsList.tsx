import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ReportItem } from "./ReportItem";
import { Report } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface ReportsListProps {
  reports: Report[];
  onUpdateStatus: (reportId: string, status: "pending" | "resolved") => void;
  onDeleteReport: (reportId: string) => void;
}

export function ReportsList({ 
  reports, 
  onUpdateStatus, 
  onDeleteReport 
}: ReportsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  
  const filteredReports = reports.filter(report => 
    report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.comment_content?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (report.comment_track_title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (report.reporter_username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    report.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative w-full md:w-72 ml-auto">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableCaption>Manage user-submitted reports.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Reason</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Reported By</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 5 : 7} className="text-center py-6">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <ReportItem
                  key={report.id}
                  report={report}
                  onUpdateStatus={onUpdateStatus}
                  onDeleteReport={onDeleteReport}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
