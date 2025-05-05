
import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackCard } from "@/components/ui/track-card";
import { Link } from "react-router-dom";
import { useTracks } from "@/hooks/use-tracks";
import { Track } from "@/types/track-types";
import { Skeleton } from "@/components/ui/skeleton";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  seeAllLink?: string;
}

// Common section wrapper for various featured sections
export function Section({ title, subtitle, children, seeAllLink }: SectionProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 320; // Roughly the width of each card plus margin
    const newPosition = direction === 'left' 
      ? Math.max(scrollPosition - scrollAmount, 0)
      : scrollPosition + scrollAmount;
      
    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };
  
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {seeAllLink && (
            <Button variant="link" asChild className="text-primary">
              <Link to={seeAllLink}>See All</Link>
            </Button>
          )}
        </div>
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-4 scrollbar-hide gap-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
    </section>
  );
}

// Loading card skeleton
const LoadingTrackCard = () => (
  <div className="min-w-[220px] max-w-[220px]">
    <div className="maudio-card overflow-hidden">
      <Skeleton className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
);

// Featured tracks section component
export function FeaturedTracks() {
  const { tracks, loading } = useTracks({ limit: 10 });
  
  if (loading) {
    return (
      <Section 
        title="Featured Tracks" 
        subtitle="The hottest tracks right now"
        seeAllLink="/browse/featured"
      >
        {Array(6).fill(0).map((_, i) => (
          <LoadingTrackCard key={i} />
        ))}
      </Section>
    );
  }
  
  return (
    <Section 
      title="Featured Tracks" 
      subtitle="The hottest tracks right now"
      seeAllLink="/browse/featured"
    >
      {tracks.map(track => (
        <div key={track.id} className="min-w-[220px] max-w-[220px]">
          <TrackCard track={track} />
        </div>
      ))}
    </Section>
  );
}
