import * as tf from '@tensorflow/tfjs';

export interface YoloDetection {
  label: string;
  confidence: number; // 0-100
}

const DEBUG_YOLO = (import.meta as any).env?.VITE_DEBUG_YOLO === 'true';

let modelPromise: Promise<tf.GraphModel> | null = null;
let classes: string[] = [];

const YOLO_MODEL_URL = '/yolo_ip102.pt/model.json';
const METADATA_URL = '/yolo_ip102.pt/metadata.yaml';
const CLASSES_TXT_URL = '/yolo_ip102.pt/classes.txt';

/**
 * Loads IP102 classes from classes.txt
 *
 * IMPORTANT:
 * IP102 numbering starts at 1
 * YOLO class indices start at 0
 *
 * So:
 * 1 rice leaf roller -> classes[0]
 */
function loadClassesFromClassesTxt(text: string): string[] {
  const map: Record<number, string> = {};

  const lines = text.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) continue;

    const m = line.match(/^(\d+)\s+(.*)$/);

    if (!m) continue;

    // FIXED OFFSET: IP102 starts at 1, YOLO indices start at 0
    const idx = Number(m[1]) - 1;

    const label = m[2].trim();

    map[idx] = label;
  }

  const maxIdx = Object.keys(map).reduce(
    (acc, k) => Math.max(acc, Number(k)),
    -1
  );

  const out: string[] = [];

  for (let i = 0; i <= maxIdx; i++) {
    out.push(map[i] ?? `class_${i}`);
  }

  return out;
}

function loadClassesFromMetadataYaml(text: string): string[] {
  const map: Record<number, string> = {};

  const lines = text.split(/\r?\n/);

  let inNames = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith('names:')) {
      inNames = true;
      continue;
    }

    if (inNames) {
      const m = trimmed.match(/^(\d+)\s*:\s*(.+)$/);

      if (m) {
        const idx = Number(m[1]);
        const label = m[2].trim();

        map[idx] = label;
      }
    }
  }

  const maxIdx = Object.keys(map).reduce(
    (acc, k) => Math.max(acc, Number(k)),
    -1
  );

  const out: string[] = [];

  for (let i = 0; i <= maxIdx; i++) {
    out.push(map[i] ?? `class_${i}`);
  }

  return out;
}

async function loadModel(): Promise<tf.GraphModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        const classesRes = await fetch(CLASSES_TXT_URL);

        if (classesRes.ok) {
          const txt = await classesRes.text();

          classes = loadClassesFromClassesTxt(txt);

          if (DEBUG_YOLO) console.log('[YOLO] Loaded classes:', classes.length);

          if (classes.length > 0) {
            return await tf.loadGraphModel(YOLO_MODEL_URL);
          }
        }
      } catch (e) {
        if (DEBUG_YOLO) console.warn('[YOLO] Failed loading classes.txt:', e);
      }

      // fallback to metadata.yaml
      const metadataRes = await fetch(METADATA_URL);

      const yaml = await metadataRes.text();

      classes = loadClassesFromMetadataYaml(yaml);

      if (DEBUG_YOLO) console.log('[YOLO] Loaded YAML classes:', classes.length);

      return await tf.loadGraphModel(YOLO_MODEL_URL);
    })().catch((e) => {
      // ✅ FIX: Reset promise on failure so the next call retries cleanly
      modelPromise = null;
      throw e;
    });
  }

  return modelPromise;
}

function preprocessForModel(img: HTMLImageElement): tf.Tensor4D {
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(img);

    const resized = tf.image.resizeBilinear(tensor, [896, 896]);

    const normalized = resized.div(255.0);

    return normalized.expandDims(0) as tf.Tensor4D;
  });
}

function pickLabelFromClassIndex(classIdx: number): string {
  if (classIdx >= 0 && classIdx < classes.length) {
    return classes[classIdx];
  }

  return `class_${classIdx}`;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function toConfidence0to100(raw: number): number {
  const prob = raw >= 0 && raw <= 1 ? raw : sigmoid(raw);

  return Math.max(0, Math.min(100, Math.round(prob * 100)));
}

export async function detectWithYolo(
  imageBase64: string
): Promise<YoloDetection[]> {
  try {
    const model = await loadModel();

    if (DEBUG_YOLO) {
      try {
        console.log('[YOLO] Model inputs:', model.inputs?.map((t) => ({
          name: (t as any).name,
          shape: t.shape,
          dtype: t.dtype,
        })));
        console.log('[YOLO] Model outputs:', model.outputs?.map((t) => ({
          name: (t as any).name,
          shape: t.shape,
          dtype: t.dtype,
        })));
      } catch (e) {
        console.warn('[YOLO] Could not log model IO:', e);
      }
    }

    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageBase64;
    });

    const input = preprocessForModel(img);

    if (DEBUG_YOLO) {
      console.log('[YOLO] Input tensor shape:', input.shape);
    }

    const prediction = model.predict(input) as tf.Tensor | tf.Tensor[];

    if (DEBUG_YOLO) {
      if (Array.isArray(prediction)) {
        console.log('[YOLO] Prediction is array. Shapes:', prediction.map((t) => t.shape));
      } else {
        console.log('[YOLO] Prediction tensor shape:', prediction.shape);
      }
    }

    const first = Array.isArray(prediction)
      ? prediction[0]
      : prediction;

    if (DEBUG_YOLO && Array.isArray(prediction) && prediction.length > 1) {
      try {
        console.log('[YOLO] Additional output tensors shapes:', prediction.slice(1).map((t) => t.shape));
      } catch {
        // noop
      }
    }

    const shape = first.shape;

    if (DEBUG_YOLO) console.log('[YOLO] Output shape:', shape);

    const data = Array.from(first.dataSync());

    if (DEBUG_YOLO) console.log('[YOLO] Tensor length:', data.length);

    const CONFIDENCE_THRESHOLD = 35;

    let out: YoloDetection[] = [];

    /**
     * YOLOv8 TFJS Expected Shape: [1, channels, detections]
     * IP102: channels = 4 bbox + 102 classes
     */
    if (shape.length === 3) {
      const [batch, channels, numDetections] = shape;

      if (DEBUG_YOLO) {
        console.log({ batch, channels, numDetections });
      }

      const numClasses = classes.length;

      const detections: YoloDetection[] = [];

      for (let i = 0; i < numDetections; i++) {
        let bestClass = -1;
        let bestScore = -Infinity;

        /**
         * Layout:
         * channel 0-3 = bbox
         * channel 4+ = class scores
         */
        for (let c = 0; c < numClasses; c++) {
          const index = (4 + c) * numDetections + i;
          const score = data[index];

          if (score > bestScore) {
            bestScore = score;
            bestClass = c;
          }
        }

        const confidence = toConfidence0to100(bestScore);

        if (confidence < CONFIDENCE_THRESHOLD) {
          continue;
        }

        const label = pickLabelFromClassIndex(bestClass);

        if (DEBUG_YOLO) {
          console.log({ bestClass, label, bestScore, confidence });
        }

        detections.push({ label, confidence });
      }

      // Remove duplicates — keep highest confidence per label
      const unique = new Map<string, YoloDetection>();

      for (const d of detections) {
        const existing = unique.get(d.label);

        if (!existing || d.confidence > existing.confidence) {
          unique.set(d.label, d);
        }
      }

      out = Array.from(unique.values())
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
    } else {
      if (DEBUG_YOLO) console.warn('[YOLO] Unsupported tensor shape:', shape);
      out = [];
    }

    input.dispose();

    if (Array.isArray(prediction)) {
      prediction.forEach((p) => p.dispose());
    } else {
      prediction.dispose();
    }

    return out;

  } catch (e) {
    console.warn('[YOLO] Detection failed:', e);
    return [];
  }
}