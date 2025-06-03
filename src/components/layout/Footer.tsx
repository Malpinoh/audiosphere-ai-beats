
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-black/80 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h3 className="font-semibold text-white mb-3">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/browse" className="text-gray-400 hover:text-white transition-colors">
                  Browse Music
                </Link>
              </li>
              <li>
                <Link to="/charts" className="text-gray-400 hover:text-white transition-colors">
                  Charts
                </Link>
              </li>
              <li>
                <Link to="/artists" className="text-gray-400 hover:text-white transition-colors">
                  Artists
                </Link>
              </li>
              <li>
                <Link to="/playlists" className="text-gray-400 hover:text-white transition-colors">
                  Playlists
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-3">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/service-info" className="text-gray-400 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/api/docs" className="text-gray-400 hover:text-white transition-colors">
                  API Docs
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-3">MAUDIO</h3>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MAUDIO
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Your music streaming platform with real-time analytics and discovery features.
            </p>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} MAUDIO. All rights reserved.
            <br />
            <span className="text-xs">Monthly listeners update every 28th of the month at 2:00 AM UTC</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
