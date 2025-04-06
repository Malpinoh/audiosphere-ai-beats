
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, LogIn, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
  
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
        <div className="hidden md:flex items-center relative">
          <Input
            type="search"
            placeholder="Search tracks, artists..."
            className="w-64 bg-muted focus-visible:ring-primary"
          />
          <Search className="absolute right-3 h-4 w-4 text-muted-foreground" />
        </div>
        
        {/* Auth buttons (Desktop) */}
        <div className="hidden md:flex items-center space-x-3">
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
          <div className="relative">
            <Input
              type="search"
              placeholder="Search tracks, artists..."
              className="w-full bg-muted focus-visible:ring-primary"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
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
        </div>
      )}
    </nav>
  );
};

export default Navbar;
