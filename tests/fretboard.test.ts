import { describe, expect, it } from 'vitest';
import { midiNoteForFret } from '../src/domain/data/fretboard-matrix';
import { MVP_CHORD } from '../src/domain/data/chords';
import { MVP_KEY } from '../src/domain/data/keys';
import { MVP_SCALE } from '../src/domain/data/scales';
import {
  FRET_INLAY_POSITIONS,
  inlayDotCount,
} from '../src/domain/fret-inlays';
import { buildFretboard } from '../src/domain/fretboard';

const C_MAJOR_SCALE_BY_STRING: Record<number, number[]> = {
  0: [1, 3, 5, 7, 8, 10, 12, 13, 15, 17, 19, 20, 22, 24],
  1: [2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24],
  2: [2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19, 21, 22, 24],
  3: [2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 19, 21, 22, 24],
  4: [1, 3, 5, 6, 8, 10, 12, 13, 15, 17, 18, 20, 22, 24],
  5: [1, 3, 5, 7, 8, 10, 12, 13, 15, 17, 19, 20, 22, 24],
};

const C_MAJ7_CHORD_BY_STRING: Record<number, number[]> = {
  0: [3, 7, 8, 12, 15, 19, 20, 24],
  1: [2, 3, 7, 10, 14, 15, 19, 22],
  2: [2, 5, 9, 10, 14, 17, 21, 22],
  3: [4, 5, 9, 12, 16, 17, 21, 24],
  4: [1, 5, 8, 12, 13, 17, 20, 24],
  5: [3, 7, 8, 12, 15, 19, 20, 24],
};

const STRING_NUMBERS = [6, 5, 4, 3, 2, 1];

function toneFrets(
  model: ReturnType<typeof buildFretboard>,
  stringIndex: number,
  kind: 'scale' | 'chord',
): number[] {
  const row = model.strings[stringIndex];
  return row.frets
    .filter((c) => c.fret >= 1 && (kind === 'scale' ? c.inScale : c.inChord))
    .map((c) => c.fret);
}

describe('fret inlays', () => {
  it('uses standard inlay frets', () => {
    expect(FRET_INLAY_POSITIONS).toEqual([3, 5, 7, 9, 12, 15, 17, 19, 21]);
  });

  it('has double dots at 12th fret', () => {
    expect(inlayDotCount(12)).toBe(2);
    expect(inlayDotCount(3)).toBe(1);
    expect(inlayDotCount(4)).toBe(0);
  });
});

describe('buildFretboard MVP', () => {
  const model = buildFretboard(MVP_KEY, MVP_SCALE, MVP_KEY, MVP_CHORD);

  it('uses key C and Major / maj7', () => {
    expect(model.scaleKey.id).toBe('C');
    expect(model.chordKey.id).toBe('C');
    expect(model.scale.id).toBe('major');
    expect(model.chord.id).toBe('maj7');
  });

  it('shows +5 as half-width in labels', () => {
    const allLabels = model.strings.flatMap((s) =>
      s.frets.map((f) => f.intervalLabel),
    );
    expect(allLabels.some((l) => l.includes('＋'))).toBe(false);
    expect(allLabels.some((l) => l.includes('+5'))).toBe(true);
  });

  for (let s = 0; s < 6; s++) {
    it(`C Major scale tones on string ${STRING_NUMBERS[s]}`, () => {
      expect(toneFrets(model, s, 'scale').sort((a, b) => a - b)).toEqual(
        C_MAJOR_SCALE_BY_STRING[s],
      );
    });

    it(`C△7 chord tones on string ${STRING_NUMBERS[s]}`, () => {
      expect(toneFrets(model, s, 'chord').sort((a, b) => a - b)).toEqual(
        C_MAJ7_CHORD_BY_STRING[s],
      );
    });
  }
});

describe('midiNoteForFret', () => {
  it('maps open strings to standard tuning MIDI', () => {
    expect(midiNoteForFret(0, 0)).toBe(40);
    expect(midiNoteForFret(5, 0)).toBe(64);
    expect(midiNoteForFret(5, 12)).toBe(76);
  });
});
