import React, { useState, useRef, useCallback } from 'react';
import {
  Camera,
  Upload,
  X,
  AlertTriangle,
  CheckCircle,
  Shield,
  Leaf,
  FlaskConical,
  Sprout,
  Bug,
  ChevronDown,
  Wind,
  Phone,
  TrendingUp,
  SearchX,
  BookOpen,
} from 'lucide-react';

import {
  CROP_TYPES,
  ALL_PESTS,
  type PestInfo,
} from '@/data/pestData';

import { recordPestSighting } from '@/lib/api';
import identifyPestLocally from '@/lib/pestIdentification';
import { detectWithYolo } from '@/lib/yoloClassifier';
import { fetchPestInfo, type PestDetail } from '@/lib/pestInfoApi';

/* ─────────────────────────────────────────────────────────────── */

/**
 * Normalise a pest label for comparison:
 * - lowercase
 * - strip parenthetical suffixes like "(Hendel)"
 * - collapse whitespace
 * - remove non-alphanumeric except spaces
 */
function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a set of tokens from a normalised string.
 * Short tokens (≤ 2 chars) are excluded to avoid noise.
 */
function tokenSet(s: string): Set<string> {
  return new Set(normalizeLabel(s).split(' ').filter((t) => t.length > 2));
}

/**
 * Score how well a YOLO label matches a PestInfo entry.
 * Returns a value in [0, 1]:
 *   1.0  = exact normalised match on name or scientific name
 *   0.8+ = all YOLO tokens found in pest name
 *   0.6+ = majority of YOLO tokens found in pest name
 *   0    = no overlap
 */
function scorePestMatch(yoloLabel: string, pest: PestInfo): number {
  const normLabel = normalizeLabel(yoloLabel);
  const normName  = normalizeLabel(pest.name);
  const normSci   = normalizeLabel(pest.scientificName);

  // Exact match
  if (normLabel === normName || normLabel === normSci) return 1.0;

  // Substring containment
  if (normName.includes(normLabel) || normLabel.includes(normName)) return 0.9;
  if (normSci.includes(normLabel)  || normLabel.includes(normSci))  return 0.85;

  // Token overlap (Jaccard-style)
  const labelTokens = tokenSet(yoloLabel);
  const nameTokens  = tokenSet(pest.name);
  const sciTokens   = tokenSet(pest.scientificName);

  if (labelTokens.size === 0) return 0;

  const nameIntersect = [...labelTokens].filter((t) => nameTokens.has(t)).length;
  const sciIntersect  = [...labelTokens].filter((t) => sciTokens.has(t)).length;

  const nameScore = nameIntersect / Math.max(labelTokens.size, nameTokens.size);
  const sciScore  = sciIntersect  / Math.max(labelTokens.size, sciTokens.size);

  return Math.max(nameScore, sciScore);
}

/**
 * Find the best-matching PestInfo for a YOLO label.
 * Returns null when no match exceeds the threshold — this means
 * the detected class is NOT in the IP102 knowledge base.
 */
const MATCH_THRESHOLD = 0.35; // tunable — lower = more permissive
const CLOSE_MATCH_THRESHOLD = 0.15; // still informative for candidate suggestions

export function matchIP102Pest(yoloLabel: string): PestInfo | null {
  let bestPest:  PestInfo | null = null;
  let bestScore  = 0;

  for (const pest of ALL_PESTS) {
    const score = scorePestMatch(yoloLabel, pest);
    if (score > bestScore) {
      bestScore = score;
      bestPest  = pest;
    }
  }

  if (bestScore >= MATCH_THRESHOLD && bestPest) {
    return bestPest;
  }

  return null;
}

export function findClosestPestMatches(yoloLabel: string, limit = 3): PestInfo[] {
  return ALL_PESTS
    .map((pest) => ({ pest, score: scorePestMatch(yoloLabel, pest) }))
    .filter((item) => item.score >= CLOSE_MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.pest);
}

/* ─────────────────────────────────────────────────────────────── */

interface PestMatch {
  name: string;
  scientificName: string;
  type: string;
  confidence: number;
  description: string;
  damageSymptoms: string[];
  affectedCrops?: string[];
  favourableConditions?: string;
  spreadMechanism?: string;
  emergencyThreshold?: string;
  symptomsStages?: { early: string[]; advanced: string[]; severe: string[] };
}

interface TreatmentRec {
  name: string;
  type: string;
  description: string;
  effectiveness: string;
  cost: string;
  urgency: string;
  safetyWarning?: string;
}

interface IdentificationResult {
  identified: boolean;
  pests: PestMatch[];
  treatments: TreatmentRec[];
  severity: string;
  urgency: string;
  preventionTips: string[];
}

/**
 * Separate result type for when YOLO fires but no IP102 match is found.
 * This preserves what YOLO detected so we can display it to the user
 * without falsely attributing it to a pest in the knowledge base.
 */
interface NotInDatasetResult {
  kind: 'not_in_dataset';
  detectedLabels: string[]; // raw YOLO labels that triggered this
  closestMatches: PestInfo[];
}

type ScanResult =
  | { kind: 'identified'; data: IdentificationResult }
  | NotInDatasetResult
  | { kind: 'no_detection' };

interface PestScannerProps {
  onReportSaved?: () => void;
  userId?: number | null;
  onSignInRequired?: () => void;
}

/* ─────────────────────────────────────────────────────────────── */

// Typography scale
const sectionHeading = 'text-sm font-semibold uppercase tracking-wide text-green-800 mb-3';

const TreatmentIcon = ({ type }: { type: string }) => {
  const cls = 'w-4 h-4';
  const map: Record<string, JSX.Element> = {
    organic:    <Leaf         className={`${cls} text-green-600`}  />,
    cultural:   <Sprout       className={`${cls} text-teal-600`}   />,
    biological: <Bug          className={`${cls} text-sky-600`}    />,
    chemical:   <FlaskConical className={`${cls} text-purple-600`} />,
  };
  return map[type] ?? <Leaf className={`${cls} text-gray-400`} />;
};

function typeStyle(type: string) {
  switch (type) {
    case 'chemical':   return { text: '#6d28d9', bg: 'rgba(109,40,217,0.09)',  border: 'rgba(109,40,217,0.22)', label: 'Chemical'   };
    case 'biological': return { text: '#0369a1', bg: 'rgba(3,105,161,0.09)',   border: 'rgba(3,105,161,0.22)',  label: 'Biological' };
    case 'organic':    return { text: '#15803d', bg: 'rgba(21,128,61,0.09)',   border: 'rgba(21,128,61,0.22)',  label: 'Organic'    };
    case 'cultural':   return { text: '#0f766e', bg: 'rgba(15,118,110,0.09)', border: 'rgba(15,118,110,0.22)', label: 'Cultural'   };
    default:           return { text: '#6b7280', bg: 'rgba(107,114,128,0.09)',border: 'rgba(107,114,128,0.22)',label: type         };
  }
}

function urgencyStyle(u: string) {
  const up = u.toUpperCase();
  if (up.includes('HIGH') || up.includes('IMMEDIATE')) return { text: '#991b1b', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.28)',  label: 'High Urgency'   };
  if (up.includes('MEDIUM'))                           return { text: '#92400e', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.28)', label: 'Medium Urgency' };
  return                                                { text: '#14532d', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.28)',  label: 'Low Urgency'    };
}

function effBar(level: string) {
  const pctMatch = level?.match(/(\d+)/);
  if (pctMatch) {
    const pct = parseInt(pctMatch[1], 10);
    return { pct, color: pct >= 70 ? '#16a34a' : pct >= 45 ? '#d97706' : '#ef4444' };
  }
  switch (level?.toLowerCase()) {
    case 'high':   return { pct: 88, color: '#16a34a' };
    case 'medium': return { pct: 55, color: '#d97706' };
    case 'low':    return { pct: 26, color: '#ef4444' };
    default:       return { pct: 40, color: '#9ca3af' };
  }
}

function severityBadge(s: string) {
  switch (s.toLowerCase()) {
    case 'critical': return 'bg-red-200 text-red-900 border border-red-400';
    case 'high':     return 'bg-red-100 text-red-800 border border-red-200';
    case 'medium':   return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    default:         return 'bg-green-100 text-green-800 border border-green-200';
  }
}

function confidenceBadge(c: number) {
  if (c >= 70) return 'bg-green-100 text-green-800 border border-green-200';
  if (c >= 40) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  return 'bg-red-100 text-red-800 border border-red-200';
}

/* ─────────────────────────────────────────────────────────────── */

const PestScanner: React.FC<PestScannerProps> = ({
  onReportSaved,
  userId,
  onSignInRequired,
}) => {
  const [imagePreview, setImagePreview]               = useState<string | null>(null);
  const [imageBase64, setImageBase64]                 = useState<string | null>(null);
  const [description, setDescription]                 = useState('');
  const [cropType, setCropType]                       = useState('');
  const [loading, setLoading]                         = useState(false);
  const [result, setResult]                           = useState<IdentificationResult | null>(null);
  const [scanResult, setScanResult]                   = useState<ScanResult | null>(null);
  const [pestDetail, setPestDetail]                   = useState<PestDetail | null>(null);
  const [notInDatasetInfo, setNotInDatasetInfo]       = useState<PestDetail | null>(null);
  const [notInDatasetInfoLoading, setNotInDatasetInfoLoading] = useState(false);
  const [error, setError]                             = useState<string | null>(null);
  const [saving, setSaving]                           = useState(false);
  const [saved, setSaved]                             = useState(false);
  const [expandedTreatment, setExpandedTreatment]     = useState<number | null>(null);
  const [imageLoading, setImageLoading]               = useState(false);
  const [activeSymptomsStage, setActiveSymptomsStage] = useState(0);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  /* ── Image compression ──────────────────────────────────────── */
  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 800;
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) { height = (height / width) * maxSize; width = maxSize; }
            else { width = (width / height) * maxSize; height = maxSize; }
          }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (JPEG, PNG, or WebP).'); return; }
    if (file.size > 10 * 1024 * 1024)   { setError('Image size should be less than 10MB.'); return; }
    setImageLoading(true); setError(null);
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed); setImageBase64(compressed);
      setShowImageSourceModal(false);
    } catch { setError('Failed to process image. Please try another file.'); }
    finally { setImageLoading(false); }
  }, [compressImage]);

  /* ── Camera capture ──────────────────────────────────────── */
  const handleCameraCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please capture an image using your camera.'); return; }
    setImageLoading(true); setError(null);
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed); setImageBase64(compressed);
      setShowImageSourceModal(false);
    } catch { setError('Failed to process camera image. Please try again.'); }
    finally { setImageLoading(false); }
  }, [compressImage]);

  /* ── Core identification pipeline ──────────────────────────── */
  const handleIdentify = useCallback(async () => {
    if (!imageBase64 && !description.trim()) {
      setError('Please upload an image or describe the pest symptoms.'); return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setScanResult(null);
    setPestDetail(null);

    try {
      /* ── IMAGE PATH: YOLO → IP102 matching ─────────────────── */
      if (imageBase64) {
        const detections = await detectWithYolo(imageBase64);

        // YOLO returned nothing at all
        if (!detections?.length) {
          setScanResult({ kind: 'no_detection' });
          setLoading(false);
          return;
        }

        // Filter by minimum confidence
        const valid = detections.filter((d) => d.confidence >= 35);

        if (!valid.length) {
          setScanResult({ kind: 'no_detection' });
          setLoading(false);
          return;
        }

        // Try to match each detection to the IP102 knowledge base
        const matched = valid
          .map((det) => {
            const pestInfo = matchIP102Pest(det.label);
            return { det, pestInfo };
          })
          .filter((item) => item.pestInfo !== null) as {
            det: { label: string; confidence: number };
            pestInfo: PestInfo;
          }[];

        // ── NO IP102 MATCH: pest detected but not in our dataset ──
        if (matched.length === 0) {
          const detectedLabels = valid.map((d) => d.label);
          const closestMatches = findClosestPestMatches(detectedLabels[0]);
          setScanResult({
            kind: 'not_in_dataset',
            detectedLabels,
            closestMatches,
          });
          setNotInDatasetInfo(null);
          setNotInDatasetInfoLoading(true);
          fetchPestInfo(detectedLabels[0])
            .then((info) => { if (info) setNotInDatasetInfo(info); })
            .catch(() => undefined)
            .finally(() => setNotInDatasetInfoLoading(false));
          setLoading(false);
          return;
        }

        // Sort by YOLO confidence (already sorted, but be explicit)
        matched.sort((a, b) => b.det.confidence - a.det.confidence);

        const primary  = matched[0];
        const topLabel = primary.det.label;
        const topPest  = primary.pestInfo;

        // Build PestMatch objects for top 3
        const pests: PestMatch[] = matched.slice(0, 3).map(({ det, pestInfo }) => ({
          name:                 pestInfo.name,
          scientificName:       pestInfo.scientificName,
          type:                 pestInfo.type,
          confidence:           det.confidence,
          description:          pestInfo.description,
          damageSymptoms:       pestInfo.damageSymptoms,
          affectedCrops:        pestInfo.affectedCrops ?? pestInfo.cropAffected ?? [],
          favourableConditions: (pestInfo as any).favourableConditions,
          spreadMechanism:      (pestInfo as any).spreadMechanism,
          emergencyThreshold:   (pestInfo as any).emergencyThreshold,
          symptomsStages:       (pestInfo as any).symptomsStages,
        }));

        const severity = (topPest as any).severity as string
          || (primary.det.confidence >= 75 ? 'high'
            : primary.det.confidence >= 50 ? 'medium'
            : 'low');

        const treatments: TreatmentRec[] = (topPest.treatments ?? []).map((t: any) => ({
          ...t,
          urgency: t.urgency ?? (
            severity === 'critical' ? 'IMMEDIATE URGENCY'
            : severity === 'high'   ? 'HIGH URGENCY'
            : severity === 'medium' ? 'MEDIUM URGENCY'
            :                         'LOW URGENCY'
          ),
        }));

        const identified: IdentificationResult = {
          identified:      true,
          pests,
          severity,
          urgency:
            severity === 'high'   ? 'Immediate action recommended to prevent crop damage.'
            : severity === 'medium' ? 'Monitor closely and consider treatment.'
            :                         'Low urgency, but keep observing.',
          treatments,
          preventionTips: topPest.preventionTips ?? [
            'Maintain adequate soil moisture — drought stress triggers outbreaks',
            'Avoid dusty conditions around field margins',
            'Inspect transplants before introducing to field',
            'Preserve natural enemies by minimising broad-spectrum insecticide use',
            'Scout weekly during dry season on susceptible crops',
          ],
        };

        setResult(identified);
        setScanResult({ kind: 'identified', data: identified });
        fetchPestInfo(topLabel).then((d) => d && setPestDetail(d)).catch(console.error);
        return;
      }

      /* ── TEXT/DESCRIPTION PATH ──────────────────────────────── */
      const local = await identifyPestLocally({ description, cropType });
      const localResult = local as unknown as IdentificationResult;
      setResult(localResult);
      setScanResult({ kind: 'identified', data: localResult });

    } catch (err: any) {
      console.error('Identification error:', err);
      setError(err.message || 'Failed to identify pest. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [imageBase64, description, cropType]);

  /* ── Save report ────────────────────────────────────────────── */
  const handleSaveReport = useCallback(async () => {
    if (!result?.pests?.length) { setError('No pest data to save.'); return; }
    if (!userId && onSignInRequired) { onSignInRequired(); return; }
    setSaving(true); setError(null);
    try {
      const pest = result.pests[0];
      await recordPestSighting({
        pest_name:    pest.name,
        pest_type:    pest.type,
        confidence:   pest.confidence,
        crop_affected: cropType || 'Unknown',
        severity:     result.severity,
        description:  pest.description,
        image_url:    imagePreview,
        user_id:      userId,
      } as any);
      setSaved(true); onReportSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save report. Please try again.');
    } finally { setSaving(false); }
  }, [result, userId, cropType, imagePreview, onReportSaved, onSignInRequired]);

  const handleReset = useCallback(() => {
    setImagePreview(null); setImageBase64(null); setDescription(''); setCropType('');
    setResult(null); setScanResult(null); setPestDetail(null); setNotInDatasetInfo(null); setNotInDatasetInfoLoading(false); setError(null); setSaved(false);
    setExpandedTreatment(null); setActiveSymptomsStage(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /* ── Helpers ────────────────────────────────────────────────── */
  const showResults = result !== null;
  const showNotInDataset = scanResult?.kind === 'not_in_dataset';
  const showNoDetection  = scanResult?.kind === 'no_detection';
  const detectedLabel = showNotInDataset ? ((scanResult as NotInDatasetResult)?.detectedLabels?.[0] ?? '') : '';

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-5 relative">

        {/* Decorative blobs */}
        <div className="absolute top-0 -right-20 w-80 h-80 bg-green-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />

        {/* Page header */}
        <div className="relative z-10 bg-white/50 backdrop-blur-xl border border-white/70 rounded-2xl px-6 py-5 shadow-lg">
          <h1 className="text-xl font-bold text-green-900">Crop Pest Scanner</h1>
          <p className="text-sm text-green-700 mt-0.5">
            Upload crop photos to identify pests instantly and get treatment recommendations
          </p>
        </div>

        {/* ── Upload form ── */}
        {!showResults && !showNotInDataset && !showNoDetection ? (
          <div className="relative z-10 bg-white/50 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-lg">
            <div className="grid md:grid-cols-2 gap-6">

              {/* Image upload */}
              <div>
                <label className="block text-sm font-semibold text-green-800 mb-2">Crop Image</label>
                {imagePreview ? (
                  <div className="relative group">
                    <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-xl border border-white/70">
                      <img src={imagePreview} alt="Crop preview" className="w-full h-64 object-cover rounded-lg" />
                    </div>
                    <button
                      onClick={() => { setImagePreview(null); setImageBase64(null); if (fileInputRef.current) fileInputRef.current.value = ''; if (cameraInputRef.current) cameraInputRef.current.value = ''; }}
                      className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      role="button" tabIndex={0}
                      onClick={() => setShowImageSourceModal(true)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowImageSourceModal(true); }}
                      className="border-2 border-dashed border-green-300 bg-white/30 backdrop-blur-sm hover:bg-white/50 transition-all rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer"
                    >
                      {imageLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2 text-green-700">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600 font-semibold">
                            ...
                          </div>
                          <span className="text-sm font-medium">Loading image...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 shadow">
                            <Camera className="w-8 h-8 text-green-600" />
                          </div>
                          <p className="font-semibold text-green-900 text-sm">Upload Crop Photo</p>
                          <p className="text-xs text-green-600 mt-1">Click to take photo or upload from gallery</p>
                        </>
                      )}
                    </div>

                    {/* Image source selection modal */}
                    {showImageSourceModal && (
                      <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full animate-in slide-in-from-bottom md:slide-in-from-center">
                          <div className="p-6 space-y-3">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Image Source</h3>
                            <button
                              onClick={() => cameraInputRef.current?.click()}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 hover:from-blue-100 hover:to-blue-150 transition-all text-left"
                            >
                              <Camera className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-gray-900">Take Photo</p>
                                <p className="text-xs text-gray-600">Use your device camera</p>
                              </div>
                            </button>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200 hover:from-green-100 hover:to-green-150 transition-all text-left"
                            >
                              <Upload className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-gray-900">Choose from Gallery</p>
                                <p className="text-xs text-gray-600">Select from your device storage</p>
                              </div>
                            </button>
                            <button
                              onClick={() => setShowImageSourceModal(false)}
                              className="w-full px-4 py-3 rounded-xl text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-green-800 mb-1.5">Pest Description (Optional)</label>
                  <textarea
                    rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe symptoms, location on plant, damage patterns..."
                    className="w-full px-3 py-2.5 rounded-xl border border-green-200 bg-white/50 backdrop-blur-sm text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-400 outline-none transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-green-800 mb-1.5">Crop Type</label>
                  <select
                    value={cropType} onChange={(e) => setCropType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-green-200 bg-white/50 backdrop-blur-sm text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-400 outline-none transition-all"
                  >
                    <option value="">Select crop type (optional)</option>
                    {CROP_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleIdentify} disabled={loading || imageLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <><Upload className="w-4 h-4" />Analysing image...</>
                    : <><Upload className="w-4 h-4" />Identify Pest</>}
                </button>
              </div>
            </div>
          </div>

        ) : showNoDetection ? (
          /* ── NO DETECTION STATE ─────────────────────────────── */
          <div className="relative z-10 space-y-4">
            <div className="bg-white/55 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {imagePreview && (
                  <div className="flex-shrink-0 w-full sm:w-40 h-36 rounded-xl overflow-hidden shadow-md opacity-60">
                    <img src={imagePreview} alt="Uploaded" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <SearchX className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">No Pest Detected</h2>
                      <p className="text-sm text-amber-700 font-medium">Image analysis inconclusive</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Our model couldn't detect a recognisable pest in this image with sufficient confidence.
                    This can happen when the image is blurry, taken from too far away, or the pest isn't
                    clearly visible against the background.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Tips for better results</p>
                    <ul className="space-y-1.5">
                      {[
                        'Take a close-up photo of the affected plant area',
                        'Ensure good lighting — avoid shadows across the pest',
                        'Hold the camera steady to avoid motion blur',
                        'Try to capture the pest directly, not just the damage',
                        'If no image is available, use the description field below',
                      ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                          <div className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleReset}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
              >
                <Camera className="w-4 h-4" />
                Try Another Photo
              </button>
            </div>
          </div>

        ) : showNotInDataset ? (
          /* ── NOT IN IP102 DATASET STATE ─────────────────────── */
          <div className="relative z-10 space-y-4">
            <div className="bg-white/55 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {imagePreview && (
                  <div className="flex-shrink-0 w-full sm:w-40 h-36 rounded-xl overflow-hidden shadow-md">
                    <img src={imagePreview} alt="Uploaded" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <SearchX className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Detected as {detectedLabel || 'an unknown species'}
                      </h2>
                    </div>
                  </div>

                  {/* Show what YOLO detected, without attributing it to a wrong pest */}
                  {(scanResult as NotInDatasetResult).detectedLabels?.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <p className="w-full text-xs font-semibold text-gray-500 uppercase tracking-wide">Detected as</p>
                      {(scanResult as NotInDatasetResult).detectedLabels.map((lbl, i) => (
                        <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                          {lbl}
                        </span>
                      ))}
                    </div>
                  )}


                  {notInDatasetInfoLoading && (
                    <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      Fetching additional information for the detected species...
                    </div>
                  )}

                  {notInDatasetInfo ? (
                    <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Detected species info</p>
                          <h3 className="text-lg font-semibold text-green-900">
                            {notInDatasetInfo.name}
                            <span className="ml-2 text-sm text-gray-600">({notInDatasetInfo.scientificName})</span>
                          </h3>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${severityBadge(notInDatasetInfo.severity)}`}>
                          {notInDatasetInfo.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-3">{notInDatasetInfo.description}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pest type</p>
                          <p className="text-sm text-gray-700">{notInDatasetInfo.type || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Affected crops</p>
                          <p className="text-sm text-gray-700">{notInDatasetInfo.affectedCrops.join(', ') || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Damage symptoms</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-2">
                          {notInDatasetInfo.damageSymptoms.map((symptom, index) => (
                            <li key={index}>{symptom}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recommended treatment</p>
                        <p className="text-sm text-gray-700">{notInDatasetInfo.recommendedTreatment}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prevention tips</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-2">
                          {notInDatasetInfo.preventionTips.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : !notInDatasetInfoLoading && (
                    <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      <p className="font-semibold text-gray-800">More details are unavailable</p>
                      <p className="mt-2">
                        We attempted to retrieve additional pest details for <strong>{detectedLabel || 'the detected species'}</strong>,
                        but the lookup was not successful. This can happen when the label is outside our current pest dataset,
                        or when the external information service is unavailable.
                      </p>
                      <div className="mt-3 space-y-2">
                        <p className="font-semibold">What you can do next</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Use the <strong>Pest Library</strong> to search by crop, pest type, or scientific name.</li>
                          <li>Try the description-based identifier with damage symptoms and plant details.</li>
                          <li>Capture a clearer close-up image if possible, focusing on the pest body and damage.</li>
                          <li>Contact a local agricultural extension officer if you need expert confirmation.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {(scanResult as NotInDatasetResult)?.closestMatches?.length > 0 && (
                    <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-yellow-800">Closest library matches</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {(scanResult as NotInDatasetResult).closestMatches.map((match, index) => (
                          <div key={match.id || index} className="rounded-xl border border-yellow-100 bg-white p-3">
                            <p className="text-sm font-semibold text-yellow-900">{match.name}</p>
                            <p className="text-xs text-gray-600">{match.scientificName}</p>
                            <p className="text-xs text-gray-500 mt-2">Type: {match.type}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">What you can do</p>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                          Browse the <strong>Pest Library</strong> (Learn tab) to manually look up pests by name, crop, or type.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Bug className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                          Try using the <strong>description field</strong> to describe symptoms — our text-based identifier covers a broader range of pests.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Phone className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                          Contact an <strong>AGRITEX agricultural extension officer</strong> for expert identification of uncommon or exotic pests.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description fallback — prefill and let them try text-based ID */}
            <div className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-lg">
              <p className="text-sm font-semibold text-green-800 mb-3">Try Description-Based Identification</p>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the pest or symptoms you can see — colour, size, damage pattern, location on plant..."
                className="w-full px-3 py-2.5 rounded-xl border border-green-200 bg-white/50 backdrop-blur-sm text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-400 outline-none transition-all resize-none mb-3"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleIdentify}
                  disabled={loading || !description.trim()}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-md"
                >
                  {loading ? <><Bug className="w-4 h-4" />Analysing...</> : <><Bug className="w-4 h-4" />Identify by Description</>}
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 min-w-[140px] px-5 py-3 rounded-xl font-semibold text-sm text-green-900 bg-white/60 border border-white/80 hover:bg-white/80 transition-all"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>

        ) : (
          /* ── IDENTIFIED RESULTS ─────────────────────────────── */
          <div className="relative z-10 space-y-4">

            {/* ── HERO CARD ── */}
            <div className="bg-white/55 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row gap-5">
                {imagePreview && (
                  <div className="flex-shrink-0 w-full sm:w-44 h-40 rounded-xl overflow-hidden shadow-md">
                    <img src={imagePreview} alt="Scanned pest" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-green-600 rounded-full" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-green-600">Identified Pest</span>
                  </div>

                  <h2 className="text-xl font-bold text-green-900 leading-tight">
                    {result!.pests[0]?.name}
                  </h2>
                  {result!.pests[0]?.scientificName && (
                    <p className="italic text-green-700 text-xs mt-0.5 mb-3">
                      {result!.pests[0].scientificName}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${confidenceBadge(result!.pests[0]?.confidence)}`}>
                      {result!.pests[0]?.confidence}% confidence
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityBadge(result!.severity)}`}>
                      {result!.severity.charAt(0).toUpperCase() + result!.severity.slice(1)} Severity
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed">
                    {pestDetail?.description || result!.pests[0]?.description ||
                      `No detailed description available for ${result!.pests[0]?.name}.`}
                  </p>

                  {result!.pests[0]?.confidence < 60 && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <p className="text-xs text-yellow-800">
                        Low confidence — result may be inaccurate. Compare symptoms below or add a description for better accuracy.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Affected crops */}
              {(result!.pests[0]?.affectedCrops?.length ?? 0) > 0 && (
                <div className="mt-4 pt-4 border-t border-green-100">
                  <p className={sectionHeading}>Affected Crops</p>
                  <div className="flex flex-wrap gap-2">
                    {result!.pests[0].affectedCrops!.map((crop, i) => (
                      <span key={i} className="px-3 py-1 bg-white/60 backdrop-blur-sm text-green-800 rounded-full text-xs font-medium border border-green-200">
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── CONDITIONS & SPREAD ── */}
            {(result!.pests[0]?.favourableConditions || result!.pests[0]?.spreadMechanism) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {result!.pests[0]?.favourableConditions && (
                  <div className="bg-orange-50/70 backdrop-blur-sm rounded-2xl p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Favourable Conditions</p>
                    </div>
                    <p className="text-sm text-orange-800 leading-relaxed">{result!.pests[0].favourableConditions}</p>
                  </div>
                )}
                {result!.pests[0]?.spreadMechanism && (
                  <div className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">How It Spreads</p>
                    </div>
                    <p className="text-sm text-blue-800 leading-relaxed">{result!.pests[0].spreadMechanism}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── EMERGENCY THRESHOLD ── */}
            {result!.pests[0]?.emergencyThreshold && (
              <div className="bg-red-50/80 backdrop-blur-sm rounded-2xl p-4 border-2 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-1">Emergency Action Threshold</p>
                    <p className="text-sm text-red-800 leading-relaxed">{result!.pests[0].emergencyThreshold}</p>
                    <button className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all shadow">
                      <Phone className="w-3.5 h-3.5" />
                      Contact Emergency Support
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── PLANT SYMPTOMS ── */}
            {result!.pests[0]?.symptomsStages && (
              <div className="bg-white/55 backdrop-blur-xl border border-white/70 rounded-2xl overflow-hidden shadow-lg">
                <div className="px-5 pt-4 pb-2">
                  <p className={sectionHeading}>Plant Symptoms</p>
                </div>
                <div className="flex border-b border-green-100 bg-white/40">
                  {(['Early', 'Advanced', 'Severe'] as const).map((stage, idx) => (
                    <button
                      key={stage}
                      onClick={() => setActiveSymptomsStage(idx)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                        activeSymptomsStage === idx
                          ? 'bg-white text-green-700 border-b-2 border-green-600'
                          : 'text-gray-500 hover:bg-green-50'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
                <div className="p-5">
                  <ul className="space-y-2.5">
                    {result!.pests[0].symptomsStages[
                      activeSymptomsStage === 0 ? 'early' : activeSymptomsStage === 1 ? 'advanced' : 'severe'
                    ].map((symptom, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ── TREATMENT RECOMMENDATIONS ── */}
            {result!.treatments.length > 0 && (
              <div className="bg-white/55 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-lg">
                <p className={sectionHeading}>Treatment Recommendations</p>
                <p className="text-xs text-gray-500 italic mb-4 -mt-1">
                  Ordered from least to most intensive — start with low-urgency options where possible.
                </p>

                <div className="space-y-3">
                  {result!.treatments.map((treatment, idx) => {
                    const tc     = typeStyle(treatment.type);
                    const urg    = urgencyStyle(treatment.urgency);
                    const ef     = effBar(treatment.effectiveness);
                    const isOpen = expandedTreatment === idx;

                    return (
                      <div
                        key={idx}
                        onClick={() => setExpandedTreatment(isOpen ? null : idx)}
                        className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 hover:border-green-200 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div
                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: tc.bg, border: `1px solid ${tc.border}` }}
                          >
                            <TreatmentIcon type={treatment.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900">{treatment.name}</span>
                              <span
                                className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                                style={{ color: tc.text, background: tc.bg, border: `1px solid ${tc.border}` }}
                              >
                                {tc.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${ef.pct}%`, background: ef.color }}
                                />
                              </div>
                              <span className="text-[11px] text-gray-500 whitespace-nowrap">
                                {treatment.effectiveness} effectiveness
                              </span>
                            </div>
                          </div>
                          <span
                            className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md whitespace-nowrap"
                            style={{ color: urg.text, background: urg.bg, border: `1px solid ${urg.border}` }}
                          >
                            {urg.label}
                          </span>
                          <ChevronDown
                            className={`flex-shrink-0 w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </div>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-0 border-t border-green-100">
                            <p className="text-sm text-gray-600 leading-relaxed mt-3">{treatment.description}</p>
                            
                            {/* Dosage */}
                            {(treatment as any).dosage && (
                              <div className="mt-3 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Dosage</p>
                                <p className="text-sm text-blue-800">{(treatment as any).dosage}</p>
                              </div>
                            )}

                            {/* Mixing Instructions */}
                            {(treatment as any).mixingInstructions && (
                              <div className="mt-3 p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-1">Mixing Instructions</p>
                                <p className="text-sm text-purple-800 leading-relaxed">{(treatment as any).mixingInstructions}</p>
                              </div>
                            )}

                            {/* Application Method */}
                            {(treatment as any).applicationMethod && (
                              <div className="mt-3 p-2.5 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-1">Application Method</p>
                                <p className="text-sm text-green-800 leading-relaxed">{(treatment as any).applicationMethod}</p>
                              </div>
                            )}

                            {/* Timing */}
                            {(treatment as any).timing && (
                              <div className="mt-3 p-2.5 bg-orange-50 rounded-lg border border-orange-200">
                                <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide mb-1">Timing</p>
                                <p className="text-sm text-orange-800 leading-relaxed">{(treatment as any).timing}</p>
                              </div>
                            )}

                            {/* Step-by-Step Instructions */}
                            {(treatment as any).detailedSteps && (treatment as any).detailedSteps.length > 0 && (
                              <div className="mt-3 p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                                <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wide mb-2">Step-by-Step Instructions</p>
                                <ol className="space-y-2">
                                  {(treatment as any).detailedSteps.map((step: string, idx: number) => (
                                    <li key={idx} className="flex gap-2.5 text-sm text-indigo-800">
                                      <span className="font-bold text-indigo-600 flex-shrink-0">{idx + 1}.</span>
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {/* Biological Control Details */}
                            {(treatment as any).biologicalControlDetails && (
                              <div className="mt-3 space-y-2.5">
                                <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200">
                                  <p className="text-xs font-semibold text-sky-900 uppercase tracking-wide mb-2">Beneficial Organism</p>
                                  <p className="text-sm text-sky-800 font-medium mb-1">{(treatment as any).biologicalControlDetails.organism}</p>
                                  <p className="text-sm text-sky-700 leading-relaxed">{(treatment as any).biologicalControlDetails.howToUse}</p>
                                </div>
                                
                                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                                  <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide mb-2">Release Details</p>
                                  <div className="space-y-1.5 text-sm text-emerald-800">
                                    <p><span className="font-semibold">Release Rate:</span> {(treatment as any).biologicalControlDetails.releaseRate}</p>
                                    <p><span className="font-semibold">Optimal Conditions:</span> {(treatment as any).biologicalControlDetails.conditions}</p>
                                    <p><span className="font-semibold">Effectiveness:</span> {(treatment as any).biologicalControlDetails.effectiveness}</p>
                                  </div>
                                </div>

                                <div className="p-2.5 bg-teal-50 rounded-lg border border-teal-200">
                                  <p className="text-xs font-semibold text-teal-900 uppercase tracking-wide mb-2">How to Release Step-by-Step</p>
                                  <ol className="space-y-1.5">
                                    {(treatment as any).biologicalControlDetails.steps.map((step: string, idx: number) => (
                                      <li key={idx} className="flex gap-2 text-xs text-teal-800">
                                        <span className="font-bold text-teal-600 flex-shrink-0">{idx + 1}.</span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                            )}

                            {/* Cultural Control Details */}
                            {(treatment as any).culturalControlDetails && (
                              <div className="mt-3 space-y-2.5">
                                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                                  <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-2">What This Method Does</p>
                                  <p className="text-sm text-amber-800 leading-relaxed">{(treatment as any).culturalControlDetails.description}</p>
                                </div>

                                <div className="p-2.5 bg-orange-50 rounded-lg border border-orange-200">
                                  <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide mb-2">Equipment Needed</p>
                                  <ul className="space-y-1">
                                    {(treatment as any).culturalControlDetails.equipment.map((item: string, idx: number) => (
                                      <li key={idx} className="flex items-start gap-2 text-sm text-orange-800">
                                        <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <p className="text-xs font-semibold text-yellow-900 uppercase tracking-wide mb-2">Detailed Steps</p>
                                  <ol className="space-y-1.5">
                                    {(treatment as any).culturalControlDetails.steps.map((step: string, idx: number) => (
                                      <li key={idx} className="flex gap-2 text-xs text-yellow-800">
                                        <span className="font-bold text-yellow-700 flex-shrink-0">{idx + 1}.</span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>

                                <div className="p-2.5 bg-lime-50 rounded-lg border border-lime-200">
                                  <p className="text-xs font-semibold text-lime-900 uppercase tracking-wide mb-1">Frequency & Results</p>
                                  <p className="text-xs text-lime-800 mb-1"><span className="font-semibold">How Often:</span> {(treatment as any).culturalControlDetails.frequency}</p>
                                  <p className="text-xs text-lime-800"><span className="font-semibold">Expected Results:</span> {(treatment as any).culturalControlDetails.results}</p>
                                </div>
                              </div>
                            )}

                            {/* Chemical Details & PPE */}
                            {(treatment as any).chemicalDetails && (
                              <div className="mt-3 space-y-2.5">
                                <div className="p-2.5 bg-violet-50 rounded-lg border border-violet-200">
                                  <p className="text-xs font-semibold text-violet-900 uppercase tracking-wide mb-2">Recommended Pesticides</p>
                                  <div className="space-y-2">
                                    {(treatment as any).chemicalDetails.pesticidesRecommended.map((pesti: any, idx: number) => (
                                      <div key={idx} className="text-xs text-violet-800 bg-white/50 p-1.5 rounded border border-violet-100">
                                        <p className="font-semibold">{pesti.name}</p>
                                        <p><span className="font-semibold">Active:</span> {pesti.activeIngredient}</p>
                                        <p><span className="font-semibold">Concentration:</span> {pesti.concentration}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="p-2.5 bg-red-50 rounded-lg border border-red-200">
                                  <p className="text-xs font-semibold text-red-900 uppercase tracking-wide mb-2">⚠️ Required Protective Equipment (PPE)</p>
                                  <div className="space-y-2">
                                    {(treatment as any).chemicalDetails.protectiveEquipment.map((ppe: any, idx: number) => (
                                      <div key={idx} className="text-xs text-red-800">
                                        <p className="font-bold text-red-900 mb-1">{ppe.category}</p>
                                        <ul className="ml-2 space-y-0.5">
                                          {ppe.items.map((item: string, itemIdx: number) => (
                                            <li key={itemIdx} className="flex items-start gap-1.5">
                                              <Shield className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                                              {item}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="p-2.5 bg-fuchsia-50 rounded-lg border border-fuchsia-200">
                                  <p className="text-xs font-semibold text-fuchsia-900 uppercase tracking-wide mb-2">Application Details</p>
                                  <div className="space-y-1.5 text-xs text-fuchsia-800">
                                    <p><span className="font-semibold">Dilution Ratio:</span> {(treatment as any).chemicalDetails.dilutionRatio}</p>
                                    <p><span className="font-semibold">Application Timing:</span> {(treatment as any).chemicalDetails.sprayTiming}</p>
                                    <p><span className="font-semibold">Weather Conditions:</span> {(treatment as any).chemicalDetails.weatherConditions}</p>
                                  </div>
                                </div>

                                <div className="p-2.5 bg-cyan-50 rounded-lg border border-cyan-200">
                                  <p className="text-xs font-semibold text-cyan-900 uppercase tracking-wide mb-2">Detailed Application Steps</p>
                                  <ol className="space-y-1.5">
                                    {(treatment as any).chemicalDetails.applicationSteps.map((step: string, idx: number) => (
                                      <li key={idx} className="flex gap-2 text-xs text-cyan-800">
                                        <span className="font-bold text-cyan-600 flex-shrink-0">{idx + 1}.</span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                            )}

                            {/* Precautions */}
                            {(treatment as any).precautions && (treatment as any).precautions.length > 0 && (
                              <div className="mt-3 p-2.5 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-xs font-semibold text-red-900 uppercase tracking-wide mb-2">Precautions</p>
                                <ul className="space-y-1.5">
                                  {(treatment as any).precautions.map((precaution: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                                      <span>{precaution}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Harvesting Wait Period */}
                            {(treatment as any).harvesting && (
                              <div className="mt-3 p-2.5 bg-cyan-50 rounded-lg border border-cyan-200">
                                <p className="text-xs font-semibold text-cyan-900 uppercase tracking-wide mb-1">Harvesting Wait Period</p>
                                <p className="text-sm text-cyan-800 font-semibold">{(treatment as any).harvesting}</p>
                              </div>
                            )}

                            {treatment.safetyWarning && (
                              <div className="mt-3 flex gap-2.5 bg-amber-50 rounded-lg p-3 border border-amber-200">
                                <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 leading-relaxed">{treatment.safetyWarning}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── PREVENTION & SCOUTING TIPS ── */}
            {result!.preventionTips.length > 0 && (
              <div className="bg-white/55 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-lg">
                <p className={sectionHeading}>Prevention &amp; Scouting Tips</p>
                <div className="space-y-2">
                  {result!.preventionTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 bg-green-50/60 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ACTIONS ── */}
            <div className="flex flex-wrap gap-3 pb-2">
              {!saved ? (
                <button
                  onClick={handleSaveReport} disabled={saving}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md disabled:opacity-50"
                >
                  {saving ? <><CheckCircle className="w-4 h-4" />Saving...</> : <><CheckCircle className="w-4 h-4" />Save Report</>}
                </button>
              ) : (
                <div className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-100 text-green-800 font-semibold text-sm border border-green-200">
                  <CheckCircle className="w-4 h-4" />
                  Report Saved Successfully
                </div>
              )}
              <button
                onClick={handleReset}
                className="flex-1 min-w-[140px] px-5 py-3 rounded-xl font-semibold text-sm text-green-900 bg-white/60 backdrop-blur-sm border border-white/80 hover:bg-white/80 transition-all"
              >
                Scan Another Pest
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="relative z-10 flex items-start gap-3 p-4 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200 shadow">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Error</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PestScanner;