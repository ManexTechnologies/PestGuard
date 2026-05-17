import './PestHistory.css';
import React, { useState } from 'react';
import type { PestReport } from '@/data/pestData';
import LoadingProgressBar from '@/components/LoadingProgressBar';

// ─── Local asset images ───────────────────────────────────────────────────────
const africanBollwormImg  = new URL('@/assets/African Bollworm.jpeg',    import.meta.url).href;
const aphidsImg           = new URL('@/assets/Aphids.jpeg',              import.meta.url).href;
const cottonStainerImg    = new URL('@/assets/Cotton Stainer.jpeg',      import.meta.url).href;
const cutwormImg          = new URL('@/assets/Cutworm.jpeg',             import.meta.url).href;
const diamondbackMothImg  = new URL('@/assets/Diamondback moth.jpeg',    import.meta.url).href;
const fallArmywormImg     = new URL('@/assets/Fall Armyworm.jpeg',       import.meta.url).href;
const fruitFlyImg         = new URL('@/assets/Fruit fly.jpeg',           import.meta.url).href;
const grainMothImg        = new URL('@/assets/Grain moth.jpeg',          import.meta.url).href;
const leafMinerImg        = new URL('@/assets/Leaf miner.jpeg',          import.meta.url).href;
const locustImg           = new URL('@/assets/Locust.jpeg',              import.meta.url).href;
const maizeWeevilImg      = new URL('@/assets/Maize Weevil.jpeg',        import.meta.url).href;
const quelaeBirdsImg      = new URL('@/assets/Quelea birds.jpeg',        import.meta.url).href;
const redSpiderMiteImg    = new URL('@/assets/Red Spider Mite.jpeg',     import.meta.url).href;
const stalkBorerImg       = new URL('@/assets/Stalk Borer.jpeg',         import.meta.url).href;
const stemBorerImg        = new URL('@/assets/Stem borer.jpeg',          import.meta.url).href;
const termitesImg         = new URL('@/assets/Termites.jpeg',            import.meta.url).href;
const thripsImg           = new URL('@/assets/Thrips.jpeg',              import.meta.url).href;
const tobaccoBudwormImg   = new URL('@/assets/Tobacco budworm.jpeg',     import.meta.url).href;
const tsetseFlyImg        = new URL('@/assets/Tsetse fly.jpeg',          import.meta.url).href;
const whiteflyImg         = new URL('@/assets/Whitefly.jpeg',            import.meta.url).href;

// Map pest names → local asset images (with broad aliases)
const LOCAL_PEST_IMAGES: Record<string, string> = {
  // Bollworm / cotton
  'african bollworm':       africanBollwormImg,
  'bollworm':               africanBollwormImg,
  'helicoverpa':            africanBollwormImg,
  'heliothis':              africanBollwormImg,
  // Aphids
  'aphids':                 aphidsImg,
  'aphid':                  aphidsImg,
  'aphis':                  aphidsImg,
  'greenfly':               aphidsImg,
  'blackfly':               aphidsImg,
  // Cotton stainer
  'cotton stainer':         cottonStainerImg,
  'dysdercus':              cottonStainerImg,
  // Cutworm
  'cutworm':                cutwormImg,
  'agrotis':                cutwormImg,
  // Diamondback moth
  'diamondback moth':       diamondbackMothImg,
  'diamondback':            diamondbackMothImg,
  'plutella':               diamondbackMothImg,
  // Fall armyworm / armyworm
  'fall armyworm':          fallArmywormImg,
  'armyworm':               fallArmywormImg,
  'spodoptera':             fallArmywormImg,
  'army worm':              fallArmywormImg,
  // Fruit fly
  'fruit fly':              fruitFlyImg,
  'fruitfly':               fruitFlyImg,
  'bactrocera':             fruitFlyImg,
  'ceratitis':              fruitFlyImg,
  // Grain moth / storage
  'grain moth':             grainMothImg,
  'storage moth':           grainMothImg,
  'sitotroga':              grainMothImg,
  'angoumois':              grainMothImg,
  // Leaf miner
  'leaf miner':             leafMinerImg,
  'leafminer':              leafMinerImg,
  'liriomyza':              leafMinerImg,
  // Locust
  'locust':                 locustImg,
  'locusts':                locustImg,
  'schistocerca':           locustImg,
  'nomadacris':             locustImg,
  // Maize weevil
  'maize weevil':           maizeWeevilImg,
  'sitophilus':             maizeWeevilImg,
  'grain weevil':           maizeWeevilImg,
  'weevil':                 maizeWeevilImg,
  // Quelea birds
  'quelea':                 quelaeBirdsImg,
  'quelea birds':           quelaeBirdsImg,
  'red-billed quelea':      quelaeBirdsImg,
  // Red spider mite
  'red spider mite':        redSpiderMiteImg,
  'spider mite':            redSpiderMiteImg,
  'tetranychus':            redSpiderMiteImg,
  'mite':                   redSpiderMiteImg,
  // Stalk borer
  'stalk borer':            stalkBorerImg,
  'stalkborer':             stalkBorerImg,
  'busseola':               stalkBorerImg,
  'eldana':                 stalkBorerImg,
  // Stem borer
  'stem borer':             stemBorerImg,
  'stemborer':              stemBorerImg,
  'chilo':                  stemBorerImg,
  'sesamia':                stemBorerImg,
  'diatraea':               stemBorerImg,
  // Termites
  'termites':               termitesImg,
  'termite':                termitesImg,
  'macrotermes':            termitesImg,
  'odontotermes':           termitesImg,
  // Thrips
  'thrips':                 thripsImg,
  'thrip':                  thripsImg,
  'frankliniella':          thripsImg,
  'thripse':                thripsImg,
  // Tobacco budworm
  'tobacco budworm':        tobaccoBudwormImg,
  'budworm':                tobaccoBudwormImg,
  'manduca':                tobaccoBudwormImg,
  // Tsetse fly
  'tsetse fly':             tsetseFlyImg,
  'tsetse':                 tsetseFlyImg,
  'glossina':               tsetseFlyImg,
  // Whitefly
  'whitefly':               whiteflyImg,
  'white fly':              whiteflyImg,
  'bemisia':                whiteflyImg,
  'trialeurodes':           whiteflyImg,
};

// ─── Image resolution: local assets only ─────────────────────────────────────
function resolvePestImage(report: PestReport): string | null {
  const nameLower = (report.pest_name || '').toLowerCase().trim();
  for (const [key, url] of Object.entries(LOCAL_PEST_IMAGES)) {
    if (nameLower.includes(key) || key.includes(nameLower)) return url;
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function severityClass(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'critical';
    case 'high':     return 'high';
    case 'medium':   return 'medium';
    default:         return 'low';
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface PestHistoryProps {
  reports: PestReport[];
  loading: boolean;
  onRateEffectiveness?: (reportId: string, rating: number) => void;
  userId?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
const PestHistory: React.FC<PestHistoryProps> = ({
  reports,
  loading,
  onRateEffectiveness,
  userId,
}) => {
  const [selectedReport, setSelectedReport] = useState<PestReport | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // ── Stats ──────────────────────────────────────────────────────────────────
  const highCount     = reports.filter(r => r.severity?.toLowerCase() === 'high').length;
  const criticalCount = reports.filter(r => r.severity?.toLowerCase() === 'critical').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = reports.filter(r => {
    const matchSearch =
      !search ||
      r.pest_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.location_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.crop_affected?.toLowerCase().includes(search.toLowerCase());
    const matchSev =
      severityFilter === 'all' ||
      r.severity?.toLowerCase() === severityFilter;
    return matchSearch && matchSev;
  });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <LoadingProgressBar
        message="Loading your pest reports…"
        isLoading={loading}
        fullScreen={true}
      />
    );
  }

  const PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='220'%3E%3Crect width='400' height='220' fill='%23c8e6d9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='52'%3E🐛%3C/text%3E%3C/svg%3E";

  return (
    <div className="ph-wrapper">

      {/* ── Header ── */}
      <div className="ph-header glass-card">
        <div className="ph-header-text">
          <h1>🗂️ My Pest <em>Reports</em></h1>
          <p>Track, review and manage all your submitted pest sightings</p>
        </div>
        <div className="ph-stats">
          <div className="ph-stat">
            <span className="ph-stat-value">{reports.length}</span>
            <span className="ph-stat-label">Total Reports</span>
          </div>
          <div className="ph-stat ph-stat--red">
            <span className="ph-stat-value">{criticalCount + highCount}</span>
            <span className="ph-stat-label">High / Critical</span>
          </div>
          <div className="ph-stat ph-stat--green">
            <span className="ph-stat-value">{resolvedCount}</span>
            <span className="ph-stat-label">Resolved</span>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="ph-controls glass-card">
        <div className="ph-search-box">
          <span className="ph-search-icon">🔍</span>
          <input
            type="text"
            className="ph-search-input"
            placeholder="Search by pest, location or crop…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ph-filter-box">
          <label>Severity:</label>
          <select
            className="ph-filter-select"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* ── Empty state ── */}
      {reports.length === 0 ? (
        <div className="ph-empty glass-card">
          <span className="ph-empty-icon">📋</span>
          <h3>No reports yet</h3>
          <p>Scan a pest to create your first report.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ph-empty glass-card">
          <span className="ph-empty-icon">🔍</span>
          <h3>No matches found</h3>
          <p>Try adjusting your search or filter.</p>
        </div>
      ) : (
        /* ── Grid ── */
        <div className="ph-grid">
          {filtered.map(report => {
            const imgSrc = resolvePestImage(report);
            const sevClass = severityClass(report.severity);
            return (
              <div
                key={report.id}
                className="ph-card glass-card"
                onClick={() => setSelectedReport(report)}
              >
                {/* Image */}
                <div className="ph-card-img-wrap">
                  <img
                    src={imgSrc || PLACEHOLDER}
                    alt={report.pest_name}
                    className="ph-card-img"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                  <span className={`ph-badge ph-badge--${sevClass}`}>
                    {report.severity || 'Unknown'}
                  </span>
                  {report.status === 'resolved' && (
                    <span className="ph-resolved-pill">✓ Resolved</span>
                  )}
                </div>

                {/* Body */}
                <div className="ph-card-body">
                  <h3 className="ph-card-title">{report.pest_name}</h3>
                  {report.pest_type && (
                    <p className="ph-card-type">{report.pest_type}</p>
                  )}

                  <div className="ph-card-meta">
                    {report.crop_affected && report.crop_affected !== 'Unknown' && (
                      <span className="ph-meta-tag">🌾 {report.crop_affected}</span>
                    )}
                    {report.location_name && report.location_name !== 'Not specified' && (
                      <span className="ph-meta-tag">📍 {report.location_name}</span>
                    )}
                  </div>

                  {report.description && (
                    <p className="ph-card-desc">
                      {report.description.length > 90
                        ? report.description.substring(0, 90) + '…'
                        : report.description}
                    </p>
                  )}

                  <div className="ph-card-footer">
                    <span className="ph-card-date">
                      🕐 {formatDate(report.created_at)}
                    </span>
                    {report.confidence && (
                      <span className="ph-confidence">
                        {report.confidence}% match
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedReport && (
        <div className="ph-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="ph-modal glass-card" onClick={e => e.stopPropagation()}>
            <button className="ph-modal-close" onClick={() => setSelectedReport(null)}>✕</button>

            {/* Modal image */}
            <div className="ph-modal-img-wrap">
              <img
                src={resolvePestImage(selectedReport) || PLACEHOLDER}
                alt={selectedReport.pest_name}
                className="ph-modal-img"
                onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
              />
              <span className={`ph-badge ph-badge--${severityClass(selectedReport.severity)} ph-badge--lg`}>
                {selectedReport.severity || 'Unknown'} Severity
              </span>
            </div>

            {/* Modal content */}
            <div className="ph-modal-body">
              <h2 className="ph-modal-title">{selectedReport.pest_name}</h2>
              {selectedReport.pest_type && (
                <p className="ph-modal-sci">{selectedReport.pest_type}</p>
              )}

              <div className="ph-modal-grid">
                {selectedReport.crop_affected && selectedReport.crop_affected !== 'Unknown' && (
                  <div className="ph-modal-field">
                    <span className="ph-modal-field-label">🌾 Crop Affected</span>
                    <span className="ph-modal-field-value">{selectedReport.crop_affected}</span>
                  </div>
                )}
                {selectedReport.location_name && selectedReport.location_name !== 'Not specified' && (
                  <div className="ph-modal-field">
                    <span className="ph-modal-field-label">📍 Location</span>
                    <span className="ph-modal-field-value">{selectedReport.location_name}</span>
                  </div>
                )}
                {selectedReport.province && selectedReport.province !== 'Not specified' && (
                  <div className="ph-modal-field">
                    <span className="ph-modal-field-label">🗺️ Province</span>
                    <span className="ph-modal-field-value">{selectedReport.province}</span>
                  </div>
                )}
                {selectedReport.confidence && (
                  <div className="ph-modal-field">
                    <span className="ph-modal-field-label">🎯 Confidence</span>
                    <span className="ph-modal-field-value">{selectedReport.confidence}%</span>
                  </div>
                )}
                <div className="ph-modal-field">
                  <span className="ph-modal-field-label">📅 Reported</span>
                  <span className="ph-modal-field-value">{formatDate(selectedReport.created_at)}</span>
                </div>
                <div className="ph-modal-field">
                  <span className="ph-modal-field-label">📌 Status</span>
                  <span className={`ph-status-pill ph-status-pill--${selectedReport.status}`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>

              {selectedReport.description && (
                <div className="ph-modal-section">
                  <h4>📋 Description</h4>
                  <p>{selectedReport.description}</p>
                </div>
              )}

              {selectedReport.user_name && (
                <div className="ph-modal-section">
                  <h4>👤 Reported by</h4>
                  <p>{selectedReport.user_name}{selectedReport.user_email ? ` · ${selectedReport.user_email}` : ''}</p>
                </div>
              )}

              {/* Rate effectiveness */}
              {onRateEffectiveness && userId && (
                <div className="ph-modal-section">
                  <h4>⭐ Rate Treatment Effectiveness</h4>
                  <div className="ph-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        className={`ph-star ${selectedReport.effectiveness_rating && selectedReport.effectiveness_rating >= star ? 'ph-star--active' : ''}`}
                        onClick={() => onRateEffectiveness(selectedReport.id, star)}
                        aria-label={`Rate ${star} stars`}
                      >
                        ★
                      </button>
                    ))}
                    {selectedReport.effectiveness_rating && (
                      <span className="ph-star-label">
                        {selectedReport.effectiveness_rating}/5 rated
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PestHistory;