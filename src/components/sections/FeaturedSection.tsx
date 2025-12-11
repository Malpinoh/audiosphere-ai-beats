import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackCard } from "@/components/ui/track-card";
import { Link } from "react-router-dom";
import { useTracks } from "@/hooks/use-tracks";
import { Skeleton } from "@/components/ui/skeleton";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  seeAllLink?: string;
}

// Common section wrapper for various featured sections
export function Section({ title, subtitle, children, seeAllLink }: SectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 300;
    const currentScroll = container.scrollLeft;
    const newPosition = direction === 'left' 
      ? Math.max(currentScroll - scrollAmount, 0)
      : currentScroll + scrollAmount;
      
    container.scrollTo({ left: newPosition, behavior: 'smooth' });
  };
  
  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full border-border/50 hover:bg-muted"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full border-border/50 hover:bg-muted"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          {seeAllLink && (
            <Button variant="ghost" asChild className="text-primary hover:text-primary/80 font-medium">
              <Link to={seeAllLink}>See All</Link>
            </Button>
          )}
        </div>
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-4 gap-5 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
    </section>
  );
}

// Loading card skeleton
const LoadingTrackCard = () => (
  <div className="min-w-[140px] max-w-[140px] sm:min-w-[160px] sm:max-w-[160px] md:min-w-[180px] md:max-w-[180px] snap-start">
    <div className="rounded-xl overflow-hidden bg-card">
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
  const { tracks, loading } = useTracks({ limit: 12 });
  
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
  
  if (tracks.length === 0) {
    return (
      <Section 
        title="Featured Tracks" 
        subtitle="The hottest tracks right now"
        seeAllLink="/browse/featured"
      >
        <div className="w-full py-12 text-center text-muted-foreground">
          No tracks available yet. Be the first to upload!
        </div>
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
        <div key={track.id} className="min-w-[140px] max-w-[140px] sm:min-w-[160px] sm:max-w-[160px] md:min-w-[180px] md:max-w-[180px] snap-start">
          <TrackCard track={track} variant="card" />
        </div>
      ))}
    </Section>
  );
}