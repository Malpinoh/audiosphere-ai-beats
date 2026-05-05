import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export type HomeFilter = "all" | "music" | "genres" | "playlists";

interface Props {
  active: HomeFilter;
  onChange: (f: HomeFilter) => void;
}

const TABS: { id: HomeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "music", label: "Music" },
  { id: "genres", label: "Genres" },
  { id: "playlists", label: "Playlists" },
];

export function MobileHomeHeader({ active, onChange }: Props) {
  const { user, profile } = useAuth();
  const profileTo = user ? "/account-settings" : "/auth";
  const initial =
    profile?.full_name?.[0]?.toUpperCase() ||
    profile?.username?.[0]?.toUpperCase() ||
    "U";

  return (
    <header
      className="lg:hidden sticky z-30"
      style={{
        top: 0,
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
      }}
    >
      <div className="px-3">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-2xl",
            "bg-background/55 backdrop-blur-xl backdrop-saturate-150",
            "border border-border/50 shadow-lg shadow-black/10"
          )}
        >
          {/* Profile */}
          <Link to={profileTo} aria-label="Open profile" className="flex-shrink-0">
            <Avatar className="h-9 w-9 ring-2 ring-primary/30">
              <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Profile"} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Filter tabs */}
          <nav
            className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1"
            aria-label="Home filters"
          >
            {TABS.map((tab) => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChange(tab.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}