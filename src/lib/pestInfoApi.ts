/**
 * Fetches rich pest information from Claude AI for any IP102 pest.
 * Falls back gracefully if the API is unavailable.
 */

import { getPestByName } from '@/data/pestData';

export interface PestDetail {
  name: string;
  scientificName: string;
  type: string;
  description: string;
  affectedCrops: string[];
  damageSymptoms: string[];
  recommendedTreatment: string;
  preventionTips: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const cache = new Map<string, PestDetail>();

function toPestDetail(pest: any): PestDetail {
  return {
    name: pest.name,
    scientificName: pest.scientificName,
    type: pest.type || 'Unknown',
    description: pest.description || `${pest.name} is a pest that affects ${Array.isArray(pest.cropAffected) ? pest.cropAffected.join(', ') : pest.cropAffected || 'various crops'}.`,
    affectedCrops: Array.isArray(pest.affectedCrops)
      ? pest.affectedCrops
      : pest.cropAffected
        ? Array.isArray(pest.cropAffected)
          ? pest.cropAffected
          : [pest.cropAffected]
        : [],
    damageSymptoms: pest.damageSymptoms || [],
    recommendedTreatment: pest.recommendedTreatment || 'Compare with local pest guides and consult an expert for confirmation.',
    preventionTips: pest.preventionTips || [],
    severity: pest.severity || 'medium',
  };
}

function buildFallbackPestDetail(pestName: string): PestDetail {
  const localPest = getPestByName(pestName);
  if (localPest) {
    return toPestDetail(localPest);
  }

  return {
    name: pestName,
    scientificName: pestName,
    type: 'Unknown',
    description: `Detected as "${pestName}". Use this guidance as an initial reference and consult a local agricultural expert to confirm the exact pest.`,
    affectedCrops: [],
    damageSymptoms: [
      'Leaf stippling or discoloration',
      'Chewed or ragged leaf margins',
      'Distorted growth or wilting',
    ],
    recommendedTreatment: 'Inspect the affected crop closely, compare with known pests in the Pest Library, and consult a local agricultural expert for confirmation.',
    preventionTips: [
      'Capture a clear close-up photo of the pest and damage',
      'Monitor neighbouring plants for early infestation symptoms',
      'Practice good field hygiene and rotation to reduce pest pressure',
    ],
    severity: 'medium',
  };
}

export async function fetchPestInfo(pestName: string): Promise<PestDetail> {
  const key = pestName.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    const fallback = buildFallbackPestDetail(pestName);
    cache.set(key, fallback);
    return fallback;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are an agricultural pest expert. When given a pest name from the IP102 dataset, 
return ONLY a JSON object with no preamble, no markdown, no backticks. 
The JSON must have exactly these fields:
{
  "name": "common name",
  "scientificName": "scientific name",
  "type": "insect order or type e.g. Lepidoptera, Mite, etc.",
  "description": "2-3 sentence description of the pest",
  "affectedCrops": ["crop1", "crop2"],
  "damageSymptoms": ["symptom1", "symptom2", "symptom3"],
  "recommendedTreatment": "1-2 sentence treatment recommendation",
  "preventionTips": ["tip1", "tip2"],
  "severity": "low|medium|high|critical"
}`,
        messages: [
          {
            role: 'user',
            content: `Provide pest information for: ${pestName} (from the IP102 agricultural pest dataset)`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Pest info API request failed (${response.status})`);
    }

    const data = await response.json();
    const text = Array.isArray(data.content)
      ? data.content.map((c: any) => c.text || '').join('')
      : typeof data.completion === 'string'
        ? data.completion
        : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed: PestDetail = JSON.parse(clean);

    cache.set(key, parsed);
    return parsed;
  } catch (err) {
    console.warn('[PestInfo] Failed to fetch pest info for:', pestName, err);
    const fallback = buildFallbackPestDetail(pestName);
    cache.set(key, fallback);
    return fallback;
  }
}
