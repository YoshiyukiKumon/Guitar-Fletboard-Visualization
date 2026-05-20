import { findChordById, MVP_CHORD } from './data/chords';
import { findKeyById, MVP_KEY } from './data/keys';
import { findScaleById, MVP_SCALE } from './data/scales';
import type { ChordDef } from './data/chords';
import type { KeyDef } from './data/keys';
import type { ScaleDef } from './data/scales';

export interface MusicSelection {
  scaleKeyId: string;
  scaleId: string;
  chordKeyId: string;
  chordId: string;
}

export interface ResolvedMusicSelection {
  scaleKey: KeyDef;
  scale: ScaleDef;
  chordKey: KeyDef;
  chord: ChordDef;
}

export function resolveMusicSelection(
  selection: MusicSelection,
): ResolvedMusicSelection {
  return {
    scaleKey: findKeyById(selection.scaleKeyId) ?? MVP_KEY,
    scale: findScaleById(selection.scaleId) ?? MVP_SCALE,
    chordKey: findKeyById(selection.chordKeyId) ?? MVP_KEY,
    chord: findChordById(selection.chordId) ?? MVP_CHORD,
  };
}
