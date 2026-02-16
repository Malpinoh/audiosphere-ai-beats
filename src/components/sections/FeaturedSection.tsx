import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackCard } from "@/components/ui/track-card";
import { Link } from "react-router-dom";
import { useTracks } from "@/hooks/use-tracks";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  seeAllLink?: string;
}

export function Section({ title, subtitle, children, seeAllLink }: SectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 300;
    const newPosition = direction === 'left' 
      ? Math.max(container.scrollLeft - scrollAmount, 0)
      : container.scrollLeft + scrollAmount;
    container.scrollTo({ left: newPosition, behavior: 'smooth' });
  };
  
  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/50 hover:bg-muted" onClick={() => scroll('left')}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/50 hover:bg-muted" onClick={() => scroll('right')}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
          {seeAllLink && (
            <Button variant="ghost" asChild className="text-primary hover:text-primary/80 font-medium text-sm">
              <Link to={seeAllLink}>See All</Link>
            </Button>
          )}
        </div>
      </div>
      {isMobile ? (
        <div className="flex flex-col gap-1">
          {children}
        </div>
      ) : (
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto pb-4 gap-5 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

const LoadingTrackCard = ({ isMobile }: { isMobile: boolean }) => {
  if (isMobile) {
    return (
      <div className="flex items-center gap-3 p-2">
        <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div className="min-w-[180px] max-w-[180px] snap-start">
      <div className="rounded-xl overflow-hidden bg-card">
        <Skeleton className="w-full aspect-square" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
};

export function FeaturedTracks() {
  const { tracks, loading } = useTracks({ limit: 12 });
  const isMobile = useIsMobile();
  
  if (loading) {
    return (
      <Section title="Featured Tracks" subtitle="The hottest tracks right now" seeAllLink="/browse/featured">
        {Array(isMobile ? 5 : 6).fill(0).map((_, i) => (
          <LoadingTrackCard key={i} isMobile={isMobile} />
        ))}
      </Section>
    );
  }
  
  if (tracks.length === 0) {
    return (
      <Section title="Featured Tracks" subtitle="The hottest tracks right now" seeAllLink="/browse/featured">
        <div className="w-full py-12 text-center text-muted-foreground">
          No tracks available yet. Be the first to upload!
        </div>
      </Section>
    );
  }
  
  return (
    <Section title="Featured Tracks" subtitle="The hottest tracks right now" seeAllLink="/browse/featured">
      {tracks.slice(0, isMobile ? 8 : 12).map(track => (
        isMobile ? (
          <TrackCard key={track.id} track={track} variant="list" />
        ) : (
          <div key={track.id} className="min-w-[180px] max-w-[180px] snap-start">
            <TrackCard track={track} variant="card" />
          </div>
        )
      ))}
    </Section>
  );
}
