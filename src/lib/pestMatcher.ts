import { ALL_PESTS, type PestInfo } from '@/data/pestData';

export type MatchType = 'exact' | 'normalized-contains' | 'scientific-contains' | 'none';

export type MatchResult = {
  pest: PestInfo | null;
  score: number;
  matchType: MatchType;
};

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const scoreFor = (
  labelNorm: string,
  pest: PestInfo
): { score: number; matchType: MatchType } => {
  const pestNameNorm = normalize(pest.name);
  const sciNorm = normalize(pest.scientificName);

  if (pestNameNorm === labelNorm) {
    return { score: 100, matchType: 'exact' };
  }

  if (
    pestNameNorm.includes(labelNorm) ||
    labelNorm.includes(pestNameNorm)
  ) {
    return {
      score: 80,
      matchType: 'normalized-contains',
    };
  }

  if (sciNorm.includes(labelNorm) || labelNorm.includes(sciNorm)) {
    return { score: 70, matchType: 'scientific-contains' };
  }

  return { score: 0, matchType: 'none' };
};

/**
 * Match a YOLO label to the knowledge base.
 * - label: YOLO's predicted class label
 * - confidence: YOLO confidence (0-100)
 */
export function matchPestToKnowledgeBase(label: string, confidence: number): MatchResult {
  const labelNorm = normalize(label);
  if (!labelNorm) return { pest: null, score: 0, matchType: 'none' };

  let best: PestInfo | null = null;
  let bestScore = -1;
  let bestType: MatchType = 'none';

  for (const pest of ALL_PESTS) {
    const { score, matchType } = scoreFor(labelNorm, pest);
    if (score > bestScore) {
      bestScore = score;
      best = pest;
      bestType = matchType;
    }
  }

  if (!best || bestScore <= 0) {
    return { pest: null, score: 0, matchType: 'none' };
  }

  // Blend KB match strength with model confidence.
  const blended = Math.round(bestScore * 0.7 + Math.min(Math.max(confidence, 0), 100) * 0.3);

  return { pest: best, score: blended, matchType: bestType };
}

/**
 * Fallback: return the best knowledge-base pest using label only.
 * (Used when matcher can't find a direct match.)
 */
export function getFallbackPestData(label: string, confidence: number): PestInfo {
  const labelNorm = normalize(label);

  let best: PestInfo = KNOWLEDGE_BASE[0];
  let bestScore = -1;

  for (const pest of ALL_PESTS) {
    const { score } = scoreFor(labelNorm, pest);
    if (score > bestScore) {
      bestScore = score;
      best = pest;
    }
  }

  if (bestScore <= 0) return ALL_PESTS[0];

  return best;
}

export { ALL_PESTS };


