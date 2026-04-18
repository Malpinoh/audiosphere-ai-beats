import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/music-player";
import { ChevronUp, ChevronDown, Play, Pause, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function QueueDrawer({ open, onOpenChange }: Props) {
  const {
    queue, currentTrack, isPlaying, playTrack, removeFromQueue,
    reorderQueue, clearQueue, togglePlay,
  } = useMusicPlayer();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Queue</h2>
            {queue.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearQueue}>Clear All</Button>
            )}
          </div>
          <ScrollArea className="flex-1 p-2">
            {queue.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Your queue is empty</div>
            ) : (
              <div className="space-y-1">
                {queue.map((t, i) => {
                  const cover = t.cover_art_path
                    ? `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/cover_art/${t.cover_art_path}`
                    : "/placeholder.svg";
                  const isCurrent = currentTrack?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${isCurrent ? "bg-muted" : ""}`}
                    >
                      <img src={cover} alt={t.title} className="h-12 w-12 rounded object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
                      </div>
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => reorderQueue(i, i - 1)}
                          disabled={i === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => reorderQueue(i, i + 1)}
                          disabled={i === queue.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => (isCurrent ? togglePlay() : playTrack(t))}
                      >
                        {isCurrent && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => removeFromQueue(t.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
