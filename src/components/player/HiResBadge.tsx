import { Sparkles, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HiResBadgeProps {
  isHiRes?: boolean;
  isLossless?: boolean;
  maxQuality?: 'normal' | 'high' | 'hifi' | 'hires';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function HiResBadge({ 
  isHiRes = false, 
  isLossless = false, 
  maxQuality = 'normal',
  size = 'sm',
  showTooltip = true 
}: HiResBadgeProps) {
  // Determine what badge to show based on available quality
  const showHiRes = isHiRes || maxQuality === 'hires';
  const showLossless = isLossless || maxQuality === 'hifi';

  if (!showHiRes && !showLossless && maxQuality === 'normal') {
    return null;
  }

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5',
  };

  if (showHiRes) {
    const badge = (
      <Badge 
        variant="outline" 
        className={`${sizeClasses[size]} border-amber-400/50 bg-amber-400/10 text-amber-400 gap-1 font-semibold`}
      >
        <Sparkles className={iconSizes[size]} />
        HI-RES
      </Badge>
    );

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {badge}
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">Hi-Res Audio</p>
              <p className="text-xs text-muted-foreground">24-bit / up to 192kHz</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return badge;
  }

  if (showLossless) {
    const badge = (
      <Badge 
        variant="outline" 
        className={`${sizeClasses[size]} border-purple-400/50 bg-purple-400/10 text-purple-400 gap-1 font-semibold`}
      >
        <Music2 className={iconSizes[size]} />
        LOSSLESS
      </Badge>
    );

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {badge}
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">Lossless Audio</p>
              <p className="text-xs text-muted-foreground">CD Quality (16-bit / 44.1kHz)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return badge;
  }

  if (maxQuality === 'high') {
    const badge = (
      <Badge 
        variant="outline" 
        className={`${sizeClasses[size]} border-blue-400/50 bg-blue-400/10 text-blue-400 font-medium`}
      >
        320kbps
      </Badge>
    );

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {badge}
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">High Quality</p>
              <p className="text-xs text-muted-foreground">MP3 320kbps</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return badge;
  }

  return null;
}
