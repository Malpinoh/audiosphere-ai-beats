
import { Link } from "react-router-dom";
import { Heart, Twitter, Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-maudio-darker border-t border-border py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold maudio-gradient-text">MAUDIO</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Free music streaming platform for artists and listeners.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-4 uppercase">For Listeners</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/browse" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Discover Music
                </Link>
              </li>
              <li>
                <Link to="/charts" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Charts
                </Link>
              </li>
              <li>
                <Link to="/genres" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Genres
                </Link>
              </li>
              <li>
                <Link to="/playlists" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Playlists
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-4 uppercase">For Artists</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/upload" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Upload Music
                </Link>
              </li>
              <li>
                <Link to="/promote" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Promote Your Music
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Analytics
                </Link>
              </li>
              <li>
                <Link to="/resources" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Resources
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-4 uppercase">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-10 pt-6 flex flex-col-reverse sm:flex-row items-center justify-between">
          <p className="text-xs text-muted-foreground mt-4 sm:mt-0">
            &copy; {new Date().getFullYear()} MAUDIO. All rights reserved.
          </p>
          <p className="text-xs flex items-center">
            Made with <Heart className="h-3 w-3 mx-1 text-secondary" /> for music creators and listeners
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
