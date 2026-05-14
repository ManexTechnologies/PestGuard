import React, { useMemo, useState } from 'react';
import {
  MapPin,
  Filter,
  Search,
  AlertTriangle,
  Leaf,
  Bug,
} from 'lucide-react';

import { SEVERITY_COLORS, SEVERITY_DOT_COLORS, type PestReport } from '@/data/pestData';

interface PestMapProps {
  reports: PestReport[];
  loading: boolean;
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

type CropFilter = 'all' | string;

const PestMap: React.FC<PestMapProps> = ({ reports, loading }) => {
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityFilter>('all');
  const [selectedCrop, setSelectedCrop] = useState<CropFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const provinces = useMemo(() => {
    const set = new Set<string>();
    for (const r of reports) {
      if (r.province) set.add(r.province);
    }
    return Array.from(set).sort();
  }, [reports]);

  const crops = useMemo(() => {
    const set = new Set<string>();
    for (const r of reports) {
      if (r.crop_affected) set.add(r.crop_affected);
    }
    return Array.from(set).sort();
  }, [reports]);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return reports.filter((r) => {
      if (selectedProvince && r.province !== selectedProvince) return false;
      if (selectedSeverity !== 'all' && r.severity !== selectedSeverity) return false;
      if (selectedCrop !== 'all' && r.crop_affected !== selectedCrop) return false;
      if (q) {
        const hay = [
          r.pest_name,
          r.crop_affected,
          r.location_name,
          r.province,
          r.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reports, selectedProvince, selectedSeverity, selectedCrop, searchQuery]);

  const stats = useMemo(() => {
    const active = filteredReports.filter((r) => r.status === 'active').length;
    const critical = filteredReports.filter((r) => r.severity === 'critical').length;
    return { active, critical, total: filteredReports.length };
  }, [filteredReports]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Pest Outbreak Map</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {loading
              ? 'Loading outbreaks...'
              : `${stats.total} report${stats.total === 1 ? '' : 's'}${stats.active ? ` • ${stats.active} active` : ''}${stats.critical ? ` • ${stats.critical} critical` : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 border border-gray-200">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as SeverityFilter)}
              className="bg-transparent text-sm outline-none"
              aria-label="Severity filter"
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5 shadow-sm">
        <div className="grid lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-lg border border-gray-200">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
              <div className="relative p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-green-700" />
                  <h3 className="font-semibold text-gray-900">Geo Outbreak Visualization</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  This UI currently shows a filtered outbreak list. Hook real map rendering (e.g. Mapbox/Leaflet) to the same filtered results using each report’s <code>latitude</code> and <code>longitude</code> fields.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredReports.slice(0, 6).map((r) => (
                    <div
                      key={r.id}
                      className="bg-white/70 backdrop-blur rounded-lg border border-gray-200 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 truncate">{r.province}</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{r.pest_name}</p>
                          <p className="text-xs text-gray-500 truncate mt-1">{r.crop_affected}</p>
                        </div>
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SEVERITY_DOT_COLORS[r.severity] || 'bg-gray-400'}`}
                          aria-label={`Severity ${r.severity}`}
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{r.location_name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredReports.length === 0 && (
                  <div className="mt-4 flex items-center justify-center py-10">
                    <div className="text-center">
                      <Leaf className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="font-semibold text-gray-700">No reports match your filters</p>
                      <p className="text-sm text-gray-500 mt-1">Adjust province, severity, crop, or search.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar filters + list */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pest, crop, location..."
                  className="w-full bg-white rounded-md border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Province</span>
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="mt-1 w-full bg-white rounded-md border border-gray-200 px-3 py-2 text-sm outline-none"
                  >
                    <option value="">All provinces</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Crop</span>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="mt-1 w-full bg-white rounded-md border border-gray-200 px-3 py-2 text-sm outline-none"
                  >
                    <option value="all">All crops</option>
                    {crops.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {(selectedProvince || selectedSeverity !== 'all' || selectedCrop !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedProvince('');
                    setSelectedSeverity('all');
                    setSelectedCrop('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 w-full px-3 py-2 rounded-md bg-white border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="w-4 h-4 text-green-700" />
                <h3 className="font-semibold text-gray-900">Outbreaks</h3>
                <span className="text-xs text-gray-500">({filteredReports.length})</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-center">
                    <Leaf className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-semibold text-gray-700">No outbreaks</p>
                    <p className="text-sm text-gray-500 mt-1">Try a different filter.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                  {filteredReports
                    .slice()
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((r) => (
                      <div
                        key={r.id}
                        className="rounded-lg border border-gray-200 p-3 hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">{r.province}</p>
                            <p className="text-sm font-bold text-gray-900 truncate">{r.pest_name}</p>
                            <p className="text-xs text-gray-500 truncate mt-1">{r.crop_affected}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${SEVERITY_COLORS[r.severity] || ''}`}
                            >
                              {r.severity}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{r.location_name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-start gap-2">
                          {r.severity === 'critical' && (
                            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                          )}
                          <p className="text-xs text-gray-600 line-clamp-3">
                            {r.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestMap;

