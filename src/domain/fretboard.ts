import { FRETBOARD_MATRIX, MAX_FRET, STRING_NAMES } from './data/fretboard-matrix';
import type { ChordDef } from './data/chords';
import type { KeyDef } from './data/keys';
import type { ScaleDef } from './data/scales';
import {
  labelForSemitone,
  labelInToneSet,
  semitoneFromRoot,
  semitonesFromTones,
} from './interval-labels';
import { noteNameForPitchClass } from './note-names';

export interface FretCell {
  stringIndex: number;
  fret: number;
  /** スケールルート基準のインターバル表示 */
  intervalLabel: string;
  /** 実音名（シャープ表記） */
  noteName: string;
  /** スケールルートからの半音数 */
  scaleSemitone: number;
  /** コードルートからの半音数 */
  chordSemitone: number;
  inScale: boolean;
  inChord: boolean;
  isScaleRoot: boolean;
  isChordRoot: boolean;
}

export interface FretboardModel {
  scaleKey: KeyDef;
  chordKey: KeyDef;
  scale: ScaleDef;
  chord: ChordDef;
  strings: {
    name: string;
    frets: FretCell[];
  }[];
}

export function buildFretboard(
  scaleKey: KeyDef,
  scale: ScaleDef,
  chordKey: KeyDef,
  chord: ChordDef,
): FretboardModel {
  const scaleSemitones = semitonesFromTones(scale.tones);
  const chordSemitones = semitonesFromTones(chord.tones);

  const strings = FRETBOARD_MATRIX.map((row, stringIndex) => {
    const frets: FretCell[] = [];
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      const pitchClass = row[fret];
      const scaleSemitone = semitoneFromRoot(pitchClass, scaleKey.pitchClass);
      const chordSemitone = semitoneFromRoot(pitchClass, chordKey.pitchClass);
      const intervalLabel = labelForSemitone(scaleSemitone);

      frets.push({
        stringIndex,
        fret,
        intervalLabel,
        noteName: noteNameForPitchClass(pitchClass),
        scaleSemitone,
        chordSemitone,
        inScale: scaleSemitones.has(scaleSemitone),
        inChord: chordSemitones.has(chordSemitone),
        isScaleRoot: scaleSemitone === 0,
        isChordRoot: chordSemitone === 0,
      });
    }

    return {
      name: STRING_NAMES[stringIndex],
      frets,
    };
  });

  return { scaleKey, chordKey, scale, chord, strings };
}

/** ラベル一致ベースの検証用（スケールルート基準ラベルと master 構成音の整合） */
export function cellMatchesScale(cell: FretCell, scale: ScaleDef): boolean {
  return labelInToneSet(cell.intervalLabel, scale.tones);
}

export function cellMatchesChord(cell: FretCell, chord: ChordDef): boolean {
  const chordLabel = labelForSemitone(cell.chordSemitone);
  return labelInToneSet(chordLabel, chord.tones);
}
