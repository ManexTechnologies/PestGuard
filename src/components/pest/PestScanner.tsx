import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Shield, Leaf, FlaskConical, Sprout, Bug } from 'lucide-react';

import { CROP_TYPES, PROVINCES } from '@/data/pestData';
import { recordPestSighting } from '@/lib/api';

import identifyPestLocally from '@/lib/pestIdentification';
import { detectWithYolo } from '@/lib/yoloClassifier';
import { KNOWLEDGE_BASE, type PestInfo } from '@/data/pestData';

// Pest scanning uses client-side inference (YOLO in browser).
const PESTID_ENDPOINT = 'http://localhost/pestguard/backend/api/pestid.php/analyze-pest';

function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // remove parentheses
    .replace(/[^a-z0-9\s]/g, ' ') // punctuation -> space
    .replace(/\s+/g, ' ')
    .trim();
}

function mapYoloLabelToKnowledgeBase(label: string): PestInfo | null {
  const n = normalizeLabel(label);
  if (!n) return null;

  // 1) Exact normalized name match
  const exact = KNOWLEDGE_BASE.find((p) => normalizeLabel(p.name) === n);
  if (exact) return exact;

  // 2) Contains match (handles small training-name variants)
  const contains = KNOWLEDGE_BASE.find((p) => {
    const pn = normalizeLabel(p.name);
    return pn.includes(n) || n.includes(pn);
  });
  if (contains) return contains;

  // 3) Try scientific name partial match
  const sci = KNOWLEDGE_BASE.find((p) => normalizeLabel(p.scientificName).includes(n) || n.includes(normalizeLabel(p.scientificName)));
  if (sci) return sci;

  return null;
}









interface PestMatch {
  name: string;
  scientificName: string;
  type: string;
  confidence: number;
  description: string;
  damageSymptoms: string[];
  lifeCycle?: string;
}

interface TreatmentRec {
  name: string;
  type: string;
  description: string;
  effectiveness: string;
  cost: string;
  safetyWarning?: string;
  applicationTiming?: string;
}

interface IdentificationResult {
  identified: boolean;
  pests: PestMatch[];
  treatments: TreatmentRec[];
  severity: string;
  urgency: string;
  preventionTips: string[];
  additionalNotes: string;
}

interface PestScannerProps {
  onReportSaved?: () => void;
  userId?: number | null;

  onSignInRequired?: () => void;
}


const PestScanner: React.FC<PestScannerProps> = ({ onReportSaved, userId, onSignInRequired }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [cropType, setCropType] = useState('');
  const [province, setProvince] = useState('');
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedTreatment, setExpandedTreatment] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress and convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 800;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        setImagePreview(compressed);
        setImageBase64(compressed);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleIdentify = async () => {
    if (!imageBase64 && !description.trim()) {
      setError('Please upload an image or describe the pest you observed.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      // Prefer YOLO (image-based). If no image is provided, fall back to local TF/KB flow.
      if (imageBase64) {
        const detections = await detectWithYolo(imageBase64);

        const top = detections[0];
        const pests = detections.slice(0, 3).map((d) => {
          const kb = mapYoloLabelToKnowledgeBase(d.label);
          return {
            name: kb?.name ?? d.label,
            scientificName: kb?.scientificName ?? d.label,
            type: kb?.type ?? 'pest',
            confidence: d.confidence,
            description: kb?.description ?? '',
            damageSymptoms: kb?.damageSymptoms ?? [],
          };
        });


        const confidence = top?.confidence ?? 0;
        const severity = confidence >= 85 ? 'critical' : confidence >= 65 ? 'high' : confidence >= 45 ? 'medium' : 'low';
        const urgency =
          severity === 'critical'
            ? 'Immediate action required!'
            : severity === 'high'
              ? 'Urgent action recommended.'
              : severity === 'medium'
                ? 'Action needed within a week.'
                : 'Monitor the situation.';

        const topKB = top ? mapYoloLabelToKnowledgeBase(top.label) : null;
        const treatments = topKB?.treatments?.map((t) => ({
          name: t.name,
          type: t.type,
          description: t.description,
          effectiveness: t.effectiveness,
          cost: t.cost,
          safetyWarning: t.safetyWarning,
        })) ?? [];

        const mapped: IdentificationResult = {
          identified: pests.length > 0 && (top?.confidence ?? 0) > 0,
          pests,
          treatments,
          severity,
          urgency,
          preventionTips: [
            'Take a clearer photo focusing on the pest or the damaged plant part.',
            'Monitor affected plants and remove heavily infested material.',
            'Use crop-appropriate integrated pest management practices.',
          ],
          additionalNotes: top
            ? `YOLO prediction: ${top.label} (confidence ${top.confidence}%).`
            : 'No confident detection returned by YOLO.',
        };

          setResult(mapped);
        return;
      }

      // Fallback: TensorFlow.js + knowledge-base matching (runs client-side)
      const local = await identifyPestLocally({
        imageBase64: imageBase64 || undefined,
        description: description || undefined,
        cropType: cropType || undefined,
      });

      setResult(local as unknown as IdentificationResult);
    } catch (err: any) {
      setError(err.message || 'Failed to identify pest.');
    } finally {
      setLoading(false);
    }
  };


  const handleSaveReport = async () => {
    if (!result || !result.pests?.length) return;

    setSaving(true);
    try {
      const topPest = result.pests[0];
      const reportData: any = {
        pest_name: topPest.name,
        pest_type: topPest.type,
        confidence: topPest.confidence,
        crop_affected: cropType || 'Unknown',
        severity: result.severity || 'medium',
        latitude: -17.8292 + (Math.random() - 0.5) * 2,
        longitude: 31.0522 + (Math.random() - 0.5) * 2,
        location: locationName || 'Not specified',
        province: province || 'Not specified',
        description: description || topPest.description,
        image_url: imagePreview || null,
      };
      if (userId) reportData.user_id = Number(userId);

      
      await recordPestSighting(reportData);

      setSaved(true);
      onReportSaved?.();
    } catch (err: any) {
      setError('Failed to save report: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setImageBase64(null);
    setDescription('');
    setCropType('');
    setProvince('');
    setLocationName('');
    setResult(null);
    setError(null);
    setSaved(false);
    setExpandedTreatment(null);
  };

  const treatmentTypeIcon = (type: string) => {
    switch (type) {
      case 'organic': return <Leaf className="w-4 h-4 text-green-600" />;
      case 'cultural': return <Sprout className="w-4 h-4 text-blue-600" />;
      case 'biological': return <Bug className="w-4 h-4 text-purple-600" />;
      case 'chemical': return <FlaskConical className="w-4 h-4 text-red-600" />;

      default: return <Leaf className="w-4 h-4 text-gray-600" />;
    }
  };

  const treatmentTypeBg = (type: string) => {
    switch (type) {
      case 'organic': return 'bg-green-50 border-green-200 text-green-700';
      case 'cultural': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'biological': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'chemical': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const effectivenessBar = (level: string) => {
    const widths: Record<string, string> = { high: 'w-full', medium: 'w-2/3', low: 'w-1/3' };
    const colors: Record<string, string> = { high: 'bg-green-500', medium: 'bg-yellow-500', low: 'bg-red-400' };
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${colors[level] || 'bg-gray-300'} ${widths[level] || 'w-1/3'}`} />
        </div>
        <span className="text-xs text-gray-500 capitalize">{level}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Auth Required Banner */}
      {!userId && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-amber-900 text-base sm:text-lg mb-2">Sign In Required</h3>
            <p className="text-amber-800 text-sm mb-3 sm:mb-4">
              To upload crop images and save your pest detection reports, you need to sign in to your account.
            </p>
            <button
              onClick={onSignInRequired}
              className="px-4 sm:px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-sm min-h-[44px]"
            >
              Sign In Now
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Check Your Crops</h2>
          <p className="text-gray-500 text-sm mt-1">Upload a photo (AI pest identification is disabled)</p>

        </div>
        {result && (
          <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-h-[44px]">
            New Scan
          </button>
        )}
      </div>

      {!result ? (
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Image Upload */}
          <div className="space-y-3 sm:space-y-4">
            <label className="block text-sm font-medium text-gray-700">Pest Photo</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-green-200 bg-green-50">
                <img src={imagePreview} alt="Pest preview" className="w-full h-40 sm:h-48 md:h-64 object-cover" />
                <button
                  onClick={() => { setImagePreview(null); setImageBase64(null); }}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div
                  onClick={() => { if (userId) { fileInputRef.current?.click(); } else { onSignInRequired?.(); } }}
                  className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-all group h-40 sm:h-48 md:h-64 flex flex-col items-center justify-center ${
                    userId
                      ? 'border-gray-300 hover:border-green-400 hover:bg-green-50/50'
                      : 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600" />
                  </div>
                  <p className="font-medium text-gray-700 mb-1 text-sm sm:text-base">Take or Upload Photo</p>
                  <p className="text-xs sm:text-sm text-gray-500">Tap to open camera or choose from gallery</p>
                  <p className="text-xs text-gray-400 mt-2 hidden sm:block">JPG, PNG up to 10MB - auto-compressed for fast upload</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-hidden="true"
                />
              </>
            )}
          </div>

          {/* Description & Details */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Describe What You See</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Small green caterpillars eating maize leaves, sawdust-like material in leaf whorls..."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Affected Crop</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white min-h-[44px]"
              >
                <option value="">Select crop type...</option>
                {CROP_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Province</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white min-h-[44px]"
                >
                  <option value="">Select...</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location Name</label>
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Mazowe Farm"
                  className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm min-h-[44px]"
                />
              </div>
            </div>

            <button
              onClick={() => { if (!userId) { onSignInRequired?.(); return; } handleIdentify(); }}
              disabled={loading || (!imageBase64 && !description.trim()) || !userId}
              className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-sm sm:text-base hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-200 hover:shadow-xl min-h-[48px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Analyzing Pest...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  {imageBase64 ? 'Identify Pest from Image' : 'Identify Pest'}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Results Section */
        <div className="space-y-4 sm:space-y-6">
          {/* Show minimal message if no pest identified */}
          {!result.identified ? (
            <div className="bg-blue-50 rounded-xl p-4 sm:p-5 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 text-sm sm:text-base">{result.urgency}</h3>
                  <p className="text-xs sm:text-sm text-blue-800 mt-2">{result.additionalNotes}</p>
                  {result.preventionTips?.length > 0 && (
                    <ul className="space-y-1 sm:space-y-2 mt-3">
                      {result.preventionTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-blue-700">
                          <span className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Severity Banner */}
              <div className={`rounded-xl p-4 sm:p-5 border ${
                result.severity === 'critical' ? 'bg-red-50 border-red-200' :
                result.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                result.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertTriangle className={`w-5 h-5 sm:w-6 sm:h-6 mt-0.5 flex-shrink-0 ${
                    result.severity === 'critical' ? 'text-red-600' :
                    result.severity === 'high' ? 'text-orange-600' :
                    result.severity === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`} />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 capitalize text-sm sm:text-base">Severity: {result.severity}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{result.urgency}</p>
                  </div>
                </div>
              </div>

          {/* Pest Matches - Only show if pests were identified */}
          {result.identified && result.pests?.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Identified Pests</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {result.pests?.map((pest, idx) => (
                  <div key={idx} className={`bg-white rounded-xl p-4 sm:p-5 border shadow-sm ${idx === 0 ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-200'}`}>
                    {idx === 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium mb-2 sm:mb-3">
                        <CheckCircle className="w-3 h-3" /> Best Match
                      </span>
                    )}
                    <h4 className="font-bold text-gray-900 text-base sm:text-lg">{pest.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-500 italic mb-2">{pest.scientificName}</p>
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pest.confidence > 80 ? 'bg-green-500' : pest.confidence > 60 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                          style={{ width: `${pest.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">{pest.confidence}%</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{pest.description}</p>
                    {pest.damageSymptoms?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Damage Symptoms:</p>
                        <ul className="space-y-1">
                          {pest.damageSymptoms.map((s, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-gray-400 mt-1 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Pest Identified Message */}
          {!result.identified && (
            <div className="bg-blue-50 rounded-xl p-4 sm:p-5 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 text-sm sm:text-base">{result.urgency}</h3>
                  <p className="text-xs sm:text-sm text-blue-800 mt-2">{result.additionalNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Treatments */}
          {result.identified && result.treatments?.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Treatment Recommendations</h3>
              <div className="space-y-2 sm:space-y-3">
                {result.treatments.map((treatment, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedTreatment(expandedTreatment === idx ? null : idx)}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-shrink-0">{treatmentTypeIcon(treatment.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{treatment.name}</p>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-3 mt-1">
                          <span className={`inline-flex px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${treatmentTypeBg(treatment.type)}`}>
                            {treatment.type}
                          </span>
                          <div className="hidden sm:block">{effectivenessBar(treatment.effectiveness)}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        treatment.cost === 'low' ? 'bg-green-100 text-green-700' :
                        treatment.cost === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {treatment.cost}
                      </span>
                      {expandedTreatment === idx ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </button>
                    {expandedTreatment === idx && (
                      <div className="px-3 sm:px-5 pb-3 sm:pb-4 border-t border-gray-100 pt-2 sm:pt-3">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">{treatment.description}</p>
                        {treatment.applicationTiming && (
                          <p className="text-xs text-blue-600 mb-2">Timing: {treatment.applicationTiming}</p>
                        )}
                        {treatment.safetyWarning && (
                          <div className="flex items-start gap-2 p-2 sm:p-3 bg-red-50 rounded-lg border border-red-200 mt-2">
                            <Shield className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-red-700">{treatment.safetyWarning}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prevention Tips */}
          {result.identified && result.preventionTips?.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 sm:p-5 border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" /> Prevention Tips
              </h3>
              <ul className="space-y-1 sm:space-y-2">
                {result.preventionTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-green-700">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Notes */}
          {result.identified && result.additionalNotes && (
            <div className="bg-blue-50 rounded-xl p-4 sm:p-5 border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-800">{result.additionalNotes}</p>
            </div>
          )}

              {/* Save Report - Only show if pest was identified */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                {result.identified && !saved ? (
                  <button
                    onClick={handleSaveReport}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-all min-h-[48px] text-sm sm:text-base"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Report'}
                  </button>
                ) : result.identified && saved ? (
                  <div className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-green-100 text-green-700 rounded-xl font-medium min-h-[48px]">
                    <CheckCircle className="w-4 h-4" />
                    Report Saved Successfully
                  </div>
                ) : null}
              </div>
            </>
          )}

          {/* Scan Another Button - Always show */}
          <button
            onClick={handleReset}
            className="w-full px-4 sm:px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all min-h-[48px] text-sm sm:text-base"
          >
            Scan Another Pest
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Identification Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <p className="text-xs text-red-500 mt-2">Please try again. A simple photo of the affected crop area or a description of the pest symptoms can help us identify it. If the problem persists, contact your local extension officer.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PestScanner;
