export function parseClassesTxt(text: string): string[] {
  // Expected format (YOLO export):
  //  1  rice leaf roller
  //  2  rice leaf caterpillar
  // Notes:
  // - Lines may contain Windows CRLF and tab padding.
  // - Indices should be numeric; labels are the remainder of the line.
  // - Some files may have leading/trailing whitespace.
  //
  // Important: many YOLO exports use 1-based class indices in classes.txt,
  // while model outputs are 0-based. We normalize to a 0-based array.

  const map: Record<number, string> = {};
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const m = line.match(/^(\d+)\s+(.*)$/);
    if (!m) continue;

    const idx = Number(m[1]);
    const label = m[2].trim();
    map[idx] = label;
  }

  const numericKeys = Object.keys(map)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n));

  const minIdx = numericKeys.length ? Math.min(...numericKeys) : 0;
  const maxIdx = numericKeys.length ? Math.max(...numericKeys) : -1;

  // If indices start at 1, shift them down so array index 0 matches classId 0.
  const shouldShiftToZeroBased = minIdx === 1;
  const shift = shouldShiftToZeroBased ? -1 : 0;

  const out: string[] = [];
  for (let classId = 0; classId <= maxIdx + shift; classId++) {
    const originalIdx = classId - shift;
    out.push(map[originalIdx] ?? `class_${classId}`);
  }

  return out;
}

