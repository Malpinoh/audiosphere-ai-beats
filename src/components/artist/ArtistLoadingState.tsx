
import { Loader2 } from "lucide-react";

export const ArtistLoadingState = () => {
  return (
    <div className="flex justify-center items-center h-[70vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Loading artist profile...</span>
    </div>
  );
};
