import { describe, expect, it } from 'vitest';
import {
  chordRootOptionsForScaleKey,
  remapChordKeyIdForScaleKey,
} from '../src/domain/chord-root-options';
import { findKeyById } from '../src/domain/data/keys';
import { usesMixedAccidentals } from '../src/domain/note-names';

describe('chordRootOptionsForScaleKey', () => {
  it('shows Gb (not F#) when scale root is Ab', () => {
    const ab = findKeyById('Ab')!;
    const options = chordRootOptionsForScaleKey(ab);
    const pc6 = options.find((o) => o.pitchClass === 6);
    expect(pc6?.name).toBe('Gb');
    expect(pc6?.id).toBe('F#');
  });

  it('shows F# (not Gb) when scale root is D', () => {
    const d = findKeyById('D')!;
    const options = chordRootOptionsForScaleKey(d);
    const pc6 = options.find((o) => o.pitchClass === 6);
    expect(pc6?.name).toBe('F#');
  });

  it('shows Bb for pitch class 10 when scale root is Ab', () => {
    const ab = findKeyById('Ab')!;
    const options = chordRootOptionsForScaleKey(ab);
    expect(options.find((o) => o.pitchClass === 10)?.name).toBe('Bb');
  });

  it('does not mix sharps and flats in option labels', () => {
    for (const id of ['C', 'Ab', 'Eb', 'F#', 'D'] as const) {
      const key = findKeyById(id)!;
      const names = chordRootOptionsForScaleKey(key).map((o) => o.name);
      expect(usesMixedAccidentals(names)).toBe(false);
    }
  });
});

describe('remapChordKeyIdForScaleKey', () => {
  it('keeps pitch class when scale key changes', () => {
    const ab = findKeyById('Ab')!;
    expect(remapChordKeyIdForScaleKey('F#', ab)).toBe('F#');
    expect(remapChordKeyIdForScaleKey('A#', ab)).toBe('Bb');
  });
});
