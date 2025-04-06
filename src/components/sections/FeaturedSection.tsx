
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackCard } from "@/components/ui/track-card";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  seeAllLink?: string;
}

// Common section wrapper for various featured sections
export function Section({ title, subtitle, children, seeAllLink }: SectionProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
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
              <a href={seeAllLink}>See All</a>
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

// Mock data for featured tracks
const featuredTracks = [
  {
    id: "1",
    title: "Midnight Dreams",
    artist: "Luna Echo",
    artistId: "1",
    cover: "https://picsum.photos/id/65/300/300",
    plays: 1248000
  },
  {
    id: "2",
    title: "Cosmic Waves",
    artist: "Stellar Beats",
    artistId: "2",
    cover: "https://picsum.photos/id/240/300/300",
    plays: 876000
  },
  {
    id: "3",
    title: "Urban Flow",
    artist: "City Sounds",
    artistId: "3",
    cover: "https://picsum.photos/id/334/300/300",
    plays: 2450000
  },
  {
    id: "4",
    title: "Desert Wind",
    artist: "Nomad Soul",
    artistId: "4",
    cover: "https://picsum.photos/id/96/300/300",
    plays: 543000
  },
  {
    id: "5",
    title: "Neon Lights",
    artist: "Cyber Pulse",
    artistId: "5",
    cover: "https://picsum.photos/id/1062/300/300",
    plays: 1789000
  },
  {
    id: "6",
    title: "Ocean Breeze",
    artist: "Wave Collective",
    artistId: "6",
    cover: "https://picsum.photos/id/1060/300/300",
    plays: 930000
  }
];

// Featured tracks section component
export function FeaturedTracks() {
  return (
    <Section 
      title="Featured Tracks" 
      subtitle="The hottest tracks right now"
      seeAllLink="/browse/featured"
    >
      {featuredTracks.map(track => (
        <div key={track.id} className="min-w-[220px] max-w-[220px]">
          <TrackCard {...track} />
        </div>
      ))}
    </Section>
  );
}
