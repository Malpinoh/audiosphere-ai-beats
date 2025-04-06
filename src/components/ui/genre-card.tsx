
import { Link } from "react-router-dom";

interface GenreCardProps {
  id: string;
  name: string;
  image: string;
  color?: string;
}

export function GenreCard({ id, name, image, color = "from-maudio-purple to-maudio-pink" }: GenreCardProps) {
  return (
    <Link 
      to={`/genre/${id}`} 
      className="block group"
    >
      <div className={`relative h-36 rounded-xl overflow-hidden bg-gradient-to-r ${color}`}>
        <div className="absolute inset-0 opacity-30">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <h3 className="text-xl font-bold text-white">{name}</h3>
        </div>
      </div>
    </Link>
  );
}
