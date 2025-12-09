import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div>
            <h3 className="font-semibold text-foreground mb-4">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/browse" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Browse Music
                </Link>
              </li>
              <li>
                <Link to="/charts" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Charts
                </Link>
              </li>
              <li>
                <Link to="/artists" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Artists
                </Link>
              </li>
              <li>
                <Link to="/playlists" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Playlists
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/service-info" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/api/docs" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  API Docs
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">MAUDIO</h3>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="text-primary-foreground font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-lg maudio-gradient-text">
                MAUDIO
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your music streaming platform with real-time analytics and discovery features.
            </p>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} MAUDIO. All rights reserved.
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Monthly listeners update every 28th of the month at 2:00 AM UTC
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
