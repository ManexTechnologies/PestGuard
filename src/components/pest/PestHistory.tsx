import React, { useState, useMemo } from 'react';
import { Clock, Bug, MapPin, TrendingUp, BarChart3, Filter, Star, ChevronDown, ChevronUp, Leaf, User, Users } from 'lucide-react';
import { SEVERITY_COLORS, SEVERITY_DOT_COLORS, STATUS_COLORS, type PestReport } from '@/data/pestData';

interface PestHistoryProps {
  reports: PestReport[];
  loading: boolean;
  onRateEffectiveness: (reportId: string, rating: number) => void;
  userId?: string | null;
}

const PestHistory: React.FC<PestHistoryProps> = ({ reports, loading, onRateEffectiveness, userId }) => {
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'pest'>('date');
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<'my' | 'all'>(userId ? 'my' : 'all');

  const displayReports = useMemo(() => {
    let filtered = reports;
    if (viewFilter === 'my' && userId) {
      filtered = reports.filter(r => (r as any).user_id === userId);
    }
    const sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'severity':
        const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return sorted.sort((a, b) => (sevOrder[a.severity] || 4) - (sevOrder[b.severity] || 4));
      case 'pest':
        return sorted.sort((a, b) => a.pest_name.localeCompare(b.pest_name));
      default:
        return sorted;
    }
  }, [reports, sortBy, viewFilter, userId]);

  // Stats for displayed reports
  const stats = useMemo(() => {
    const source = viewFilter === 'my' && userId
      ? reports.filter(r => (r as any).user_id === userId)
      : reports;
    const pestCounts: Record<string, number> = {};
    const cropCounts: Record<string, number> = {};
    let resolved = 0;
    let active = 0;

    source.forEach(r => {
      pestCounts[r.pest_name] = (pestCounts[r.pest_name] || 0) + 1;
      cropCounts[r.crop_affected] = (cropCounts[r.crop_affected] || 0) + 1;
      if (r.status === 'resolved') resolved++;
      if (r.status === 'active') active++;
    });

    const topPest = Object.entries(pestCounts).sort((a, b) => b[1] - a[1])[0];
    const topCrop = Object.entries(cropCounts).sort((a, b) => b[1] - a[1])[0];

    return { topPest, topCrop, resolved, active, total: source.length };
  }, [reports, viewFilter, userId]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pest Report History</h2>
          <p className="text-gray-500 mt-1">
            {viewFilter === 'my' && userId
              ? 'Your personal pest reports and treatment tracking'
              : 'All community pest reports across Zimbabwe'}
          </p>
        </div>
        {userId && (
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewFilter('my')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewFilter === 'my' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" /> My Reports
            </button>
            <button
              onClick={() => setViewFilter('all')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewFilter === 'all' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" /> All Reports
            </button>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Total Reports</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Top Pest</p>
          <p className="text-lg font-bold text-gray-900 mt-1 truncate">{stats.topPest?.[0] || 'N/A'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Most Affected Crop</p>
          <p className="text-lg font-bold text-gray-900 mt-1 truncate">{stats.topCrop?.[0] || 'N/A'}</p>
        </div>
      </div>

      {/* Pest Frequency Chart */}
      {stats.total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Pest Frequency
          </h3>
          <div className="space-y-3">
            {(() => {
              const source = viewFilter === 'my' && userId
                ? reports.filter(r => (r as any).user_id === userId)
                : reports;
              const pestCounts: Record<string, number> = {};
              source.forEach(r => { pestCounts[r.pest_name] = (pestCounts[r.pest_name] || 0) + 1; });
              const sorted = Object.entries(pestCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
              const max = sorted[0]?.[1] || 1;
              return sorted.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-24 md:w-36 truncate">{name}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${(count / max) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">{count}</span>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {viewFilter === 'my' && userId ? 'My Reports' : 'All Reports'} ({displayReports.length})
        </h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="date">Sort by Date</option>
            <option value="severity">Sort by Severity</option>
            <option value="pest">Sort by Pest Name</option>
          </select>
        </div>
      </div>

      {/* Reports Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full" />
        </div>
      ) : displayReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Leaf className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-2">
            {viewFilter === 'my' ? 'No Personal Reports Yet' : 'No Reports Found'}
          </h3>
          <p className="text-sm text-gray-500">
            {viewFilter === 'my'
              ? 'Start by scanning a pest to create your first report.'
              : 'No pest reports have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all"
            >
              <button
                onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
              >
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${SEVERITY_DOT_COLORS[report.severity] || 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-gray-900">{report.pest_name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${SEVERITY_COLORS[report.severity] || ''}`}>
                      {report.severity}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[report.status] || ''}`}>
                      {report.status}
                    </span>
                    {(report as any).user_id === userId && userId && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        My Report
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Bug className="w-3 h-3" />{report.crop_affected}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.location_name}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(report.created_at)}</span>
                  </div>
                </div>
                {report.effectiveness_rating && (
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= report.effectiveness_rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                )}
                {expandedReport === report.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {expandedReport === report.id && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                      <p className="text-sm text-gray-700">{report.description || 'No description provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Province</p>
                        <p className="text-sm text-gray-700">{report.province}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Confidence</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${report.confidence}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{report.confidence}%</span>
                        </div>
                      </div>
                      {report.treatment_applied && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Treatment Applied</p>
                          <p className="text-sm text-gray-700">{report.treatment_applied}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rate Effectiveness - only for user's own reports */}
                  {!report.effectiveness_rating && (report as any).user_id === userId && userId && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800 mb-2">Rate Treatment Effectiveness</p>
                      <p className="text-xs text-yellow-600 mb-3">How well did the treatment work?</p>
                      <div className="flex items-center gap-2">
                        {[1,2,3,4,5].map(rating => (
                          <button
                            key={rating}
                            onClick={() => onRateEffectiveness(report.id, rating)}
                            className="p-2 hover:bg-yellow-100 rounded-lg transition-colors group"
                          >
                            <Star className="w-6 h-6 text-gray-300 group-hover:text-yellow-400 group-hover:fill-yellow-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PestHistory;
