import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlaybackError } from "@/contexts/music-player/types";
import { Copy, Bug } from "lucide-react";
import { toast } from "sonner";

interface PlaybackDiagnosticsProps {
  error: PlaybackError;
  trigger?: React.ReactNode;
}

export const PlaybackDiagnostics = ({ error, trigger }: PlaybackDiagnosticsProps) => {
  const diagnosticInfo = {
    errorType: error.type,
    errorMessage: error.message,
    errorCode: error.errorCode || 'N/A',
    audioUrl: error.audioUrl || 'N/A',
    online: navigator.onLine ? 'Yes' : 'No',
    connectionType: (navigator as any).connection?.effectiveType || 'Unknown',
    downlink: (navigator as any).connection?.downlink ? `${(navigator as any).connection.downlink} Mbps` : 'Unknown',
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };

  const copyToClipboard = () => {
    const text = Object.entries(diagnosticInfo)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Diagnostics copied to clipboard', { duration: 2500 });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
            <Bug className="h-3 w-3" />
            Diagnostics
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            Playback Diagnostics
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {Object.entries(diagnosticInfo).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-3">
              <span className="text-muted-foreground capitalize font-medium min-w-0">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-foreground text-right break-all max-w-[200px] truncate" title={String(value)}>
                {String(value)}
              </span>
            </div>
          ))}
        </div>

        <Button onClick={copyToClipboard} variant="outline" className="w-full mt-2 gap-2">
          <Copy className="h-4 w-4" />
          Copy to Clipboard
        </Button>
      </DialogContent>
    </Dialog>
  );
};
