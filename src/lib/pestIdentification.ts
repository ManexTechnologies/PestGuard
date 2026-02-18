import { KNOWLEDGE_BASE, PestInfo, Treatment } from '@/data/pestData';

export interface LocalPestMatch {
  name: string;
  scientificName: string;
  type: string;
  confidence: number;
  description: string;
  damageSymptoms: string[];
  lifeCycle?: string;
}

export interface LocalTreatmentRec {
  name: string;
  type: string;
  description: string;
  effectiveness: string;
  cost: string;
  safetyWarning?: string;
  applicationTiming?: string;
}

export interface LocalIdentificationResult {
  identified: boolean;
  pests: LocalPestMatch[];
  treatments: LocalTreatmentRec[];
  severity: string;
  urgency: string;
  preventionTips: string[];
  additionalNotes: string;
}

/**
 * Local pest identification function that matches user description against
 * the KNOWLEDGE_BASE to find potential pest matches.
 * Supports image upload, text description, or both.
 * 
 * @param params - Object containing imageBase64 (optional), description (optional), cropType (optional)
 * @returns IdentificationResult with matched pests and treatments
 */
export function identifyPestLocally(params: {
  imageBase64?: string;
  description?: string;
  cropType?: string;
}): LocalIdentificationResult {
  const { imageBase64, description, cropType } = params;

  // Validate that at least description is provided
  if (!description || description.trim().length === 0) {
    return {
      identified: false,
      pests: [],
      treatments: [],
      severity: 'low',
      urgency: 'Please provide a description of the pest or damage you observe.',
      preventionTips: [
        'Describe what you see: color, size, shape of insects or damage',
        'Take clear photos of affected plant parts',
        'Note when symptoms first appeared',
        'Check for any visible insects, eggs, or webbing'
      ],
      additionalNotes: 'A description is required for pest identification. Upload an image and/or describe the pest symptoms you observe.'
    };
  }

  const descLower = description.toLowerCase().trim();
  const cropLower = cropType?.toLowerCase() || '';
  
  // Score each pest based on keyword matches
  const scoredPests: { pest: PestInfo; score: number; matchedKeywords: string[] }[] = [];
  
  for (const pest of KNOWLEDGE_BASE) {
    let score = 0;
    const matchedKeywords: string[] = [];
    
    // Check if pest affects the specified crop
    if (cropLower) {
      const affectsCrop = pest.cropAffected.some(c => 
        c.toLowerCase() === cropLower || 
        cropLower.includes(c.toLowerCase()) ||
        c.toLowerCase().includes(cropLower)
      );
      if (affectsCrop) {
        score += 30;
        matchedKeywords.push(`crop:${pest.cropAffected.join(',')}`);
      }
    }
    
    // Check pest name in description
    if (pest.name.toLowerCase().includes(descLower) || 
        descLower.includes(pest.name.toLowerCase())) {
      score += 50;
      matchedKeywords.push(`name:${pest.name}`);
    }
    
    // Check scientific name
    if (pest.scientificName.toLowerCase().split(' ').some(word => 
      descLower.includes(word))) {
      score += 20;
      matchedKeywords.push(`scientific:${pest.scientificName}`);
    }
    
    // Check damage symptoms
    for (const symptom of pest.damageSymptoms) {
      const symptomWords = symptom.toLowerCase().split(' ');
      const matchCount = symptomWords.filter(word => 
        word.length > 3 && descLower.includes(word)
      ).length;
      if (matchCount > 0) {
        score += matchCount * 10;
        matchedKeywords.push(`symptom:${symptom}`);
      }
    }
    
    // Check pest type
    if (pest.type.toLowerCase().includes(descLower)) {
      score += 15;
      matchedKeywords.push(`type:${pest.type}`);
    }
    
    // Boost score if image is provided (indicates user took photo)
    if (imageBase64) {
      score += 10;
    }
    
    // Add severity bonus (more severe pests get higher base score)
    const severityBonus: Record<string, number> = {
      critical: 20,
      high: 15,
      medium: 10,
      low: 5
    };
    score += severityBonus[pest.severity] || 0;
    
    if (score > 0) {
      scoredPests.push({ pest, score, matchedKeywords });
    }
  }
  
  // Sort by score descending
  scoredPests.sort((a, b) => b.score - a.score);
  
  // Take top 3 matches
  const topMatches = scoredPests.slice(0, 3);
  
  if (topMatches.length === 0) {
    // No matches found - return a generic response
    return {
      identified: false,
      pests: [],
      treatments: [],
      severity: 'low',
      urgency: 'No pest match found. Please provide more details about the symptoms.',
      preventionTips: [
        'Describe visual appearance: insect size, color, shape',
        'Describe plant damage: holes, wilting, discoloration, defoliation',
        'Mention crop type and current growth stage',
        'Note when symptoms first appeared',
        'Provide location and recent weather conditions'
      ],
      additionalNotes: 'Unable to identify pest from the provided description. Try describing the symptoms in more detail, or consult your local extension officer.'
    };
  }

  // Calculate confidence based on score and input types
  const maxPossibleScore = 100;
  let confidenceBoost = imageBase64 ? 5 : 0; // Add 5% to confidence if image provided
  
  const pests: LocalPestMatch[] = topMatches.map(({ pest, score }) => ({
    name: pest.name,
    scientificName: pest.scientificName,
    type: pest.type,
    confidence: Math.min(Math.round((score / maxPossibleScore) * 100) + confidenceBoost, 95),
    description: pest.description,
    damageSymptoms: pest.damageSymptoms,
    lifeCycle: `Active during ${pest.season}`
  }));
  
  // Get treatments from top match
  const topPest = topMatches[0].pest;
  const treatments: LocalTreatmentRec[] = topPest.treatments.map(t => ({
    name: t.name,
    type: t.type,
    description: t.description,
    effectiveness: t.effectiveness,
    cost: t.cost,
    safetyWarning: t.safetyWarning
  }));
  
  // Determine severity and urgency
  const severity = topPest.severity;
  const urgencyMessages: Record<string, string> = {
    critical: 'Immediate action required! This pest can cause complete crop loss if not controlled urgently.',
    high: 'Urgent action recommended. This pest can cause significant damage within days.',
    medium: 'Action needed within a week. Monitor the situation and prepare to treat.',
    low: 'Monitor the situation. This pest causes limited damage but should still be managed.'
  };
  
  // Generate prevention tips based on pest type
  const preventionTips = generatePreventionTips(topPest);
  
  return {
    identified: true,
    pests,
    treatments,
    severity,
    urgency: urgencyMessages[severity] || 'Monitor and take action as needed.',
    preventionTips,
    additionalNotes: `Identification confidence: ${pests[0].confidence}%. ${imageBase64 ? 'Image provided.' : 'No image provided.'} ${description ? `Based on: "${description}"` : ''} For confirmation, consult your local extension officer.`
  };
}

function generatePreventionTips(pest: PestInfo): string[] {
  const tips: string[] = [];
  
  // Crop-specific tips
  if (pest.cropAffected.includes('Maize')) {
    tips.push('Plant early maturing maize varieties to avoid peak pest periods');
    tips.push('Use certified disease-free seed from reputable suppliers');
  }
  
  // Season-specific tips
  if (pest.season.includes('rainy') || pest.season.includes('wet')) {
    tips.push('Improve field drainage to reduce pest habitat');
    tips.push('Avoid working in fields when foliage is wet');
  }
  
  if (pest.season.includes('dry')) {
    tips.push('Ensure adequate irrigation to reduce plant stress');
    tips.push('Monitor crops more frequently during dry periods');
  }
  
  // General prevention tips based on pest type
  tips.push('Regular field scouting at least twice a week');
  tips.push('Remove and destroy infected plant material');
  tips.push('Practice crop rotation with non-host crops');
  tips.push('Maintain field hygiene - remove crop residues after harvest');
  
  return tips.slice(0, 5); // Return max 5 tips
}

export default identifyPestLocally;
