import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFeaturedBanners } from "@/hooks/use-featured-banners";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const { banners, loading } = useFeaturedBanners(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(id);
  }, [paused, banners.length]);

  useEffect(() => {
    if (index >= banners.length) setIndex(0);
  }, [banners.length, index]);

  if (loading || banners.length === 0) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      setIndex((i) =>
        dx < 0 ? (i + 1) % banners.length : (i - 1 + banners.length) % banners.length
      );
    }
    touchStartX.current = null;
  };

  const goPrev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);
  const goNext = () => setIndex((i) => (i + 1) % banners.length);

  return (
    <section
      className="relative w-full overflow-hidden rounded-2xl bg-muted aspect-[16/5] min-h-[180px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Featured banners"
    >
      {banners.map((banner, i) => {
        const content = (
          <img
            src={banner.image_url}
            alt={banner.title || "Featured banner"}
            className="w-full h-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        );
        return (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === index ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {banner.link_url ? (
              <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                {content}
              </a>
            ) : (
              content
            )}
          </div>
        );
      })}

      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous banner"
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-background/60 hover:bg-background/80 backdrop-blur text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            aria-label="Next banner"
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-background/60 hover:bg-background/80 backdrop-blur text-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-foreground" : "w-1.5 bg-foreground/40"
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
