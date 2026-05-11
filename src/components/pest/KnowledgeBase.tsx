import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Shield, Leaf, Bug, FlaskConical, Sprout, AlertTriangle, X, Info } from 'lucide-react';

import { KNOWLEDGE_BASE, CROP_TYPES, SEVERITY_COLORS, SEVERITY_DOT_COLORS, type PestInfo } from '@/data/pestData';

const KnowledgeBase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPest, setSelectedPest] = useState<PestInfo | null>(null);

  const pestTypes = useMemo(() => {
    const types = new Set(KNOWLEDGE_BASE.map(p => p.type));
    return Array.from(types).sort();
  }, []);

  const filteredPests = useMemo(() => {
    return KNOWLEDGE_BASE.filter(pest => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = pest.name.toLowerCase().includes(q) ||
          pest.scientificName.toLowerCase().includes(q) ||
          pest.description.toLowerCase().includes(q) ||
          pest.cropAffected.some(c => c.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (selectedCrop && !pest.cropAffected.includes(selectedCrop)) return false;
      if (selectedType && pest.type !== selectedType) return false;
      return true;
    });
  }, [searchQuery, selectedCrop, selectedType]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCrop('');
    setSelectedType('');
  };

  const hasFilters = searchQuery || selectedCrop || selectedType;

  const treatmentTypeIcon = (type: string) => {
    switch (type) {
      case 'organic': return <Leaf className="w-4 h-4 text-green-600" />;
      case 'cultural': return <Sprout className="w-4 h-4 text-blue-600" />;
      case 'biological': return <Bug className="w-4 h-4 text-purple-600" />;
      case 'chemical': return <FlaskConical className="w-4 h-4 text-red-600" />;
      default: return <Leaf className="w-4 h-4 text-gray-600" />;
    }
  };

  const treatmentTypeBadge = (type: string) => {
    switch (type) {
      case 'organic': return 'bg-green-100 text-green-700 border-green-200';
      case 'cultural': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'biological': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'chemical': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Pest Knowledge Base</h2>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Browse {KNOWLEDGE_BASE.length} common Zimbabwean crop pests with treatment guides</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pests..."
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Crops</option>
            {CROP_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Types</option>
            {pestTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center justify-center gap-1 px-3 py-2 sm:py-2.5 text-sm text-gray-600 hover:text-red-600 transition-colors">
              <X className="w-4 h-4" /> <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">{filteredPests.length} pest{filteredPests.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* Pest Detail Modal */}
      {selectedPest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedPest(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{selectedPest.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500 italic">{selectedPest.scientificName}</p>
              </div>
              <button onClick={() => setSelectedPest(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${SEVERITY_COLORS[selectedPest.severity]}`}>
                  <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT_COLORS[selectedPest.severity]}`} />
                  {selectedPest.severity}
                </span>
                <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{selectedPest.type}</span>
                <span className="px-2 sm:px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{selectedPest.season}</span>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Description</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedPest.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Affected Crops</h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {selectedPest.cropAffected.map(crop => (
                    <span key={crop} className="px-2 sm:px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">{crop}</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Damage Symptoms</h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  {selectedPest.damageSymptoms.map((symptom, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      {symptom}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Treatment Options</h4>
                <div className="space-y-2 sm:space-y-3">
                  {selectedPest.treatments.map((treatment, idx) => (
                    <div key={idx} className={`rounded-lg p-3 sm:p-4 border ${
                      treatment.type === 'chemical' ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start gap-2 sm:gap-3">
                        {treatmentTypeIcon(treatment.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <p className="font-medium text-gray-900 text-sm">{treatment.name}</p>
                            <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full border capitalize ${treatmentTypeBadge(treatment.type)}`}>
                              {treatment.type}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">{treatment.description}</p>
                          {treatment.safetyWarning && (
                            <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 rounded border border-red-200">
                              <Shield className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-red-700">{treatment.safetyWarning}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pest Grid */}
      {filteredPests.length === 0 ? (
        <div className="text-center py-10 sm:py-16 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-2">No Pests Found</h3>
          <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredPests.map((pest) => (
            <div
              key={pest.id}
              onClick={() => setSelectedPest(pest)}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="h-32 sm:h-40 bg-gray-200 relative overflow-hidden">
                <img 
                  src={pest.imageUrl} 
                  alt={pest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                  <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_COLORS[pest.severity]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT_COLORS[pest.severity]}`} />
                    <span className="hidden sm:inline">{pest.severity}</span>
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3">
                  <div className="flex flex-wrap gap-1">
                    {pest.cropAffected.slice(0, 2).map(crop => (
                      <span key={crop} className="px-1.5 sm:px-2 py-0.5 bg-white/80 backdrop-blur-sm text-gray-700 rounded text-xs font-medium">{crop}</span>
                    ))}
                    {pest.cropAffected.length > 2 && (
                      <span className="px-1.5 sm:px-2 py-0.5 bg-white/80 backdrop-blur-sm text-gray-500 rounded text-xs">+{pest.cropAffected.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors text-sm sm:text-base">{pest.name}</h3>
                <p className="text-xs text-gray-500 italic mb-1 sm:mb-2">{pest.scientificName}</p>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3">{pest.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{pest.type}</span>
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    {pest.treatments.length} <span className="hidden sm:inline">treatments</span> <Info className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
