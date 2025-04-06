
import { GenreCard } from "@/components/ui/genre-card";
import { Section } from "@/components/sections/FeaturedSection";

// Mock data for genres
const genres = [
  {
    id: "hip-hop",
    name: "Hip Hop",
    image: "https://picsum.photos/id/1025/300/300",
    color: "from-yellow-500 to-orange-600"
  },
  {
    id: "r-and-b",
    name: "R&B",
    image: "https://picsum.photos/id/1059/300/300",
    color: "from-purple-600 to-pink-600"
  },
  {
    id: "pop",
    name: "Pop",
    image: "https://picsum.photos/id/325/300/300",
    color: "from-blue-500 to-cyan-400"
  },
  {
    id: "electronic",
    name: "Electronic",
    image: "https://picsum.photos/id/1060/300/300",
    color: "from-emerald-500 to-lime-500"
  },
  {
    id: "rock",
    name: "Rock",
    image: "https://picsum.photos/id/1062/300/300",
    color: "from-red-600 to-orange-500"
  },
  {
    id: "jazz",
    name: "Jazz",
    image: "https://picsum.photos/id/1074/300/300",
    color: "from-amber-500 to-yellow-400"
  },
  {
    id: "afrobeats",
    name: "Afrobeats",
    image: "https://picsum.photos/id/1080/300/300",
    color: "from-indigo-600 to-blue-500"
  },
  {
    id: "latin",
    name: "Latin",
    image: "https://picsum.photos/id/177/300/300",
    color: "from-orange-500 to-red-500"
  }
];

// Browse by genre section component
export function BrowseByGenre() {
  return (
    <Section 
      title="Browse by Genre" 
      subtitle="Explore music by categories"
      seeAllLink="/genres"
    >
      {genres.map(genre => (
        <div key={genre.id} className="min-w-[250px] max-w-[250px]">
          <GenreCard {...genre} />
        </div>
      ))}
    </Section>
  );
}
