
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, LogIn, User, Menu, X, LogOut, Upload, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchBar } from "./SearchBar";
import { toast } from "sonner";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
  
  const handleSignOut = async () => {
    await signOut();
    toast.success("You've been signed out successfully");
    navigate("/");
  };
  
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return "MA";
  };
  
  return (
    <nav className="sticky top-0 z-50 bg-maudio-darker border-b border-border py-3 px-4 md:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold maudio-gradient-text">MAUDIO</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/browse" className="text-sm font-medium hover:text-primary transition-colors">
            Browse
          </Link>
          <Link to="/charts" className="text-sm font-medium hover:text-primary transition-colors">
            Charts
          </Link>
          <Link to="/playlists" className="text-sm font-medium hover:text-primary transition-colors">
            Playlists
          </Link>
        </div>
        
        {/* Search bar (Desktop) */}
        <div className="hidden md:flex items-center">
          <SearchBar className="w-64" />
        </div>
        
        {/* Auth buttons (Desktop) */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{profile?.full_name || profile?.username || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/upload" className="cursor-pointer flex w-full items-center">
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Upload Track</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account-settings" className="cursor-pointer flex w-full items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account-settings" className="cursor-pointer flex w-full items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild className="gap-1">
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </Button>
              <Button size="sm" asChild className="gap-1 maudio-gradient-bg">
                <Link to="/signup">
                  <User className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </div>
        
        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggleSearch} className="maudio-icon-button">
            <Search className="h-5 w-5" />
          </button>
          <button onClick={toggleMenu} className="maudio-icon-button">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden p-3 border-t border-border animate-fade-in">
          <SearchBar />
        </div>
      )}
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden p-4 border-t border-border animate-fade-in bg-maudio-darker space-y-4">
          <div className="space-y-3">
            <Link 
              to="/" 
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/browse" 
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse
            </Link>
            <Link 
              to="/charts" 
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Charts
            </Link>
            <Link 
              to="/playlists" 
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Playlists
            </Link>
          </div>
          
          {user ? (
            <div className="space-y-3 pt-3 border-t border-border">
              {profile && (
                <div className="flex items-center space-x-3 pb-2">
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{profile?.full_name || profile?.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              
              <Link 
                to="/upload" 
                className="flex items-center py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Track
              </Link>
              
              <Link 
                to="/account-settings" 
                className="flex items-center py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
              
              <Link 
                to="/account-settings" 
                className="flex items-center py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
              
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="flex items-center py-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-3 border-t border-border">
              <Button variant="outline" asChild className="justify-center">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Link>
              </Button>
              <Button asChild className="justify-center maudio-gradient-bg">
                <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
