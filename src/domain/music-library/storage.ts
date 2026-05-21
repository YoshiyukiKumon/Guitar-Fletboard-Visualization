import type { ChordDef } from '../data/chords';
import type { ScaleDef } from '../data/scales';

const STORAGE_KEY = 'guitar-practice-custom-library';

export interface CustomMusicLibrary {
  scales: ScaleDef[];
  chords: ChordDef[];
}

const EMPTY_LIBRARY: CustomMusicLibrary = {
  scales: [],
  chords: [],
};

export function loadCustomLibrary(): CustomMusicLibrary {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...EMPTY_LIBRARY, scales: [], chords: [] };
    }
    const parsed = JSON.parse(raw) as Partial<CustomMusicLibrary>;
    return {
      scales: Array.isArray(parsed.scales) ? parsed.scales : [],
      chords: Array.isArray(parsed.chords) ? parsed.chords : [],
    };
  } catch {
    return { scales: [], chords: [] };
  }
}

export function saveCustomLibrary(library: CustomMusicLibrary): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

export function resetCustomLibrary(): void {
  localStorage.removeItem(STORAGE_KEY);
}
