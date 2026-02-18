import React, { useState, useMemo } from 'react';
import { MapPin, Filter, AlertTriangle, Clock, Bug, ChevronDown, ChevronUp, Leaf, Search, X } from 'lucide-react';
import { SEVERITY_COLORS, SEVERITY_DOT_COLORS, STATUS_COLORS, PROVINCES, CROP_TYPES, type PestReport } from '@/data/pestData';

interface PestMapProps {
  reports: PestReport[];
  loading: boolean;
}

// Zimbabwe province approximate centers for the visual map
const PROVINCE_COORDS: Record<string, { x: number; y: number }> = {
  'Harare': { x: 62, y: 38 },
  'Bulawayo': { x: 38, y: 62 },
  'Manicaland': { x: 78, y: 48 },
  'Mashonaland Central': { x: 58, y: 25 },
  'Mashonaland East': { x: 68, y: 35 },
  'Mashonaland West': { x: 45, y: 32 },
  'Masvingo': { x: 60, y: 65 },
  'Matabeleland North': { x: 30, y: 40 },
  'Matabeleland South': { x: 38, y: 78 },
  'Midlands': { x: 48, y: 50 },
};

const PestMap: React.FC<PestMapProps> = ({ reports, loading }) => {
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<PestReport | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (selectedProvince && r.province !== selectedProvince) return false;
      if (selectedCrop && r.crop_affected !== selectedCrop) return false;
      if (selectedSeverity && r.severity !== selectedSeverity) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.pest_name.toLowerCase().includes(q) ||
               r.location_name.toLowerCase().includes(q) ||
               r.province.toLowerCase().includes(q);
      }
      return true;
    });
  }, [reports, selectedProvince, selectedCrop, selectedSeverity, searchQuery]);

  const provinceStats = useMemo(() => {
    const stats: Record<string, { total: number; critical: number; high: number }> = {};
    filteredReports.forEach(r => {
      if (!stats[r.province]) stats[r.province] = { total: 0, critical: 0, high: 0 };
      stats[r.province].total++;
      if (r.severity === 'critical') stats[r.province].critical++;
      if (r.severity === 'high') stats[r.province].high++;
    });
    return stats;
  }, [filteredReports]);

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

  const clearFilters = () => {
    setSelectedProvince('');
    setSelectedCrop('');
    setSelectedSeverity('');
    setSearchQuery('');
  };

  const hasFilters = selectedProvince || selectedCrop || selectedSeverity || searchQuery;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pest Outbreak Map</h2>
          <p className="text-gray-500 mt-1">{filteredReports.length} reports across Zimbabwe</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <MapPin className="w-4 h-4 inline mr-1" /> Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Filter className="w-4 h-4 inline mr-1" /> List
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pests, locations..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Provinces</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Crops</option>
            {CROP_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-600 hover:text-red-600 transition-colors">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full" />
        </div>
      ) : viewMode === 'map' ? (
        /* Map View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
              {/* SVG Map of Zimbabwe */}
              <svg viewBox="0 0 100 100" className="w-full h-auto" style={{ maxHeight: '500px' }}>
                {/* Zimbabwe outline (simplified) */}
                <path
                  d="M25,15 L55,10 L75,15 L85,25 L88,45 L82,55 L85,70 L75,85 L55,90 L40,85 L30,75 L20,60 L15,45 L18,30 Z"
                  fill="#f0fdf4"
                  stroke="#86efac"
                  strokeWidth="0.5"
                />
                {/* Province labels and dots */}
                {Object.entries(PROVINCE_COORDS).map(([name, coords]) => {
                  const stat = provinceStats[name];
                  const dotColor = stat?.critical ? '#ef4444' : stat?.high ? '#f97316' : stat?.total ? '#eab308' : '#d1d5db';
                  const dotSize = stat ? Math.min(3 + stat.total * 0.8, 6) : 1.5;
                  
                  return (
                    <g key={name} className="cursor-pointer" onClick={() => setSelectedProvince(selectedProvince === name ? '' : name)}>
                      {/* Pulse animation for active alerts */}
                      {stat && stat.total > 0 && (
                        <circle cx={coords.x} cy={coords.y} r={dotSize + 2} fill={dotColor} opacity="0.2">
                          <animate attributeName="r" from={dotSize} to={dotSize + 4} dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx={coords.x} cy={coords.y} r={dotSize} fill={dotColor} stroke="white" strokeWidth="0.5" />
                      <text
                        x={coords.x}
                        y={coords.y + dotSize + 3}
                        textAnchor="middle"
                        fontSize="2.5"
                        fill="#374151"
                        fontWeight={selectedProvince === name ? 'bold' : 'normal'}
                        className="select-none"
                      >
                        {name.replace('Mashonaland ', 'Mash. ').replace('Matabeleland ', 'Mat. ')}
                      </text>
                      {stat && (
                        <text
                          x={coords.x}
                          y={coords.y + dotSize + 5.5}
                          textAnchor="middle"
                          fontSize="2"
                          fill="#6b7280"
                          className="select-none"
                        >
                          {stat.total} report{stat.total !== 1 ? 's' : ''}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                {[
                  { color: 'bg-red-500', label: 'Critical' },
                  { color: 'bg-orange-500', label: 'High' },
                  { color: 'bg-yellow-500', label: 'Medium' },
                  { color: 'bg-green-500', label: 'Low' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side panel - Recent reports */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              {selectedProvince ? `Reports in ${selectedProvince}` : 'Recent Reports'}
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Leaf className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No reports found</p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedReport?.id === report.id ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${SEVERITY_DOT_COLORS[report.severity] || 'bg-gray-400'}`} />
                        <h4 className="font-medium text-gray-900 text-sm">{report.pest_name}</h4>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[report.status] || ''}`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.location_name}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(report.created_at)}</span>
                    </div>
                    {selectedReport?.id === report.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        <p className="text-xs text-gray-600">{report.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{report.crop_affected}</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{report.province}</span>
                          <span className={`text-xs px-2 py-0.5 rounded border ${SEVERITY_COLORS[report.severity] || ''}`}>
                            {report.severity}
                          </span>
                        </div>
                        {report.confidence && (
                          <p className="text-xs text-gray-500">Confidence: {report.confidence}%</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Pest</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Crop</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Severity</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedReport(report)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Bug className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{report.pest_name}</p>
                          <p className="text-xs text-gray-500">{report.pest_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{report.crop_affected}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-900">{report.location_name}</p>
                      <p className="text-xs text-gray-500">{report.province}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_COLORS[report.severity] || ''}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT_COLORS[report.severity] || ''}`} />
                        {report.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[report.status] || ''}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{formatTime(report.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredReports.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Leaf className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No reports match your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PestMap;
