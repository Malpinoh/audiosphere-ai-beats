import { Link } from "react-router-dom";
import { Music2 } from "lucide-react";

interface GenreCardProps {
  id: string;
  name: string;
  image?: string;
  color?: string;
  trackCount?: number;
}

const genreIcons: Record<string, string> = {
  "hip-hop": "🎤",
  "r-and-b": "💜",
  "pop": "⭐",
  "electronic": "🎧",
  "rock": "🎸",
  "jazz": "🎷",
  "afrobeats": "🌍",
  "latin": "💃",
  "gospel": "🙏",
  "reggae": "🎵",
  "classical": "🎻",
  "country": "🤠",
};

export function GenreCard({ id, name, image, color = "from-primary to-secondary", trackCount }: GenreCardProps) {
  const emoji = genreIcons[id] || "🎵";
  
  return (
    <Link 
      to={`/genre/${id}`} 
      className="block group"
    >
      <div className={`relative h-40 rounded-2xl overflow-hidden bg-gradient-to-br ${color} shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:shadow-primary/20`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.3),transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-black/10 rounded-full translate-x-8 translate-y-8" />
          <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-6 -translate-y-6" />
        </div>
        
        {/* Optional image overlay */}
        {image && (
          <div className="absolute inset-0 opacity-30">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        )}
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-5">
          {/* Emoji icon */}
          <div className="text-4xl drop-shadow-lg">
            {emoji}
          </div>
          
          {/* Genre info */}
          <div>
            <h3 className="text-xl font-bold text-white drop-shadow-md">{name}</h3>
            {trackCount !== undefined && (
              <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
                <Music2 className="h-3 w-3" />
                {trackCount.toLocaleString()} tracks
              </p>
            )}
          </div>
        </div>
        
        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
      </div>
    </Link>
  );
}
