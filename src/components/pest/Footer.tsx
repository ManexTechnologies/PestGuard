import React from 'react';
import { Bug, Shield } from 'lucide-react';
import type { TabId } from './Navigation';

interface FooterProps {
  onTabChange: (tab: TabId) => void;
}

const Footer: React.FC<FooterProps> = ({ onTabChange }) => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-8 sm:mt-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-8 items-start">
          
          {/* Brand & Description */}
          <div className="flex flex-col items-start justify-start gap-2 sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center">
                <Bug className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base sm:text-lg">PestGuard</h3>
                <p className="text-[10px] text-green-400 font-medium tracking-wide">ZIMBABWE</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mt-1 sm:mt-2">
              AI-powered pest monitoring platform helping Zimbabwean farmers protect their crops with smart detection.
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-xs font-medium border border-green-800">
                <Shield className="w-3 h-3" /> <span className="hidden sm:inline">Trusted by farmers</span><span className="sm:hidden">Trusted</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', tab: 'home' as TabId },
                { label: 'Scan a Pest', tab: 'scan' as TabId },
                { label: 'Pest Map', tab: 'map' as TabId },
                { label: 'Report History', tab: 'history' as TabId },
                { label: 'Knowledge Base', tab: 'resources' as TabId },
              ].map(link => (
                <li key={link.tab}>
                  <button
                    onClick={() => { onTabChange(link.tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="text-xs sm:text-sm text-gray-400 hover:text-green-400 transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 sm:mt-8 lg:mt-10 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            &copy; 2026 PestGuard Zimbabwe. Supporting sustainable agriculture.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-gray-500">
            <button className="hover:text-green-400 transition-colors">Privacy</button>
            <button className="hover:text-green-400 transition-colors">Terms</button>
            <button className="hover:text-green-400 transition-colors">Data</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
