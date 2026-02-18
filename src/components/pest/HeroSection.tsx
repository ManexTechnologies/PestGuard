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
    <div className="space-y-8">
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
        <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              AI-Powered Crop Protection
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Protect Your Maize, Sorghum &
              <span className="block text-green-200">Rapoko from Pests</span>
            </h1>
            <p className="text-green-100 text-lg sm:text-xl max-w-2xl mb-8 leading-relaxed">
              Snap a photo of crop damage, get instant AI identification of pests, and receive expert treatment recommendations tailored for Zimbabwean farmers growing maize, sorghum, rapoko and other staple crops.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onTabChange('scan')}
                className="flex items-center gap-2 px-6 py-3.5 bg-white text-green-700 rounded-xl font-semibold text-base hover:bg-green-50 transition-all shadow-lg shadow-green-900/20 hover:shadow-xl hover:-translate-y-0.5"
              >
                <Camera className="w-5 h-5" />
                Check Your Crops
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onTabChange('map')}
                className="flex items-center gap-2 px-6 py-3.5 bg-white/15 backdrop-blur-sm text-white rounded-xl font-semibold text-base hover:bg-white/25 transition-all border border-white/30"
              >
                <MapPin className="w-5 h-5" />
                View Detections
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total Reports</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
          <p className="text-sm text-gray-500 mt-0.5">Active Alerts</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.criticalAlerts}</p>
          <p className="text-sm text-gray-500 mt-0.5">Critical Alerts</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.provincesAffected}</p>
          <p className="text-sm text-gray-500 mt-0.5">Provinces Affected</p>
        </div>
      </section>

      {/* Quick Actions + Recent Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => onTabChange('scan')}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Identify a Pest</p>
                <p className="text-sm text-gray-500">Upload photo or describe</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-green-600 transition-colors" />
            </button>
            <button
              onClick={() => onTabChange('map')}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">View Pest Map</p>
                <p className="text-sm text-gray-500">See reports in your area</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors" />
            </button>
            <button
              onClick={() => onTabChange('resources')}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Pest Library</p>
                <p className="text-sm text-gray-500">Browse 20+ common pests</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-amber-600 transition-colors" />
            </button>
            <button
              onClick={() => onTabChange('history')}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">My Reports</p>
                <p className="text-sm text-gray-500">Track pest history</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-purple-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Pest Alerts</h2>
            <button
              onClick={() => onTabChange('map')}
              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {recentAlerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Leaf className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>No recent alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentAlerts.slice(0, 8).map((alert, idx) => (
                  <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    {severityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{alert.pest_name}</p>
                      <p className="text-xs text-gray-500 truncate">{alert.location_name}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(alert.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            icon: <Camera className="w-6 h-6" />,
            color: 'from-green-500 to-emerald-600',
            title: 'AI Pest Scanner',
            desc: 'Upload a photo and our AI identifies pests instantly with confidence scores and detailed analysis.'
          },
          {
            icon: <Leaf className="w-6 h-6" />,
            color: 'from-amber-500 to-orange-600',
            title: 'Treatment Guide',
            desc: 'Get 8-10 treatment options per pest, starting with organic methods before chemical solutions.'
          },
          {
            icon: <MapPin className="w-6 h-6" />,
            color: 'from-blue-500 to-indigo-600',
            title: 'Outbreak Mapping',
            desc: 'Track pest outbreaks across Zimbabwe with real-time geo-mapped reports from fellow farmers.'
          },
          {
            icon: <Shield className="w-6 h-6" />,
            color: 'from-purple-500 to-violet-600',
            title: 'Safety First',
            desc: 'Every chemical recommendation includes dosage warnings, safety precautions, and environmental risks.'
          },
          {
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'from-rose-500 to-pink-600',
            title: 'Trend Analysis',
            desc: 'Monitor pest trends over time, track treatment effectiveness, and plan ahead for seasonal threats.'
          },
          {
            icon: <Users className="w-6 h-6" />,
            color: 'from-teal-500 to-cyan-600',
            title: 'Community Reports',
            desc: 'Join thousands of Zimbabwean farmers sharing pest sightings to protect crops across all provinces.'
          },
        ].map((feature, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-105 transition-transform`}>
              {feature.icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default HeroSection;
