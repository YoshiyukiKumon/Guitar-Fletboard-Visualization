import { describe, expect, it } from 'vitest';
import { MVP_SCALE } from '../src/domain/data/scales';
import { MVP_CHORD } from '../src/domain/data/chords';
import { KEYS } from '../src/domain/data/keys';
import {
  formatChordName,
  formatScaleChordSummary,
  formatScaleName,
  midiNoteNumber,
  noteNamesFromTones,
  orderedSemitonesFromTones,
} from '../src/domain/tone-sequence';

describe('orderedSemitonesFromTones', () => {
  it('returns C major scale in definition order', () => {
    expect(orderedSemitonesFromTones(MVP_SCALE.tones)).toEqual([
      0, 2, 4, 5, 7, 9, 11,
    ]);
  });

  it('returns maj7 chord tones in definition order', () => {
    expect(orderedSemitonesFromTones(MVP_CHORD.tones)).toEqual([0, 4, 7, 11]);
  });
});

describe('display names', () => {
  it('formats scale and chord titles', () => {
    const keyD = KEYS.find((k) => k.id === 'D')!;
    expect(formatScaleName(keyD, MVP_SCALE)).toBe('D Major');
    expect(formatChordName(keyD, MVP_CHORD)).toBe('D△7');
    expect(formatScaleChordSummary(keyD, MVP_SCALE, keyD, MVP_CHORD)).toBe(
      'D Major / D△7',
    );
  });

  it('lists note names for C major scale', () => {
    const keyC = KEYS.find((k) => k.id === 'C')!;
    expect(noteNamesFromTones(keyC, MVP_SCALE.tones)).toBe(
      'C · D · E · F · G · A · B',
    );
  });
});

describe('midiNoteNumber', () => {
  it('maps C root R to MIDI 60', () => {
    expect(midiNoteNumber(0, 0)).toBe(60);
  });

  it('maps A root R to MIDI 69', () => {
    expect(midiNoteNumber(9, 0)).toBe(69);
  });
});
