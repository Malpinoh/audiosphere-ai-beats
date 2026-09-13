import * as React from "react";
import { cn } from "@shared/lib/utils";

const FALLBACK = "/placeholder.svg";

interface ArtworkProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  /** Corner treatment: square art, rounded card art, or circular (artists). */
  shape?: "square" | "rounded" | "circle";
  fallback?: string;
}

/**
 * Single source of truth for cover art rendering: consistent fallback,
 * lazy loading and async decoding across web + mobile surfaces.
 */
export const Artwork = React.forwardRef<HTMLImageElement, ArtworkProps>(
  ({ src, alt, shape = "rounded", fallback = FALLBACK, className, ...props }, ref) => (
    <img
      ref={ref}
      src={src || fallback}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src !== window.location.origin + fallback) img.src = fallback;
      }}
      className={cn(
        "object-cover bg-muted",
        shape === "rounded" && "rounded-xl",
        shape === "circle" && "rounded-full",
        className
      )}
      {...props}
    />
  )
);
Artwork.displayName = "Artwork";

export default Artwork;
