export interface GuitarManifestEntry {
  midi: number;
  rootMidi: number;
  file: string;
  source?: string;
}

export interface GuitarManifest {
  source: string;
  sourceUrl: string;
  license: string;
  entries: GuitarManifestEntry[];
}

/** @deprecated GuitarManifestEntry の別名 */
export type SampleManifestEntry = GuitarManifestEntry;

/** @deprecated GuitarManifest の別名 */
export type SampleManifest = GuitarManifest;

const NOTE_TOKEN = /([A-Ga-g])([#bs]|s)?(\d+)/;

const NOTE_TO_PC: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function accidentalOffset(acc: string | undefined): number {
  if (acc === '#' || acc === 's') {
    return 1;
  }
  if (acc === 'b') {
    return -1;
  }
  return 0;
}

function entryLookupScore(entry: GuitarManifestEntry): number {
  let score = 0;
  if (entry.rootMidi === entry.midi) {
    score += 2;
  }
  const fromFile = parseMidiFromSampleFilename(entry.file);
  if (fromFile === entry.rootMidi) {
    score += 4;
  }
  if (fromFile !== undefined && fromFile !== entry.rootMidi) {
    score -= 6;
  }
  return score;
}

/** ファイル名（例: E2.wav, c2_s1_04.wav）から MIDI 番号を返す */
export function parseMidiFromSampleFilename(filename: string): number | undefined {
  const base = filename.replace(/\\/g, '/').split('/').pop()?.replace(/\.wav$/i, '') ?? '';
  const token = base.match(NOTE_TOKEN);
  if (token === null) {
    return undefined;
  }
  const letter = token[1].toUpperCase();
  const pcBase = NOTE_TO_PC[letter];
  if (pcBase === undefined) {
    return undefined;
  }
  const pc = (pcBase + accidentalOffset(token[2]) + 12) % 12;
  const octave = Number(token[3]);
  return pc + (octave + 1) * 12;
}

export function buildSampleLookup(
  entries: readonly GuitarManifestEntry[],
): Map<number, GuitarManifestEntry> {
  const byMidi = new Map<number, GuitarManifestEntry>();
  for (const entry of entries) {
    const existing = byMidi.get(entry.midi);
    if (existing === undefined || entryLookupScore(entry) > entryLookupScore(existing)) {
      byMidi.set(entry.midi, entry);
    }
  }
  return byMidi;
}

export function uniqueSampleRoots(
  entries: readonly GuitarManifestEntry[],
): GuitarManifestEntry[] {
  const byFile = new Map<string, GuitarManifestEntry>();
  for (const entry of entries) {
    if (!byFile.has(entry.file)) {
      byFile.set(entry.file, entry);
    }
  }
  return [...byFile.values()];
}

export function nearestSampleForMidi(
  midi: number,
  entries: readonly GuitarManifestEntry[],
): GuitarManifestEntry | undefined {
  const lookup = buildSampleLookup(entries);
  const exact = lookup.get(midi);
  if (exact !== undefined) {
    return exact;
  }

  const roots = uniqueSampleRoots([...lookup.values()]);
  if (roots.length === 0) {
    return undefined;
  }

  let best = roots[0];
  let bestDistance = Math.abs(midi - best.rootMidi);
  for (const entry of roots) {
    const distance = Math.abs(midi - entry.rootMidi);
    if (
      distance < bestDistance
      || (distance === bestDistance && entry.rootMidi < best.rootMidi)
    ) {
      best = entry;
      bestDistance = distance;
    }
  }
  return best;
}

export function playbackRateForMidi(
  targetMidi: number,
  rootMidi: number,
): number {
  return 2 ** ((targetMidi - rootMidi) / 12);
}
