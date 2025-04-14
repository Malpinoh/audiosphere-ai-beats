
import { 
  MoreVertical, 
  CheckCircle, 
  ClipboardList, 
  XCircle, 
  Trash2 
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Report } from "./types";

interface ReportItemProps {
  report: Report;
  onUpdateStatus: (reportId: string, status: "open" | "investigating" | "resolved") => void;
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
      <TableCell className="hidden md:table-cell">{report.profiles.username}</TableCell>
      <TableCell className="hidden md:table-cell">{new Date(report.created_at).toLocaleDateString()}</TableCell>
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
              onClick={() => onUpdateStatus(report.id, "open")}
              disabled={report.status === "open"}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Mark as Open
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUpdateStatus(report.id, "investigating")}
              disabled={report.status === "investigating"}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Mark as Investigating
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUpdateStatus(report.id, "resolved")}
              disabled={report.status === "resolved"}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Resolved
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => onDeleteReport(report.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
