/**
 * Fetches rich pest information from Claude AI for any IP102 pest.
 * Falls back gracefully if the API is unavailable.
 */

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

export async function fetchPestInfo(pestName: string): Promise<PestDetail | null> {
  const key = pestName.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const data = await response.json();
    const text = data.content?.map((c: any) => c.text || '').join('') ?? '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed: PestDetail = JSON.parse(clean);

    cache.set(key, parsed);
    return parsed;
  } catch (err) {
    console.warn('[PestInfo] Failed to fetch pest info for:', pestName, err);
    return null;
  }
}
