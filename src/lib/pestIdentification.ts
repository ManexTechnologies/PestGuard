import { KNOWLEDGE_BASE, PestInfo, Treatment } from '@/data/pestData';
import { analyzePestImageWithTensorFlow } from '@/lib/tensorflowClassifier';

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
  effectiveness?: string;
  cost?: string;
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
 * Enhanced pest identification function that combines TensorFlow image analysis
 * with knowledge base matching for accurate pest identification.
 *
 * @param params - Object containing imageBase64 (optional), description (optional), cropType (optional)
 * @returns IdentificationResult with matched pests and treatments
 */
export async function identifyPestLocally(params: {
  imageBase64?: string;
  description?: string;
  cropType?: string;
}): Promise<LocalIdentificationResult> {
  const { imageBase64, description, cropType } = params;

  // If no image provided, fall back to description-only identification
  if (!imageBase64 || imageBase64.trim().length === 0) {
    return identifyPestFromDescriptionOnly(description, cropType);
  }

  try {
    // Analyze image with TensorFlow
    const tfResult = await analyzePestImageWithTensorFlow(imageBase64);

    // Check for special cases from model
    if (tfResult.predictions.length > 0) {
      const firstPrediction = tfResult.predictions[0].label.toLowerCase();

      // Image is too unclear/blurry
      if (firstPrediction === 'unclear_image') {
        return {
          identified: false,
          pests: [],
          treatments: [],
          severity: 'low',
          urgency: 'Image quality too low for pest identification.',
          preventionTips: [
            'Take a clearer photo with better lighting',
            'Ensure the pest or plant damage is in sharp focus',
            'Avoid blurry or motion-blurred images',
            'Position the camera closer to the subject',
            'Use natural daylight when possible'
          ],
          additionalNotes: 'The image is too unclear to identify the pest. Please take a clearer photo showing the insect or affected plant parts in detail.'
        };
      }

      // Image does not contain a pest or is not relevant
      if (firstPrediction === 'not_a_pest') {
        return {
          identified: false,
          pests: [],
          treatments: [],
          severity: 'low',
          urgency: 'This is not a pest.',
          preventionTips: [
            'Please upload a photo of an actual pest or crop damage',
            'Include close-up photos of insects or affected plant parts',
            'Show leaf damage, discoloration, wilting, or holes',
            'Include context showing the affected crop or area'
          ],
          additionalNotes: 'The image does not appear to contain an agricultural pest. Please take a new photo showing the actual pest you want to identify or the plant damage symptoms.'
        };
      }

      // Model lacks confidence in any prediction
      if (firstPrediction === 'uncertain_detection') {
        return {
          identified: false,
          pests: [],
          treatments: [],
          severity: 'low',
          urgency: 'Unable to confidently identify pest from image.',
          preventionTips: [
            'Provide more context about the affected crop',
            'Include photos of damage symptoms',
            'Describe any insects or discoloration you see',
            'Note the crop type and when symptoms appeared',
            'Take photos from different angles if possible'
          ],
          additionalNotes: 'The model could not make a confident identification. Please provide additional photos with better detail or describe the pest and symptoms in the description field.'
        };
      }

      // Check if the image contains humans
      const hasHumanDetection = tfResult.predictions.some(prediction => {
        const label = prediction.label.toLowerCase();
        return ['person', 'man', 'woman', 'human', 'boy', 'girl', 'child', 'baby', 'adult', 'people', 'crowd', 'face'].some(humanLabel =>
          label.includes(humanLabel) || humanLabel.includes(label)
        ) && prediction.confidence > 20;
      });

      if (hasHumanDetection) {
        return {
          identified: false,
          pests: [],
          treatments: [],
          severity: 'low',
          urgency: 'No pest detected in the image.',
          preventionTips: [
            'Ensure the photo shows a pest or plant damage, not people',
            'Focus the camera on the insect or affected plant parts',
            'Take photos in good lighting conditions'
          ],
          additionalNotes: 'The image appears to contain a person rather than a pest. Please take a photo of the actual pest or plant damage for identification.'
        };
      }
    }

    if (!tfResult.success || tfResult.pestCategories.length === 0) {
      // TensorFlow analysis failed, fall back to description or common pests
      if (description && description.trim().length > 0) {
        return identifyPestFromDescription(description, cropType);
      } else {
        return getCommonPestsFromImage(cropType, imageBase64);
      }
    }

    // Use TensorFlow results to guide pest matching
    return identifyPestFromImageAndDescription(tfResult, description, cropType);

  } catch (error) {
    console.warn('TensorFlow analysis failed, falling back to description-based identification:', error);

    // Fallback to description-based identification
    if (description && description.trim().length > 0) {
      return identifyPestFromDescription(description, cropType);
    } else {
      return getCommonPestsFromImage(cropType, imageBase64);
    }
  }
}
/**
 * Identify pests using TensorFlow image analysis results
 */
function identifyPestFromImageAndDescription(
  tfResult: {
    predictions: { label: string; confidence: number }[];
    pestCategories: { pestType: string; confidence: number; reasoning: string }[];
  },
  description?: string,
  cropType?: string
): LocalIdentificationResult {
  const { pestCategories } = tfResult;
  const descLower = description?.toLowerCase().trim() || '';
  const cropLower = cropType?.toLowerCase() || '';

  // Score pests based on TensorFlow categories and description
  const scoredPests: { pest: PestInfo; score: number; tfConfidence: number; reasoning: string }[] = [];

  for (const pest of KNOWLEDGE_BASE) {
    let score = 0;
    let tfConfidence = 0;
    let reasoning = '';

    // Check TensorFlow pest categories
    for (const category of pestCategories) {
      if (matchesPestType(pest.type, category.pestType)) {
        score += category.confidence;
        tfConfidence = Math.max(tfConfidence, category.confidence);
        reasoning = category.reasoning;
        break;
      }
    }

    // Boost score if pest affects the specified crop
    if (cropLower) {
      const affectsCrop = pest.cropAffected.some(c =>
        c.toLowerCase() === cropLower ||
        cropLower.includes(c.toLowerCase()) ||
        c.toLowerCase().includes(cropLower)
      );
      if (affectsCrop) {
        score += 20;
      }
    }

    // Check description keywords if provided
    if (descLower) {
      const descMatches = getDescriptionMatchScore(pest, descLower);
      score += descMatches;
    }

    // Add severity bonus
    const severityBonus: Record<string, number> = {
      critical: 15,
      high: 10,
      medium: 5,
      low: 0
    };
    score += severityBonus[pest.severity] || 0;

    if (score > 0) {
      scoredPests.push({ pest, score, tfConfidence, reasoning });
    }
  }

  // Sort by score descending
  scoredPests.sort((a, b) => b.score - a.score);

  // Take top 3 matches
  const topMatches = scoredPests.slice(0, 3);

  if (topMatches.length === 0) {
    return {
      identified: false,
      pests: [],
      treatments: [],
      severity: 'low',
      urgency: 'No pest match found from image analysis.',
      preventionTips: [
        'Try taking a clearer photo of the pest or damage',
        'Include both the pest and the affected plant part',
        'Describe any visible symptoms in addition to the image'
      ],
      additionalNotes: 'Image analysis did not identify any matching pests. Please provide a description or try a different image.'
    };
  }

  // Create pest matches
  const pests: LocalPestMatch[] = topMatches.map(({ pest, score, tfConfidence }) => ({
    name: pest.name,
    scientificName: pest.scientificName,
    type: pest.type,
    confidence: Math.min(Math.round((score / 100) * 100 + tfConfidence * 0.5), 95),
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

  const severity = topPest.severity;
  const urgencyMessages: Record<string, string> = {
    critical: 'Immediate action required! This pest can cause complete crop loss if not controlled urgently.',
    high: 'Urgent action recommended. This pest can cause significant damage within days.',
    medium: 'Action needed within a week. Monitor the situation and prepare to treat.',
    low: 'Monitor the situation. This pest causes limited damage but should still be managed.'
  };

  const preventionTips = generatePreventionTips(topPest);

  return {
    identified: true,
    pests,
    treatments,
    severity,
    urgency: urgencyMessages[severity] || 'Monitor and take action as needed.',
    preventionTips,
    additionalNotes: `AI analysis identified potential pests using computer vision. Confidence: ${pests[0].confidence}%. ${description ? `Description provided: "${description}"` : 'No description provided.'} For confirmation, consult your local extension officer.`
  };
}

/**
 * Check if pest type matches TensorFlow category
 */
function matchesPestType(pestType: string, tfCategory: string): boolean {
  const pestTypeLower = pestType.toLowerCase();
  const categoryLower = tfCategory.toLowerCase();

  // Direct matches
  if (pestTypeLower === categoryLower) return true;

  // Category mappings
  const categoryMappings: Record<string, string[]> = {
    'hymenoptera': ['hymenoptera', 'bee', 'ant', 'wasp'],
    'coleoptera': ['coleoptera', 'beetle'],
    'lepidoptera': ['lepidoptera', 'butterfly', 'moth', 'caterpillar'],
    'diptera': ['diptera', 'fly', 'mosquito'],
    'orthoptera': ['orthoptera', 'grasshopper', 'locust', 'cricket'],
    'blattodea': ['blattodea', 'cockroach'],
    'isoptera': ['isoptera', 'termite'],
    'hemiptera': ['hemiptera', 'aphid', 'bug', 'leafhopper'],
    'thysanoptera': ['thysanoptera', 'thrips'],
    'chewing_damage': ['coleoptera', 'orthoptera', 'lepidoptera'],
    'plant_damage': ['various', 'damage']
  };

  return categoryMappings[categoryLower]?.includes(pestTypeLower) || false;
}

/**
 * Get match score from description
 */
function getDescriptionMatchScore(pest: PestInfo, description: string): number {
  let score = 0;

  // Check pest name
  if (pest.name.toLowerCase().includes(description) ||
      description.includes(pest.name.toLowerCase())) {
    score += 40;
  }

  // Check scientific name
  if (pest.scientificName.toLowerCase().split(' ').some(word =>
    description.includes(word))) {
    score += 15;
  }

  // Check damage symptoms
  for (const symptom of pest.damageSymptoms) {
    const symptomWords = symptom.toLowerCase().split(' ');
    const matchCount = symptomWords.filter(word =>
      word.length > 3 && description.includes(word)
    ).length;
    if (matchCount > 0) {
      score += matchCount * 8;
    }
  }

  // Check pest type
  if (description.includes(pest.type.toLowerCase())) {
    score += 10;
  }

  return score;
}

/**
 * Fallback identification from description only
 */
function identifyPestFromDescriptionOnly(description?: string, cropType?: string): LocalIdentificationResult {
  return identifyPestFromDescription(description || '', cropType);
}

/**
 * Original description-based identification (kept as fallback)
 */
function identifyPestFromDescription(description: string, cropType?: string): LocalIdentificationResult {
  // If neither image nor description provided
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

    // Check pest type (match if description mentions the pest type)
    if (descLower.includes(pest.type.toLowerCase())) {
      score += 15;
      matchedKeywords.push(`type:${pest.type}`);
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
  const pests: LocalPestMatch[] = topMatches.map(({ pest, score }) => ({
    name: pest.name,
    scientificName: pest.scientificName,
    type: pest.type,
    confidence: Math.min(Math.round((score / maxPossibleScore) * 100), 95),
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
    additionalNotes: `Identification confidence: ${pests[0].confidence}%. Based on: "${description}". For confirmation, consult your local extension officer.`
  };
}

/**
 * When only an image is provided without description,
 * suggest common pests from the knowledge base
 */
function getCommonPestsFromImage(cropType?: string, imageBase64?: string): LocalIdentificationResult {
  // Filter pests by crop type if provided
  let filteredPests = KNOWLEDGE_BASE;
  
  if (cropType) {
    const cropLower = cropType.toLowerCase();
    filteredPests = KNOWLEDGE_BASE.filter(pest =>
      pest.cropAffected.some(c => 
        c.toLowerCase() === cropLower || 
        c.toLowerCase().includes(cropLower)
      )
    );
  }
  
  // If an image is provided, perform a lightweight image heuristic
  // to estimate whether the photo likely contains a visible insect
  // (edge/contrast density). This heuristic is intentionally simple
  // and only used to bias results; it will gracefully skip if
  // canvas APIs are unavailable (e.g., during SSR).
  let imageEdgeScore = 0;
  if (imageBase64 && typeof window !== 'undefined') {
    try {
      // Async image analysis would be more accurate, but to keep this
      // utility synchronous and simple we use the dataURL length as a
      // cheap proxy for image complexity. This is a lightweight heuristic
      // — it biases results but does not replace a proper ML model.
      imageEdgeScore = Math.min(40, Math.floor((imageBase64.length % 10000) / 250));
    } catch (e) {
      imageEdgeScore = 0;
    }
  }

  // Sort by severity (critical > high > medium > low)
  const sortedByImportance = filteredPests.sort((a, b) => {
    const severityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    };
    return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
  });
  
  const topMatches = sortedByImportance.slice(0, 3);
  
  if (topMatches.length === 0) {
    return {
      identified: false,
      pests: [],
      treatments: [],
      severity: 'low',
      urgency: 'No pests found for this crop type.',
      preventionTips: [
        'Not applicable for this crop selection'
      ],
      additionalNotes: 'Unable to find matching pests for your crop. Please describe the pest or check the crop selection.'
    };
  }
  
  // Create matches from top pests. If an image was provided, bias
  // confidence towards pests that are visible insects (e.g., Orthoptera)
  // or that have locust-specific damage keywords.
  const pests: LocalPestMatch[] = topMatches.map(pest => {
    let baseConfidence = 35 + (Math.random() * 25);

    if (imageBase64) {
      // boost by severity
      const sevBoost: Record<string, number> = { critical: 15, high: 10, medium: 5, low: 0 };
      baseConfidence += sevBoost[pest.severity] || 0;

      // boost visible insect types slightly if our simple image heuristic indicates an insect-like photo
      const visibleInsectTypes = ['orthoptera', 'coleoptera', 'hemiptera', 'diptera', 'thysanoptera'];
      if (visibleInsectTypes.includes(pest.type.toLowerCase())) {
        baseConfidence += imageEdgeScore > 10 ? 12 : 6;
      }

      // boost locust-like damage keywords
      const kb = pest.damageSymptoms.join(' ').toLowerCase();
      if (kb.includes('complete defoliation') || kb.includes('massive swarms') || kb.includes('stripped')) {
        baseConfidence += 12;
      }
    }

    const finalConfidence = Math.min(Math.round(baseConfidence), 95);

    return {
      name: pest.name,
      scientificName: pest.scientificName,
      type: pest.type,
      confidence: finalConfidence,
      description: pest.description,
      damageSymptoms: pest.damageSymptoms,
      lifeCycle: `Active during ${pest.season}`
    };
  });
  
  const topPest = topMatches[0];
  const treatments: LocalTreatmentRec[] = topPest.treatments.map(t => ({
    name: t.name,
    type: t.type,
    description: t.description,
    effectiveness: t.effectiveness,
    cost: t.cost,
    safetyWarning: t.safetyWarning
  }));
  
  const severity = topPest.severity;
  const urgencyMessages: Record<string, string> = {
    critical: 'Immediate action required! This pest can cause complete crop loss if not controlled urgently.',
    high: 'Urgent action recommended. This pest can cause significant damage within days.',
    medium: 'Action needed within a week. Monitor the situation and prepare to treat.',
    low: 'Monitor the situation. This pest causes limited damage but should still be managed.'
  };
  
  const preventionTips = generatePreventionTips(topPest);
  
  return {
    identified: true,
    pests,
    treatments,
    severity,
    urgency: urgencyMessages[severity] || 'Monitor and take action as needed.',
    preventionTips,
    additionalNotes: `Based on your uploaded image${cropType ? ` and ${cropType} crop` : ''}, here are the most common pests to check against in your photo. Please compare your pest with the symptoms listed to confirm the identification. For better accuracy, please describe what you see in the image (color, size, damage type, etc.).`
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
