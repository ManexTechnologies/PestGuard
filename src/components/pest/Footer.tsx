import React from 'react';
import { Bug, Shield } from 'lucide-react';
import type { TabId } from './Navigation';

interface FooterProps {
  onTabChange: (tab: TabId) => void;
}

const Footer: React.FC<FooterProps> = ({ onTabChange }) => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {/* Brand Icon - Left */}
          <div className="flex flex-col items-start justify-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center">
              <Bug className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">PestGuard</h3>
              <p className="text-[10px] text-green-400 font-medium tracking-wide">ZIMBABWE</p>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mt-2">
              AI-powered pest monitoring platform helping Zimbabwean farmers protect their crops with smart detection and expert treatment recommendations.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-xs font-medium border border-green-800">
                <Shield className="w-3 h-3" /> Trusted by farmers
              </span>
            </div>
          </div>

          {/* Quick Links - Right */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
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
                    className="text-sm text-gray-400 hover:text-green-400 transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; 2026 PestGuard Zimbabwe. Supporting sustainable agriculture.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <button className="hover:text-green-400 transition-colors">Privacy Policy</button>
            <button className="hover:text-green-400 transition-colors">Terms of Service</button>
            <button className="hover:text-green-400 transition-colors">Data Policy</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
