/**
 * TensorFlow.js Custom-Trained Pest Classification Model
 * Uses our own trained pest identification model instead of generic MobileNetV2
 * Specialized for African agricultural pests with 30 pest classes
 */

import * as tf from '@tensorflow/tfjs';
import { PEST_CATEGORY_MAP } from '@/data/pestCategoryMap';

// Model, labels, and metadata cache
let customModel: tf.GraphModel | null = null;
let pestMetadata: any = null;
let pestClasses: string[] = [];
let isLoading = false;

const DEBUG_TF = (import.meta as any).env?.VITE_DEBUG_TF === 'true';


const CUSTOM_MODEL_URL = '/models/pest_model/saved_model/model.json';
const METADATA_URL = '/models/pest_model/metadata.json';

function isModelAvailable(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Load our custom-trained pest identification model
 */
export async function loadTensorFlowModel(): Promise<tf.GraphModel> {
  if (customModel) {
    return customModel;
  }

  if (isLoading) {
    // Wait for ongoing load
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (customModel) return customModel;
  }

  isLoading = true;

  try {
    if (DEBUG_TF) console.log('Loading custom-trained pest model...');
    customModel = await tf.loadGraphModel(CUSTOM_MODEL_URL);
    if (DEBUG_TF) console.log('✓ Custom pest model loaded successfully');

    // Load metadata with class information
    try {
      const response = await fetch(METADATA_URL);
      pestMetadata = await response.json();
      pestClasses = pestMetadata.classes || [];
      if (DEBUG_TF) {
        console.log(`✓ Model metadata loaded: ${pestClasses.length} pest classes`);
      }
    } catch (metadataError) {
      if (DEBUG_TF) {
        console.warn(
          'Could not load metadata, using fallback class names',
          metadataError
        );
      }
    }


    return customModel;
  } catch (error) {
    console.error('Failed to load custom pest model:', error);
    throw error;
  } finally {
    isLoading = false;
  }
}

/**
 * Preprocess image for the custom model (224x224, normalized)
 */
function preprocessImage(imageElement: HTMLImageElement): tf.Tensor {
  return tf.tidy(() => {
    // Resize image to 224x224
    const resized = tf.image.resizeBilinear(tf.browser.fromPixels(imageElement), [224, 224]);

    // Normalize to [0, 1]
    const normalized = resized.div(255.0);

    // Add batch dimension
    return normalized.expandDims(0);
  });
}

/**
 * Classify image using our custom-trained pest model
 * If no pest is detected, uses heuristics to identify what's in the image
 */
export async function classifyImageWithTensorFlow(
  imageBase64: string
): Promise<{ label: string; confidence: number }[]> {
  try {
    const modelInstance = await loadTensorFlowModel();

    // Create image element
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageBase64;
    });

    // Check image clarity before processing
    const clarityScore = assessImageClarity(img);
    if (DEBUG_TF) console.log(`Image clarity score: ${clarityScore.toFixed(2)}`);


    if (clarityScore < 0.3) {
      // Image is too unclear - return warning instead of fake results
      return [{
        label: 'unclear_image',
        confidence: 0
      }];
    }

    // Preprocess image
    const inputTensor = preprocessImage(img);

    // Run inference
    const predictions = modelInstance.predict(inputTensor) as tf.Tensor;
    const probabilities = predictions.dataSync();

    // Get all predictions with their confidence scores
    const allPredictions = Array.from(probabilities)
      .map((prob, index) => ({ 
        prob, 
        index,
        label: pestClasses[index] || `Pest_${index}`
      }))
      .sort((a, b) => b.prob - a.prob);

    // Filter out human-related classes
    const humanKeywords = ['person', 'human', 'man', 'woman', 'boy', 'girl', 'child', 'adult', 'face', 'people'];
    const nonHumanPredictions = allPredictions.filter(pred => 
      !humanKeywords.some(keyword => pred.label.toLowerCase().includes(keyword))
    );

    // Check if model detected a human
    const topPrediction = allPredictions[0];
    if (humanKeywords.some(keyword => topPrediction.label.toLowerCase().includes(keyword)) && topPrediction.prob > 0.4) {
      return [{
        label: 'not_a_pest',
        confidence: 0
      }];
    }

    // Filter pest predictions by confidence threshold (55%)
    const confidenceThreshold = 0.55;
    const pestResults = nonHumanPredictions.filter(item => item.prob >= confidenceThreshold).slice(0, 5);

    if (pestResults.length > 0) {
      // We found a confident pest match
      return pestResults.map(({ prob, label }) => ({
        label: label.toLowerCase(),
        confidence: Math.round(prob * 100)
      }));
    }

    // No confident pest match - try to identify what's in the image instead
    // Use top prediction from non-pest classes to describe what it is
    if (nonHumanPredictions.length > 0) {
      const topNonPestGuess = nonHumanPredictions[0];
      // If it's something other than a pest, return what it actually is
      return [{
        label: 'not_a_pest',
        confidence: 0
      }];
    }

    // Couldn't identify anything
    return [{
      label: 'uncertain_detection',
      confidence: 0
    }];

  } catch (error) {
    if (DEBUG_TF) console.warn('Custom model classification failed:', error);
    return [];
  }
}

/**
 * Assess image clarity/quality by analyzing edge density
 * Returns score 0-1 (0 = very unclear, 1 = very clear)
 */
function assessImageClarity(img: HTMLImageElement): number {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0.5;


    canvas.width = 128;
    canvas.height = 128;
    ctx.drawImage(img, 0, 0, 128, 128);

    const imageData = ctx.getImageData(0, 0, 128, 128);
    const data = imageData.data;

    let edgeCount = 0;
    let totalPixels = 0;

    // Simple edge detection - look for significant color changes
    for (let i = 0; i < data.length; i += 4) {
      if (i + 4 < data.length) {
        const r1 = data[i];
        const g1 = data[i + 1];
        const b1 = data[i + 2];
        
        const r2 = data[i + 4];
        const g2 = data[i + 5];
        const b2 = data[i + 6];

        const colorDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        
        if (colorDiff > 30) {
          edgeCount++;
        }
        totalPixels++;
      }
    }

    // Calculate clarity as proportion of edge pixels
    const clarityScore = Math.min(1, edgeCount / (totalPixels * 0.3));
    
    return clarityScore;
  } catch (error) {
    if (DEBUG_TF) console.warn('Could not assess image clarity:', error);
    return 0.5; // Default to uncertain
  }
}

/**
 * Map custom-trained pest model predictions to pest categories
 * The model output is already pest class names, so we just categorize them
 */
export function mapPredictionsToPests(
  predictions: { label: string; confidence: number }[]
): { pestType: string; confidence: number; reasoning: string }[] {
  // Handle special cases first
  if (predictions.length > 0) {
    const firstLabel = predictions[0].label.toLowerCase();
    
    // These are not actual pests - return empty to signal special handling
    if (firstLabel === 'unclear_image' || firstLabel === 'uncertain_detection') {
      return [];
    }
  }

  // Maps from pest name to category and description
const pestCategoryMap = PEST_CATEGORY_MAP;


  const pestResults: { pestType: string; confidence: number; reasoning: string }[] = [];

  for (const prediction of predictions) {
    const label = prediction.label.toLowerCase();

    // Direct match to our trained classes
    if (pestCategoryMap[label]) {
      pestResults.push({
        pestType: pestCategoryMap[label].pestType,
        confidence: prediction.confidence,
        reasoning: pestCategoryMap[label].reasoning
      });
    }
  }

  // If no direct matches, try partial matching
  if (pestResults.length === 0) {
    for (const prediction of predictions) {
      const label = prediction.label.toLowerCase();

      // Try partial matching
      for (const [pestName, mapping] of Object.entries(pestCategoryMap)) {
        if (label.includes(pestName.split(' ')[0]) || pestName.includes(label.split(' ')[0])) {
          pestResults.push({
            pestType: mapping.pestType,
            confidence: Math.floor(prediction.confidence * 0.8),
            reasoning: mapping.reasoning
          });
          break;
        }
      }
    }
  }

  // Remove duplicates and sort by confidence
  const uniqueResults = pestResults.filter((result, index, self) =>
    index === self.findIndex(r => r.pestType === result.pestType)
  );

  return uniqueResults.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Main function to analyze pest image with TensorFlow
 */
export async function analyzePestImageWithTensorFlow(
  imageBase64: string
): Promise<{
  predictions: { label: string; confidence: number }[];
  pestCategories: { pestType: string; confidence: number; reasoning: string }[];
  success: boolean;
}> {
  try {
    const predictions = await classifyImageWithTensorFlow(imageBase64);
    const pestCategories = mapPredictionsToPests(predictions);

    return {
      predictions,
      pestCategories,
      success: true
    };
  } catch (error) {
    console.error('TensorFlow pest analysis failed:', error);
    return {
      predictions: [],
      pestCategories: [],
      success: false
    };
  }
}