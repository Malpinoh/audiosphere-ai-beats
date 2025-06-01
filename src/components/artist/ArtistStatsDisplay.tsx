
import { Card, CardContent } from "@/components/ui/card";
import { Users, Play, Calendar, Music } from "lucide-react";
import { useArtistProfile } from "@/hooks/use-artist-profile";
import { useArtistTracks } from "@/hooks/use-artist-tracks";

interface ArtistStatsDisplayProps {
  artistId: string;
}

export function ArtistStatsDisplay({ artistId }: ArtistStatsDisplayProps) {
  const { artistProfile } = useArtistProfile(artistId);
  const { tracks } = useArtistTracks(artistId);

  const totalPlays = tracks.reduce((sum, track) => sum + (track.play_count || 0), 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-black/20 border-white/10">
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-blue-400" />
          <div className="text-2xl font-bold text-white">
            {formatNumber(artistProfile?.follower_count || 0)}
          </div>
          <div className="text-xs text-white/60">Followers</div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/20 border-white/10">
        <CardContent className="p-4 text-center">
          <Play className="h-6 w-6 mx-auto mb-2 text-green-400" />
          <div className="text-2xl font-bold text-white">
            {formatNumber(totalPlays)}
          </div>
          <div className="text-xs text-white/60">Total Plays</div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/20 border-white/10">
        <CardContent className="p-4 text-center">
          <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-400" />
          <div className="text-2xl font-bold text-white">
            {formatNumber(artistProfile?.monthly_listeners || Math.floor(totalPlays / 3))}
          </div>
          <div className="text-xs text-white/60">Monthly Listeners</div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/20 border-white/10">
        <CardContent className="p-4 text-center">
          <Music className="h-6 w-6 mx-auto mb-2 text-pink-400" />
          <div className="text-2xl font-bold text-white">
            {tracks.length}
          </div>
          <div className="text-xs text-white/60">Tracks</div>
        </CardContent>
      </Card>
    </div>
  );
}
