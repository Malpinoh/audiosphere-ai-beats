import { 
  MoreVertical, 
  CheckCircle, 
  AlertCircle
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Report } from "./types";

interface ReportItemProps {
  report: Report;
  onUpdateStatus: (reportId: string, status: "pending" | "resolved") => void;
  onDeleteReport: (reportId: string) => void;
}

export function ReportItem({ 
  report, 
  onUpdateStatus, 
  onDeleteReport 
}: ReportItemProps) {
  return (
    <TableRow key={report.id}>
      <TableCell>
        <Badge variant="outline">{report.reason}</Badge>
      </TableCell>
      <TableCell>
        <div>
          <span className="font-medium">Comment on: {report.comment_track_title}</span>
          <p className="text-sm text-muted-foreground truncate max-w-xs">{report.comment_content}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="truncate max-w-xs">{report.description || 'No additional details'}</div>
      </TableCell>
      <TableCell className="hidden md:table-cell">{report.reporter_username}</TableCell>
      <TableCell className="hidden md:table-cell">{new Date(report.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <Badge 
          variant={report.status === "pending" ? "destructive" : "outline"}
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
              onClick={() => onUpdateStatus(report.id, "pending")}
              disabled={report.status === "pending"}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Mark as Pending
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUpdateStatus(report.id, "resolved")}
              disabled={report.status === "resolved"}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Resolved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
