import type { ChordDef } from '../data/chords';
import type { ScaleDef } from '../data/scales';
import type { StrumPatternDef } from '../strum-pattern/strum-pattern';

const STORAGE_KEY = 'guitar-practice-custom-library';

export interface CustomMusicLibrary {
  scales: ScaleDef[];
  chords: ChordDef[];
  strumPatterns: StrumPatternDef[];
}

const EMPTY_LIBRARY: CustomMusicLibrary = {
  scales: [],
  chords: [],
  strumPatterns: [],
};

export function loadCustomLibrary(): CustomMusicLibrary {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...EMPTY_LIBRARY };
    }
    const parsed = JSON.parse(raw) as Partial<CustomMusicLibrary>;
    return {
      scales: Array.isArray(parsed.scales) ? parsed.scales : [],
      chords: Array.isArray(parsed.chords) ? parsed.chords : [],
      strumPatterns: Array.isArray(parsed.strumPatterns)
        ? parsed.strumPatterns
        : [],
    };
  } catch {
    return { ...EMPTY_LIBRARY };
  }
}

export function saveCustomLibrary(library: CustomMusicLibrary): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

export function resetCustomLibrary(): void {
  localStorage.removeItem(STORAGE_KEY);
}
