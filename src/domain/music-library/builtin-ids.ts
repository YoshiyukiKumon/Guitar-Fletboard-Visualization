import { CHORDS } from '../data/chords';
import { SCALES } from '../data/scales';
import { BUILTIN_STRUM_PATTERNS } from '../strum-pattern/strum-pattern';

export const BUILTIN_SCALE_IDS = new Set(SCALES.map((s) => s.id));
export const BUILTIN_CHORD_IDS = new Set(CHORDS.map((c) => c.id));
export const BUILTIN_STRUM_PATTERN_IDS = new Set(
  BUILTIN_STRUM_PATTERNS.map((pattern) => pattern.id),
);

export function isBuiltinScaleId(id: string): boolean {
  return BUILTIN_SCALE_IDS.has(id);
}

export function isBuiltinChordId(id: string): boolean {
  return BUILTIN_CHORD_IDS.has(id);
}

export function isBuiltinStrumPatternId(id: string): boolean {
  return BUILTIN_STRUM_PATTERN_IDS.has(id);
}
