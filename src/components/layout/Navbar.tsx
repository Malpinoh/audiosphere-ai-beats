import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Upload, User, LogOut, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SearchBar } from "@/components/layout/SearchBar";
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
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              MAUDIO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/browse" className="text-gray-300 hover:text-white transition-colors">
              Browse
            </Link>
            <Link to="/artists" className="text-gray-300 hover:text-white transition-colors">
              Artists
            </Link>
            <Link to="/charts" className="text-gray-300 hover:text-white transition-colors">
              Charts
            </Link>
            <Link to="/playlists" className="text-gray-300 hover:text-white transition-colors">
              Playlists
            </Link>
            {user && (
              <Link to="/library" className="text-gray-300 hover:text-white transition-colors">
                Library
              </Link>
            )}
            
            {/* Search Bar */}
            <SearchBar className="w-64" />
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-black border-gray-800">
                <div className="flex flex-col space-y-4 mt-8">
                  <Link 
                    to="/" 
                    className="text-gray-300 hover:text-white transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/browse" 
                    className="text-gray-300 hover:text-white transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Browse
                  </Link>
                  <Link 
                    to="/artists" 
                    className="text-gray-300 hover:text-white transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Artists
                  </Link>
                  <Link 
                    to="/charts" 
                    className="text-gray-300 hover:text-white transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Charts
                  </Link>
                  <Link 
                    to="/playlists" 
                    className="text-gray-300 hover:text-white transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Playlists
                  </Link>
                  {user && (
                    <Link 
                      to="/library" 
                      className="text-gray-300 hover:text-white transition-colors py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Library
                    </Link>
                  )}
                  
                  {/* Mobile Search */}
                  <div className="pt-4 border-t border-gray-800">
                    <SearchBar className="w-full" />
                  </div>
                  
                  {/* Mobile Auth Section */}
                  <div className="pt-4 border-t border-gray-800">
                    {user ? (
                      <div className="space-y-3">
                        {(profile?.role === 'artist' || profile?.role === 'distributor' || profile?.role === 'admin') && (
                          <Link 
                            to="/upload" 
                            className="block text-gray-300 hover:text-white transition-colors py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Upload
                          </Link>
                        )}
                        {profile?.role === 'artist' && (
                          <Link 
                            to="/artist-dashboard" 
                            className="block text-gray-300 hover:text-white transition-colors py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                        )}
                        <Link 
                          to="/account-settings" 
                          className="block text-gray-300 hover:text-white transition-colors py-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Account
                        </Link>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setIsMobileMenuOpen(false);
                          }}
                          className="block text-red-400 hover:text-red-300 transition-colors py-2 text-left w-full"
                        >
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full maudio-gradient-bg">
                            Sign In / Sign Up
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {profile?.full_name?.[0] || profile?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-black border-gray-800" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-white">
                          {profile?.full_name || profile?.username}
                        </p>
                        <p className="text-xs leading-none text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    {(profile?.role === 'artist' || profile?.role === 'distributor' || profile?.role === 'admin') && (
                      <DropdownMenuItem asChild>
                        <Link to="/upload" className="cursor-pointer text-gray-300 hover:text-white">
                          <Upload className="mr-2 h-4 w-4" />
                          <span>Upload Music</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {profile?.role === 'artist' && (
                      <DropdownMenuItem asChild>
                        <Link to="/artist-dashboard" className="cursor-pointer text-gray-300 hover:text-white">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/account-settings" className="cursor-pointer text-gray-300 hover:text-white">
                        <User className="mr-2 h-4 w-4" />
                        <span>Account</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/auth">
                    <Button className="maudio-gradient-bg">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
