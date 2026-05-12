import * as tf from '@tensorflow/tfjs';
import { parseClassesTxt } from './parseClassesTxt';

export interface YoloDetection {
  label: string;
  confidence: number; // 0-100
}

let modelPromise: Promise<tf.GraphModel> | null = null;
let classes: string[] = [];

const YOLO_MODEL_URL = '/yolo_ip102.pt/model.json';
const METADATA_URL = '/yolo_ip102.pt/metadata.yaml';
const CLASSES_TXT_URL = '/yolo_ip102.pt/classes.txt';

function loadClassesFromClassesTxt(text: string): string[] {
  // classes.txt format example:
  //   45  alfalfa weevil
  //   46  flax budworm
  const map: Record<number, string> = {};
  const lines = text.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const m = line.match(/^(\d+)\s+(.*)$/);
    if (!m) continue;

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
  // Very small YAML parser for the `names:` section.
  // Expected format:
  // names:
  //   0: label0
  //   1: label1
  // ...

  const map: Record<number, string> = {};
  const lines = text.split(/\r?\n/);

  let inNames = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith('names:')) {
      inNames = true;
      continue;
    }

    if (inNames) {
      // Stop if we hit another top-level key
      if (
        !rawLine.startsWith(' ') &&
        trimmed.includes(':') &&
        !trimmed.match(/^\d+:/)
      ) {
        inNames = false;
        continue;
      }

      const m = trimmed.match(/^(\d+)\s*:\s*(.+)$/);

      if (m) {
        const idx = Number(m[1]) - 1;
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
      // Prefer classes.txt if available
      try {
        const classesRes = await fetch(CLASSES_TXT_URL);

        if (classesRes.ok) {
          const txt = await classesRes.text();

          classes = loadClassesFromClassesTxt(txt);

          if (classes.length > 0) {
            return tf.loadGraphModel(YOLO_MODEL_URL);
          }
        }
      } catch {
        // ignore and fallback
      }

      const metadataRes = await fetch(METADATA_URL);
      const yaml = await metadataRes.text();

      classes = loadClassesFromMetadataYaml(yaml);

      return tf.loadGraphModel(YOLO_MODEL_URL);
    })();
  }

  return modelPromise;
}

function preprocessForModel(img: HTMLImageElement): tf.Tensor4D {
  // Model expects [1,896,896,3]

  return tf.tidy(() => {
    const resized = tf.image.resizeBilinear(
      tf.browser.fromPixels(img),
      [896, 896]
    );

    const normalized = resized.div(255.0);

    return normalized.expandDims(0) as tf.Tensor4D;
  });
}

export async function detectWithYolo(
  imageBase64: string
): Promise<YoloDetection[]> {
  try {
    const model = await loadModel();

    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageBase64;
    });

    const input = preprocessForModel(img);

    const outputs = model.predict(input) as tf.Tensor | tf.Tensor[];

    const first = Array.isArray(outputs) ? outputs[0] : outputs;

    const shape = Array.isArray((first as any).shape)
      ? ((first as any).shape as number[])
      : [];

    console.log('[YOLO] first output shape:', shape);

    const data = Array.from(first.dataSync());

    console.log(
      `[YOLO] full shape: ${JSON.stringify(shape)}, length: ${data.length}`
    );

    function pickLabelFromClassIndex(classIdx: number): string {
      if (classIdx >= 0 && classIdx < classes.length) {
        return classes[classIdx];
      }

      return `class_${classIdx}`;
    }

    let out: YoloDetection[] = [];

    const shapes = Array.isArray((first as any).shape)
      ? ((first as any).shape as number[])
      : [];

    // Confidence normalization
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

    const toConfidence0to100 = (raw: number) => {
      const p = raw >= 0 && raw <= 1 ? raw : sigmoid(raw);

      return Math.max(0, Math.min(100, Math.round(p * 100)));
    };

    // Threshold
    const CONFIDENCE_THRESHOLD_PROB = 0.1;

    const passesThreshold0to100 = (confidence0to100: number) =>
      confidence0to100 >=
      Math.round(CONFIDENCE_THRESHOLD_PROB * 100);

    // Case A: class scores vector
    if (shapes.length === 1 && shapes[0] > 1) {
      const paired = data.map((v, i) => ({
        rawScore: v,
        label: pickLabelFromClassIndex(i)
      }));

      paired.sort((a, b) => b.rawScore - a.rawScore);

      out = paired
        .slice(0, 50)
        .map((t) => {
          const confidence = toConfidence0to100(t.rawScore);

          return {
            label: t.label,
            confidence
          };
        })
        .filter((d) => passesThreshold0to100(d.confidence))
        .slice(0, 5);

      console.log(
        '[YOLO] class-vector top raw/picked:',
        paired.slice(0, 5)
      );

    } else if (
      shapes.length === 2 &&
      shapes[0] === 1 &&
      shapes[1] > 1
    ) {
      const n = shapes[1];

      const paired = data.slice(0, n).map((v, i) => ({
        rawScore: v,
        label: pickLabelFromClassIndex(i)
      }));

      paired.sort((a, b) => b.rawScore - a.rawScore);

      out = paired
        .slice(0, 50)
        .map((t) => {
          const confidence = toConfidence0to100(t.rawScore);

          return {
            label: t.label,
            confidence
          };
        })
        .filter((d) => passesThreshold0to100(d.confidence))
        .slice(0, 5);

    } else if (shapes.length === 3 && shapes[1] === 106) {
      // YOLOv8 channels-first: [1, 106, 16464]
      // 106 = 4 bbox + 102 classes

      const numDetections = shapes[2];
      const numClasses = classes.length;

      const detections: YoloDetection[] = [];

      for (let i = 0; i < numDetections; i++) {
        let bestClass = -1;
        let bestScore = -Infinity;

        for (let c = 0; c < numClasses; c++) {
          const index = (4 + c) * numDetections + i;

          const score = data[index];

          if (score > bestScore) {
            bestScore = score;
            bestClass = c;
          }
        }

        const confidence = toConfidence0to100(bestScore);

        if (!passesThreshold0to100(confidence)) {
          continue;
        }

        detections.push({
          label: pickLabelFromClassIndex(bestClass),
          confidence
        });
      }

      // Keep highest confidence per label
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
      console.warn('[YOLO] Unhandled tensor shape:', shapes);
      out = [];
    }

    input.dispose();

    return out.filter((d) => d.confidence > 0);

  } catch (e) {
    console.warn('YOLO detection failed:', e);
    return [];
  }
}