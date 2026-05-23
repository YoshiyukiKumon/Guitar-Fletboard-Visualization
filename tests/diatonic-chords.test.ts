import { describe, expect, it } from 'vitest';
import { KEYS } from '../src/domain/data/keys';
import { MVP_SCALE } from '../src/domain/data/scales';
import { findScaleById } from '../src/domain/data/scales';
import { computeDiatonicChords } from '../src/domain/diatonic-chords';

function key(id: string) {
  const k = KEYS.find((x) => x.id === id);
  if (!k) {
    throw new Error(`key ${id}`);
  }
  return k;
}

describe('computeDiatonicChords', () => {
  it('rejects scales with fewer than 4 tones', () => {
    const result = computeDiatonicChords(key('C'), {
      id: 'tiny',
      name: 'Tiny',
      tones: ['R', '3', '5'],
    });
    expect(result.supported).toBe(false);
    if (!result.supported) {
      expect(result.reason).toBe('too-few-tones');
    }
  });

  it('C major: 7 seventh chords with relative labels', () => {
    const result = computeDiatonicChords(key('C'), MVP_SCALE);
    expect(result.supported).toBe(true);
    if (!result.supported) {
      return;
    }
    expect(result.entries).toHaveLength(7);
    expect(result.entries.map((e) => e.relativeLabel)).toEqual([
      'I△7',
      'IIm7',
      'IIIm7',
      'IV△7',
      'V7',
      'VIm7',
      'VIIm7(♭5)',
    ]);
    expect(result.entries.map((e) => e.displayName)).toEqual([
      'C△7',
      'Dm7',
      'Em7',
      'F△7',
      'G7',
      'Am7',
      'Bm7-5 (∅)',
    ]);
  });

  it('A natural minor: flat degree prefixes on III, VI, VII', () => {
    const scale = findScaleById('natural-minor');
    expect(scale).toBeDefined();
    const result = computeDiatonicChords(key('A'), scale!);
    expect(result.supported).toBe(true);
    if (!result.supported) {
      return;
    }
    expect(result.entries.map((e) => e.relativeLabel)).toEqual([
      'Im7',
      'IIm7(♭5)',
      '♭III△7',
      'IVm7',
      'Vm7',
      '♭VI△7',
      '♭VII7',
    ]);
  });

  it('C major pentatonic: 5 rows with relative labels even without chord defs', () => {
    const scale = findScaleById('major-penta');
    expect(scale).toBeDefined();
    const result = computeDiatonicChords(key('C'), scale!);
    expect(result.supported).toBe(true);
    if (!result.supported) {
      return;
    }
    expect(result.entries).toHaveLength(5);
    expect(result.entries.every((e) => e.chordId === null)).toBe(true);
    expect(result.entries.every((e) => e.relativeLabel.length > 0)).toBe(true);
    expect(
      result.entries.every((e) => e.playbackSemitones.length >= 3),
    ).toBe(true);
  });

  it('uses triad notation when stacked tones collapse to 3 unique pitch classes', () => {
    const scale = findScaleById('whole-tone');
    expect(scale).toBeDefined();
    const result = computeDiatonicChords(key('C'), scale!);
    expect(result.supported).toBe(true);
    if (!result.supported) {
      return;
    }
    expect(result.entries).toHaveLength(6);
    expect(result.entries.every((e) => e.playbackSemitones.length === 3)).toBe(
      true,
    );
    expect(result.entries.every((e) => e.chordId === 'aug')).toBe(true);
    expect(result.entries[0]?.relativeLabel).toBe('Iaug');
    expect(result.entries[0]?.displayName).toBe('Caug');
  });

  it('half-whole dim: 8 dim7 chords from stacked scale tones', () => {
    const scale = findScaleById('half-whole-dim');
    expect(scale).toBeDefined();
    expect(scale!.tones).toHaveLength(8);
    const result = computeDiatonicChords(key('C'), scale!);
    expect(result.supported).toBe(true);
    if (!result.supported) {
      return;
    }
    expect(result.entries).toHaveLength(8);
    expect(result.entries.every((e) => e.chordId === 'dim7')).toBe(true);
    expect(result.entries.map((e) => e.relativeLabel)).toEqual([
      'Idim7',
      '♭IIdim7',
      '♭IIIdim7',
      '♭IVdim7',
      '♭Vdim7',
      'VIdim7',
      'VIIdim7',
      'VIIIdim7',
    ]);
  });

  it('whole-half dim: 8 dim7 chords from stacked scale tones', () => {
    const scale = findScaleById('whole-half-dim');
    expect(scale).toBeDefined();
    expect(scale!.tones).toHaveLength(8);
    const result = computeDiatonicChords(key('C'), scale!);
    expect(result.supported).toBe(true);
    if (!result.supported) {
      return;
    }
    expect(result.entries).toHaveLength(8);
    expect(result.entries.every((e) => e.chordId === 'dim7')).toBe(true);
  });

  it('C altered: 7 seventh chords including IV aug maj7', () => {
    const scale = findScaleById('altered');
    expect(scale).toBeDefined();
    const result = computeDiatonicChords(key('C'), scale!);
    expect(result.supported).toBe(true);
    if (!result.supported) {
      return;
    }
    expect(result.entries).toHaveLength(7);
    const fourth = result.entries.find((e) => e.degree === 4);
    expect(fourth).toEqual(
      expect.objectContaining({
        chordId: 'maj7-sharp5',
        relativeLabel: '♭IV△7(+5)',
        displayName: 'E△7(+5)',
      }),
    );
  });

  it('diminished 6th scale: 8 diatonic chords with I6 slash inversions', () => {
    const scale = findScaleById('diminished-6th');
    expect(scale).toBeDefined();
    expect(scale!.tones).toHaveLength(8);
    const result = computeDiatonicChords(key('C'), scale!);
    expect(result.supported).toBe(true);
    if (!result.supported) {
      return;
    }
    expect(result.entries).toHaveLength(8);
    expect(result.entries.find((e) => e.degree === 1)).toEqual(
      expect.objectContaining({
        chordId: '6',
        relativeLabel: 'I6',
        displayName: 'C6',
      }),
    );
    expect(result.entries.find((e) => e.degree === 3)).toEqual(
      expect.objectContaining({
        chordId: '6',
        relativeLabel: 'I6/III',
        displayName: 'C6/E',
      }),
    );
    expect(result.entries.find((e) => e.degree === 5)).toEqual(
      expect.objectContaining({
        chordId: '6',
        relativeLabel: 'I6/V',
        displayName: 'C6/G',
      }),
    );
  });
});
