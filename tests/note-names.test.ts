import { describe, expect, it } from 'vitest';
import { findKeyById } from '../src/domain/data/keys';
import { MVP_CHORD } from '../src/domain/data/chords';
import { MVP_KEY } from '../src/domain/data/keys';
import { MVP_SCALE } from '../src/domain/data/scales';
import { buildFretboard } from '../src/domain/fretboard';
import { displayLabelForCell } from '../src/domain/label-display-mode';
import {
  noteNameForPitchClass,
  spellNoteForSemitone,
  usesFlatNotationForScaleRoot,
} from '../src/domain/note-names';

describe('noteNameForPitchClass', () => {
  it('maps pitch classes with sharp style overload', () => {
    expect(noteNameForPitchClass(0, 'sharp')).toBe('C');
    expect(noteNameForPitchClass(8, 'sharp')).toBe('G#');
  });

  it('maps pitch classes with flat style overload', () => {
    expect(noteNameForPitchClass(8, 'flat')).toBe('Ab');
    expect(noteNameForPitchClass(10, 'flat')).toBe('Bb');
  });
});

describe('spellNoteForSemitone (key-aware)', () => {
  it('uses B# instead of C in F# major context', () => {
    const fSharp = findKeyById('F#')!;
    expect(noteNameForPitchClass(0, fSharp)).toBe('B#');
  });

  it('uses Cb for b2 of Bb key (pitch class B)', () => {
    const bb = findKeyById('Bb')!;
    expect(spellNoteForSemitone(bb, 1)).toBe('Cb');
    expect(noteNameForPitchClass(11, bb)).toBe('Cb');
  });

  it('uses E# for major 7th in F# key', () => {
    const fSharp = findKeyById('F#')!;
    expect(spellNoteForSemitone(fSharp, 11)).toBe('E#');
    expect(noteNameForPitchClass(5, fSharp)).toBe('E#');
  });

  it('uses flat spellings for Eb major context', () => {
    const eb = findKeyById('Eb')!;
    expect(spellNoteForSemitone(eb, 5)).toBe('Ab');
    expect(spellNoteForSemitone(eb, 0)).toBe('Eb');
  });
});

describe('flat scale root keys', () => {
  it('uses flat only for Eb, Ab, Bb keys', () => {
    expect(usesFlatNotationForScaleRoot(findKeyById('Eb')!)).toBe(true);
    expect(usesFlatNotationForScaleRoot(findKeyById('Ab')!)).toBe(true);
    expect(usesFlatNotationForScaleRoot(findKeyById('Bb')!)).toBe(true);
    expect(usesFlatNotationForScaleRoot(findKeyById('C')!)).toBe(false);
  });

  it('resolves legacy sharp key ids', () => {
    expect(findKeyById('A#')?.id).toBe('Bb');
  });
});

describe('buildFretboard note names', () => {
  const modelC = buildFretboard(MVP_KEY, MVP_SCALE, MVP_KEY, MVP_CHORD);
  const keyFSharp = findKeyById('F#')!;
  const modelFSharp = buildFretboard(
    keyFSharp,
    MVP_SCALE,
    MVP_KEY,
    MVP_CHORD,
  );

  it('6th string open is E in key C', () => {
    const open = modelC.strings[0].frets[0];
    expect(open.noteName).toBe('E');
    expect(open.intervalLabel).toBe('3');
  });

  it('spells pitch class 0 as B# in F# major (not C)', () => {
    expect(
      modelFSharp.strings[0].frets.some((c) => c.noteName === 'B#'),
    ).toBe(true);
    expect(
      modelFSharp.strings[0].frets.some((c) => c.noteName === 'C'),
    ).toBe(false);
  });

  it('displayLabelForCell switches by mode', () => {
    const cell = modelC.strings[0].frets[1];
    expect(displayLabelForCell(cell, 'interval')).toBe(cell.intervalLabel);
    expect(displayLabelForCell(cell, 'note')).toBe(cell.noteName);
  });
});
