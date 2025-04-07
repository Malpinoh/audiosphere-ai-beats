
import React from 'react';
import { cn } from '@/lib/utils';

export type AdSize = 'banner' | 'leaderboard' | 'large-rectangle' | 'skyscraper';

interface AdUnitProps {
  size: AdSize;
  className?: string;
  placeholder?: boolean;
}

const AdUnit = ({ size, className, placeholder = true }: AdUnitProps) => {
  // Ad size dimensions based on Google AdSense standard sizes
  const adSizes = {
    'banner': 'h-[60px] w-full max-w-[468px]',
    'leaderboard': 'h-[90px] w-full max-w-[728px]',
    'large-rectangle': 'h-[250px] w-full max-w-[336px]',
    'skyscraper': 'h-[600px] w-full max-w-[160px]',
  };

  // If in production, this would contain the actual AdSense script
  // For now we'll just show a placeholder
  
  return (
    <div 
      className={cn(
        'mx-auto overflow-hidden bg-muted/30 rounded border border-dashed border-muted',
        adSizes[size],
        className
      )}
    >
      {placeholder && (
        <div className="flex items-center justify-center h-full w-full text-xs text-muted-foreground">
          Advertisement {size}
          {/* In production, replace this with actual AdSense code */}
          {/* 
            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
              data-ad-slot="XXXXXXXXXX"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
          */}
        </div>
      )}
    </div>
  );
};

export default AdUnit;
