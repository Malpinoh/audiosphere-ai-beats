import { useState, useEffect } from "react";
import { Settings2, Check, Wifi, WifiOff, Signal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export type AudioQualityTier = 'normal' | 'high' | 'hifi' | 'hires' | 'auto';

interface QualityOption {
  tier: AudioQualityTier;
  label: string;
  description: string;
  badge?: string;
  icon?: React.ReactNode;
}

const QUALITY_OPTIONS: QualityOption[] = [
  { tier: 'auto', label: 'Auto', description: 'Adapts to your connection', icon: <Wifi className="h-4 w-4" /> },
  { tier: 'normal', label: 'Normal', description: 'MP3 128kbps', icon: <Signal className="h-4 w-4 opacity-40" /> },
  { tier: 'high', label: 'High', description: 'MP3 320kbps', icon: <Signal className="h-4 w-4 opacity-70" /> },
  { tier: 'hifi', label: 'Hi-Fi', description: 'FLAC 16-bit/44.1kHz', badge: 'LOSSLESS', icon: <Signal className="h-4 w-4" /> },
  { tier: 'hires', label: 'Hi-Res', description: 'FLAC 24-bit/96kHz', badge: 'HI-RES', icon: <Sparkles className="h-4 w-4" /> },
];

interface QualitySelectorProps {
  currentQuality: AudioQualityTier;
  availableQualities?: AudioQualityTier[];
  onQualityChange: (quality: AudioQualityTier) => void;
  isAdaptive?: boolean;
  currentBitrate?: number;
}

export function QualitySelector({
  currentQuality,
  availableQualities = ['normal', 'high'],
  onQualityChange,
  isAdaptive = false,
  currentBitrate,
}: QualitySelectorProps) {
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');

  useEffect(() => {
    // Check connection speed
    const checkConnection = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g') {
          setConnectionSpeed('fast');
        } else if (effectiveType === '3g') {
          setConnectionSpeed('medium');
        } else {
          setConnectionSpeed('slow');
        }
      }
    };
    
    checkConnection();
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', checkConnection);
      return () => connection.removeEventListener('change', checkConnection);
    }
  }, []);

  const currentOption = QUALITY_OPTIONS.find(q => q.tier === currentQuality);

  const getQualityIndicatorColor = (tier: AudioQualityTier) => {
    switch (tier) {
      case 'hires': return 'text-amber-400';
      case 'hifi': return 'text-purple-400';
      case 'high': return 'text-blue-400';
      case 'normal': return 'text-muted-foreground';
      case 'auto': return 'text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-8 gap-2 ${getQualityIndicatorColor(currentQuality)}`}
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-medium">
            {currentOption?.label || 'Quality'}
          </span>
          {(currentQuality === 'hifi' || currentQuality === 'hires') && (
            <Badge 
              variant="outline" 
              className={`text-[10px] px-1 py-0 ${
                currentQuality === 'hires' ? 'border-amber-400 text-amber-400' : 'border-purple-400 text-purple-400'
              }`}
            >
              {currentQuality === 'hires' ? 'HI-RES' : 'LOSSLESS'}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-popover border-border">
        <DropdownMenuLabel className="text-sm font-semibold">
          Playback Quality
          {isAdaptive && currentBitrate && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({Math.round(currentBitrate / 1000)} kbps)
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Connection indicator */}
        <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
          {connectionSpeed === 'fast' ? (
            <><Wifi className="h-3 w-3 text-green-400" /> Good connection</>
          ) : connectionSpeed === 'medium' ? (
            <><Signal className="h-3 w-3 text-yellow-400" /> Moderate connection</>
          ) : (
            <><WifiOff className="h-3 w-3 text-red-400" /> Slow connection</>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {QUALITY_OPTIONS.map((option) => {
          const isAvailable = option.tier === 'auto' || availableQualities.includes(option.tier as AudioQualityTier);
          const isSelected = currentQuality === option.tier;
          
          return (
            <DropdownMenuItem
              key={option.tier}
              disabled={!isAvailable}
              onClick={() => isAvailable && onQualityChange(option.tier)}
              className={`flex items-center gap-3 py-2.5 ${
                !isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className={`${getQualityIndicatorColor(option.tier)}`}>
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{option.label}</span>
                  {option.badge && (
                    <Badge 
                      variant="outline" 
                      className={`text-[9px] px-1 py-0 ${
                        option.tier === 'hires' 
                          ? 'border-amber-400 text-amber-400' 
                          : 'border-purple-400 text-purple-400'
                      }`}
                    >
                      {option.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
