
export const ArtistNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <h2 className="text-2xl font-bold mb-2">Artist not found</h2>
      <p className="text-muted-foreground">The artist you're looking for doesn't exist or has been removed.</p>
    </div>
  );
};
