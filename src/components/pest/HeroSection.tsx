import React from 'react';
import { Camera, Shield, MapPin, TrendingUp, ArrowRight, Leaf, AlertTriangle, Users } from 'lucide-react';
import type { TabId } from './Navigation';

interface HeroSectionProps {
  onTabChange: (tab: TabId) => void;
  stats: {
    totalReports: number;
    activeAlerts: number;
    criticalAlerts: number;
    provincesAffected: number;
  };
  recentAlerts: Array<{
    pest_name: string;
    severity: string;
    location_name: string;
    created_at: string;
  }>;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onTabChange, stats, recentAlerts }) => {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  const severityIcon = (severity: string) => {
    if (severity === 'critical') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (severity === 'high') return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    return <Leaf className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 400" fill="none">
            <circle cx="700" cy="50" r="200" fill="white" />
            <circle cx="100" cy="350" r="150" fill="white" />
            <path d="M0 200 Q200 100 400 200 Q600 300 800 200" stroke="white" strokeWidth="2" fill="none" />
            <path d="M0 250 Q200 150 400 250 Q600 350 800 250" stroke="white" strokeWidth="1" fill="none" />
          </svg>
        </div>
        <div className="relative px-4 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">AI-Powered Crop Protection</span>
              <span className="xs:hidden">AI Protection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 sm:mb-4">
              Protect Your Crops
              <span className="block text-green-200">from Pests</span>
            </h1>
            <p className="text-green-100 text-sm sm:text-base md:text-lg max-w-xl mb-6 sm:mb-8 leading-relaxed">
              Snap a photo of crop damage, get instant AI identification and expert treatment recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => onTabChange('scan')}
                className="flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 bg-white text-green-700 rounded-xl font-semibold text-sm sm:text-base hover:bg-green-50 transition-all shadow-lg shadow-green-900/20 hover:shadow-xl hover:-translate-y-0.5"
              >
                <Camera className="w-5 h-5" />
                Check Your Crops
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onTabChange('map')}
                className="flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 bg-white/15 backdrop-blur-sm text-white rounded-xl font-semibold text-sm sm:text-base hover:bg-white/25 transition-all border border-white/30"
              >
                <MapPin className="w-5 h-5" />
                <span className="sm:hidden">Map</span>
                <span className="hidden sm:inline">View Detections</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalReports}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Total Reports</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Active Alerts</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.criticalAlerts}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Critical</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.provincesAffected}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Provinces</p>
        </div>
      </section>

      {/* Quick Actions + Recent Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={() => onTabChange('scan')}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Identify a Pest</p>
                <p className="text-xs sm:text-sm text-gray-500">Upload photo or describe</p>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto group-hover:text-green-600 transition-colors flex-shrink-0" />
            </button>
            <button
              onClick={() => onTabChange('map')}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">View Pest Map</p>
                <p className="text-xs sm:text-sm text-gray-500">See reports in your area</p>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </button>
            <button
              onClick={() => onTabChange('resources')}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Pest Library</p>
                <p className="text-xs sm:text-sm text-gray-500">Browse 20+ common pests</p>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto group-hover:text-amber-600 transition-colors flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Pest Alerts</h2>
            <button
              onClick={() => onTabChange('map')}
              className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {recentAlerts.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <Leaf className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 text-gray-300" />
                <p className="text-sm">No recent alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                {recentAlerts.slice(0, 6).map((alert, idx) => (
                  <div key={idx} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors">
                    {severityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{alert.pest_name}</p>
                      <p className="text-xs text-gray-500 truncate">{alert.location_name}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{formatTime(alert.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {[
          {
            icon: <Camera className="w-5 h-5 sm:w-6 sm:h-6" />,
            color: 'from-green-500 to-emerald-600',
            title: 'AI Pest Scanner',
            desc: 'Upload a photo and our AI identifies pests instantly with confidence scores.'
          },
          {
            icon: <Leaf className="w-5 h-5 sm:w-6 sm:h-6" />,
            color: 'from-amber-500 to-orange-600',
            title: 'Treatment Guide',
            desc: 'Get 8-10 treatment options per pest, starting with organic methods.'
          },
          {
            icon: <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />,
            color: 'from-blue-500 to-indigo-600',
            title: 'Outbreak Mapping',
            desc: 'Track pest outbreaks across Zimbabwe with real-time geo-mapped reports.'
          },
          {
            icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6" />,
            color: 'from-purple-500 to-violet-600',
            title: 'Safety First',
            desc: 'Every chemical recommendation includes dosage warnings and safety precautions.'
          },
          {
            icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />,
            color: 'from-rose-500 to-pink-600',
            title: 'Trend Analysis',
            desc: 'Monitor pest trends over time and track treatment effectiveness.'
          },
          {
            icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
            color: 'from-teal-500 to-cyan-600',
            title: 'Community Reports',
            desc: 'Join thousands of farmers sharing pest sightings across all provinces.'
          },
        ].map((feature, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-3 sm:mb-4 shadow-md group-hover:scale-105 transition-transform`}>
              {feature.icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{feature.title}</h3>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default HeroSection;
