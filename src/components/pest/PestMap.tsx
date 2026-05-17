import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  RefreshCw,
  Info,
  X,
  Filter,
  Bug,
  Leaf,
  AlertTriangle,
} from 'lucide-react';

import { SEVERITY_COLORS, SEVERITY_DOT_COLORS, type PestReport } from '@/data/pestData';
import type { FarmerProfile } from '@/lib/auth';
import LoadingProgressBar from '@/components/LoadingProgressBar';

// Import Leaflet
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Zimbabwe bounds
const ZIMBABWE_BOUNDS: L.LatLngBoundsExpression = [
  [-22.5, 25.0],
  [-15.5, 33.5],
];

const DEFAULT_CENTER: L.LatLngTuple = [-17.825, 31.033];

interface PestMapProps {
  reports: PestReport[];
  loading: boolean;
  profile?: FarmerProfile | null;
  currentUserEmail?: string | null;
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

const PestMap: React.FC<PestMapProps> = ({ reports, loading, profile, currentUserEmail }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  
  const [farmCoords, setFarmCoords] = useState<L.LatLngTuple | null>(null);
  const [farmGeocodeError, setFarmGeocodeError] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityFilter>('all');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<PestReport | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Extract unique values for filters
  const provinces = useMemo(() => {
    const set = new Set<string>();
    for (const r of reports) {
      if (r.province && r.province !== 'Not specified') set.add(r.province);
    }
    return Array.from(set).sort();
  }, [reports]);

  const crops = useMemo(() => {
    const set = new Set<string>();
    for (const r of reports) {
      if (r.crop_affected && r.crop_affected !== 'Unknown') set.add(r.crop_affected);
    }
    return Array.from(set).sort();
  }, [reports]);

  const hasExplicitCoords = (report: PestReport) => {
    return (
      typeof report.latitude === 'number' &&
      typeof report.longitude === 'number' &&
      !Number.isNaN(report.latitude) &&
      !Number.isNaN(report.longitude)
    );
  };

  const getReportFallbackCoords = (report: PestReport): L.LatLngTuple => {
    const [[south, west], [north, east]] = ZIMBABWE_BOUNDS as [L.LatLngTuple, L.LatLngTuple];
    const hash = [...report.id].reduce((acc, char) => acc * 31 + char.charCodeAt(0), 0);
    const pseudoRandom = (seed: number) => ((seed * 9301 + 49297) % 233280) / 233280;
    const lat = south + pseudoRandom(hash) * (north - south);
    const lng = west + pseudoRandom(hash + 1) * (east - west);
    return [lat, lng];
  };

  // Filter reports using search and filters; missing coordinates are still included for random placement
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports.filter((r) => {
      if (selectedProvince && r.province !== selectedProvince) return false;
      if (selectedSeverity !== 'all' && r.severity !== selectedSeverity) return false;
      if (selectedCrop !== 'all' && r.crop_affected !== selectedCrop) return false;
      if (q) {
        const hay = [r.pest_name, r.crop_affected, r.location_name, r.province, r.description]
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

  const geocodeFarmLocation = async (address: string): Promise<L.LatLngTuple | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          return [lat, lon];
        }
      }
    } catch (error) {
      console.warn('Failed to geocode farm location:', error);
    }
    return null;
  };

  useEffect(() => {
    if (!profile?.farm_location) {
      setFarmCoords(null);
      setFarmGeocodeError(null);
      return;
    }

    let active = true;
    geocodeFarmLocation(profile.farm_location).then((coords) => {
      if (!active) return;
      if (coords) {
        setFarmCoords(coords);
        setFarmGeocodeError(null);
      } else {
        setFarmCoords(null);
        setFarmGeocodeError('Could not resolve your farm location on the map');
      }
    });

    return () => {
      active = false;
    };
  }, [profile?.farm_location]);

  useEffect(() => {
    if (!leafletMapRef.current || !farmCoords) return;
    leafletMapRef.current.setView(farmCoords, 12);
  }, [farmCoords]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    
    try {
      console.log("Initializing map...");
      
      const map = L.map(mapRef.current).setView(DEFAULT_CENTER, 7);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 6,
      }).addTo(map);
      
      L.control.scale({ metric: true, imperial: false }).addTo(map);
      map.setMaxBounds(ZIMBABWE_BOUNDS);
      map.on('drag', () => {
        map.panInsideBounds(ZIMBABWE_BOUNDS);
      });
      
      leafletMapRef.current = map;
      console.log("Map initialized successfully");
      
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Failed to initialize map. Please check console for details.");
    }
    
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Add markers to map
  useEffect(() => {
    if (!leafletMapRef.current) return;
    
    const map = leafletMapRef.current;
    
    // Clear existing markers
    if (markersRef.current) {
      markersRef.current.clearLayers();
      markersRef.current.remove();
    }
    
    if (filteredReports.length === 0 && !farmCoords) return;
    
    // Create new marker group
    markersRef.current = L.layerGroup().addTo(map);
    
    const validMarkerPoints: L.LatLngTuple[] = [];
    
    const farmIcon = L.divIcon({
      className: 'custom-farm-marker',
      html: '<div style="background-color: #1d4ed8; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">🏠</div>',
      iconSize: [28, 28],
      popupAnchor: [0, -14],
    });

    filteredReports.forEach(report => {
      const isApproximate = !hasExplicitCoords(report);
      const reportCoords = isApproximate
        ? getReportFallbackCoords(report)
        : [report.latitude!, report.longitude!] as L.LatLngTuple;

      validMarkerPoints.push(reportCoords);
      
      const getColor = (severity: string) => {
        switch (severity) {
          case 'critical': return '#dc2626';
          case 'high': return '#f97316';
          case 'medium': return '#eab308';
          default: return '#22c55e';
        }
      };
      
      const color = getColor(report.severity);
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: ' + color + '; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer;">🐛</div>',
        iconSize: [24, 24],
        popupAnchor: [0, -12],
      });
      
      const popupContent = '<div style="min-width: 200px;">' +
        '<h4 style="margin: 0 0 8px 0; color: #065f46; font-size: 16px;">' + report.pest_name + '</h4>' +
        '<p style="margin: 4px 0; font-size: 13px;"><strong>Crop:</strong> ' + (report.crop_affected || 'N/A') + '</p>' +
        '<p style="margin: 4px 0; font-size: 13px;"><strong>Location:</strong> ' + (report.location_name || 'N/A') + '</p>' +
        (isApproximate ? '<p style="margin: 4px 0; font-size: 13px; color: #9a3412;"><strong>Note:</strong> Approximate location shown on map.</p>' : '') +
        '<p style="margin: 4px 0; font-size: 13px;"><strong>Severity:</strong> <span style="color: ' + color + ';">' + report.severity + '</span></p>' +
        '<p style="margin: 4px 0; font-size: 13px;"><strong>Status:</strong> ' + report.status + '</p>' +
        (report.description ? '<p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">' + report.description.substring(0, 100) + '...</p>' : '') +
        '<button onclick="window.dispatchEvent(new CustomEvent(\'selectReport\', { detail: \'' + report.id + '\' }))" ' +
        'style="margin-top: 10px; padding: 5px 14px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">' +
        'View Details</button>' +
        '</div>';
      
      const marker = L.marker(reportCoords, { icon }).bindPopup(popupContent);
      markersRef.current!.addLayer(marker);
    });
    
    if (farmCoords) {
      const farmMarker = L.marker(farmCoords, { icon: farmIcon })
        .bindPopup('<strong>Your farm location</strong>');
      markersRef.current.addLayer(farmMarker);
      validMarkerPoints.push(farmCoords);
    }

    if (validMarkerPoints.length > 0) {
      const bounds = L.latLngBounds(validMarkerPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
  }, [filteredReports, farmCoords]);

  // Handle report selection from popup
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const report = filteredReports.find(r => r.id === e.detail);
      if (report) setSelectedReport(report);
    };
    window.addEventListener('selectReport' as any, handler);
    return () => window.removeEventListener('selectReport' as any, handler);
  }, [filteredReports]);

  const clearFilters = () => {
    setSelectedProvince('');
    setSelectedSeverity('all');
    setSelectedCrop('all');
    setSearchQuery('');
  };

  const resetMapView = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(farmCoords || DEFAULT_CENTER, farmCoords ? 12 : 7);
    }
  };

  if (loading) {
    return (
      <LoadingProgressBar
        message="Loading outbreak data..."
        isLoading={loading}
        fullScreen={true}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            Zimbabwe Pest Outbreak Map
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            {stats.total} report{stats.total === 1 ? '' : 's'} on map
            {stats.active ? ' • ' + stats.active + ' active' : ''}
            {stats.critical ? ' • ' + stats.critical + ' critical' : ''}
          </p>
          {farmGeocodeError && (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Could not resolve your farm address on the map. The map is still usable for reports with explicit coordinates.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetMapView}
            className="p-2 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 transition"
            title="Reset map view"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Map and Sidebar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-4 gap-0">
          {/* Map Container */}
          <div className="lg:col-span-3 relative">
            <div 
              ref={mapRef} 
              className="h-[500px] sm:h-[600px] w-full bg-gray-100"
              style={{ zIndex: 1 }}
            />
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90">
                <div className="text-center text-red-600 p-4">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <p>{mapError}</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs text-gray-600 shadow-sm z-[1000]">
              <Info className="w-3 h-3 inline mr-1" />
              {filteredReports.length} locations • Click markers for details
            </div>
          </div>

          {/* Sidebar */}
          <div className="border-t lg:border-t-0 lg:border-l border-gray-200 p-4 space-y-4 max-h-[600px] overflow-y-auto">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pest, crop, location..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Province Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Province</label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All provinces</option>
                {provinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Severity</label>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={'px-3 py-1 text-xs rounded-full font-medium transition ' + (selectedSeverity === sev ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
                  >
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Crop Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Crop</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All crops</option>
                {crops.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(selectedProvince || selectedSeverity !== 'all' || selectedCrop !== 'all' || searchQuery) && (
              <button
                onClick={clearFilters}
                className="w-full py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Clear all filters
              </button>
            )}

            {/* Stats */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">On map:</span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Critical:</span>
                <span className="font-semibold text-red-600">{stats.critical}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active:</span>
                <span className="font-semibold text-orange-600">{stats.active}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-2">Severity Legend</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-xs">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs">Low</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">{selectedReport.pest_name}</h3>
              <button onClick={() => setSelectedReport(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className={'px-2 py-1 text-xs rounded-full font-medium ' + (selectedReport.severity === 'critical' ? 'bg-red-100 text-red-700' : selectedReport.severity === 'high' ? 'bg-orange-100 text-orange-700' : selectedReport.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700')}>
                  {selectedReport.severity}
                </span>
                <span className={'px-2 py-1 text-xs rounded-full font-medium ' + (selectedReport.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                  {selectedReport.status}
                </span>
              </div>
              {selectedReport.pest_type && <p className="text-sm"><strong>Type:</strong> {selectedReport.pest_type}</p>}
              {selectedReport.crop_affected && selectedReport.crop_affected !== 'Unknown' && <p className="text-sm"><strong>Crop:</strong> {selectedReport.crop_affected}</p>}
              {selectedReport.location_name && selectedReport.location_name !== 'Not specified' && <p className="text-sm"><strong>Location:</strong> {selectedReport.location_name}</p>}
              {selectedReport.province && selectedReport.province !== 'Not specified' && <p className="text-sm"><strong>Province:</strong> {selectedReport.province}</p>}
              {selectedReport.latitude && selectedReport.longitude && (
                <p className="text-sm"><strong>Coordinates:</strong> {selectedReport.latitude.toFixed(4)}°, {selectedReport.longitude.toFixed(4)}°</p>
              )}
              {selectedReport.description && <p className="text-sm"><strong>Description:</strong> {selectedReport.description}</p>}
              {selectedReport.created_at && <p className="text-sm text-gray-500"><strong>Reported:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PestMap;