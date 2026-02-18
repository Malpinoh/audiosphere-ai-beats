import { useState } from "react";
import { Home, Search, Library, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [tapped, setTapped] = useState<string | null>(null);

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/browse", label: "Browse", icon: Search },
    { to: "/library", label: "Library", icon: Library },
    { to: user ? "/account-settings" : "/auth", label: "Profile", icon: User },
  ];

  const handleTap = (to: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setTapped(to);
    setTimeout(() => setTapped(null), 300);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          const isTapped = tapped === to;

          return (
            <Link
              key={to}
              to={to}
              onClick={() => handleTap(to)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-1 w-1 h-1 rounded-full bg-primary" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isTapped && "scale-75",
                  isActive && !isTapped && "scale-110"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-opacity duration-200",
                  isActive ? "opacity-100" : "opacity-70"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
