import { CHORDS } from '../data/chords';
import { SCALES } from '../data/scales';

export const BUILTIN_SCALE_IDS = new Set(SCALES.map((s) => s.id));
export const BUILTIN_CHORD_IDS = new Set(CHORDS.map((c) => c.id));

export function isBuiltinScaleId(id: string): boolean {
  return BUILTIN_SCALE_IDS.has(id);
}

export function isBuiltinChordId(id: string): boolean {
  return BUILTIN_CHORD_IDS.has(id);
}
