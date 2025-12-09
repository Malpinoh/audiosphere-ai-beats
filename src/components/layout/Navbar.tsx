import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Upload, User, LogOut, BarChart3, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SearchBar } from "@/components/layout/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
  { to: "/artists", label: "Artists" },
  { to: "/charts", label: "Charts" },
  { to: "/playlists", label: "Playlists" },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-xl maudio-gradient-text hidden sm:inline">
              MAUDIO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link 
                to="/library" 
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                Library
              </Link>
            )}
          </div>

          {/* Right side items */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search Bar - Desktop */}
            <div className="hidden md:block">
              <SearchBar className="w-56 lg:w-64" />
            </div>
            
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile menu button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-background border-border">
                <div className="flex flex-col space-y-2 mt-8">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.to}
                      to={link.to} 
                      className="text-foreground hover:text-primary transition-colors py-3 px-4 rounded-lg hover:bg-muted"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {user && (
                    <Link 
                      to="/library" 
                      className="text-foreground hover:text-primary transition-colors py-3 px-4 rounded-lg hover:bg-muted"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Library
                    </Link>
                  )}
                  
                  {/* Mobile Search */}
                  <div className="pt-4 border-t border-border">
                    <SearchBar className="w-full" />
                  </div>
                  
                  {/* Mobile Auth Section */}
                  <div className="pt-4 border-t border-border">
                    {user ? (
                      <div className="space-y-2">
                        {(profile?.role === 'artist' || profile?.role === 'distributor' || profile?.role === 'admin') && (
                          <Link 
                            to="/upload" 
                            className="flex items-center gap-3 text-foreground hover:text-primary transition-colors py-3 px-4 rounded-lg hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Upload className="h-5 w-5" />
                            Upload Music
                          </Link>
                        )}
                        {profile?.role === 'artist' && (
                          <Link 
                            to="/artist-dashboard" 
                            className="flex items-center gap-3 text-foreground hover:text-primary transition-colors py-3 px-4 rounded-lg hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <BarChart3 className="h-5 w-5" />
                            Dashboard
                          </Link>
                        )}
                        {profile?.role === 'admin' && (
                          <Link 
                            to="/admin" 
                            className="flex items-center gap-3 text-foreground hover:text-primary transition-colors py-3 px-4 rounded-lg hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Settings className="h-5 w-5" />
                            Admin Panel
                          </Link>
                        )}
                        <Link 
                          to="/account-settings" 
                          className="flex items-center gap-3 text-foreground hover:text-primary transition-colors py-3 px-4 rounded-lg hover:bg-muted"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="h-5 w-5" />
                          Account
                        </Link>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full text-destructive hover:text-destructive/80 transition-colors py-3 px-4 rounded-lg hover:bg-destructive/10 text-left"
                        >
                          <LogOut className="h-5 w-5" />
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full maudio-gradient-bg">
                          Sign In / Sign Up
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9 border-2 border-primary/20">
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm">
                          {profile?.full_name?.[0] || profile?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-popover border-border" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">
                          {profile?.full_name || profile?.username}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    {(profile?.role === 'artist' || profile?.role === 'distributor' || profile?.role === 'admin') && (
                      <DropdownMenuItem asChild>
                        <Link to="/upload" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          <span>Upload Music</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {profile?.role === 'artist' && (
                      <DropdownMenuItem asChild>
                        <Link to="/artist-dashboard" className="cursor-pointer">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {profile?.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/account-settings" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Account</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button className="maudio-gradient-bg shadow-lg shadow-primary/25">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
