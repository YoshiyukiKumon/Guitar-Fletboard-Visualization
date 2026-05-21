import { describe, expect, it } from 'vitest';
import { resolveCapsuleStyle } from '../src/domain/fretboard-view-mode';

describe('resolveCapsuleStyle', () => {
  const bothRoots = {
    isScaleRoot: true,
    isChordRoot: true,
    inScale: true,
    inChord: true,
  };
  const scaleRootOnly = {
    isScaleRoot: true,
    isChordRoot: false,
    inScale: true,
    inChord: false,
  };
  const chordRootOnly = {
    isScaleRoot: false,
    isChordRoot: true,
    inScale: false,
    inChord: true,
  };
  const scaleOnly = {
    isScaleRoot: false,
    isChordRoot: false,
    inScale: true,
    inChord: false,
  };
  const chordOnly = {
    isScaleRoot: false,
    isChordRoot: false,
    inScale: false,
    inChord: true,
  };
  const other = {
    isScaleRoot: false,
    isChordRoot: false,
    inScale: false,
    inChord: false,
  };

  it('fretboard: emphasizes scale root only', () => {
    expect(resolveCapsuleStyle(scaleRootOnly, 'fretboard')).toBe('scale-root');
    expect(resolveCapsuleStyle(chordRootOnly, 'fretboard')).toBe('scale');
  });

  it('scale: emphasizes scale root and scale tones', () => {
    expect(resolveCapsuleStyle(scaleRootOnly, 'scale')).toBe('scale-root');
    expect(resolveCapsuleStyle(scaleOnly, 'scale')).toBe('scale');
    expect(resolveCapsuleStyle(chordOnly, 'scale')).toBe('muted');
  });

  it('chord: emphasizes chord root and chord tones', () => {
    expect(resolveCapsuleStyle(chordRootOnly, 'chord')).toBe('chord-root');
    expect(resolveCapsuleStyle(chordOnly, 'chord')).toBe('chord');
    expect(resolveCapsuleStyle(scaleOnly, 'chord')).toBe('muted');
  });

  it('composite: scale-root when roots overlap, chord-root only otherwise', () => {
    expect(resolveCapsuleStyle(bothRoots, 'composite')).toBe('scale-root');
    expect(resolveCapsuleStyle(scaleRootOnly, 'composite')).toBe('scale-root');
    expect(resolveCapsuleStyle(chordRootOnly, 'composite')).toBe('chord-root');
    expect(resolveCapsuleStyle(chordOnly, 'composite')).toBe('chord');
    expect(resolveCapsuleStyle(scaleOnly, 'composite')).toBe('scale');
    expect(resolveCapsuleStyle(other, 'composite')).toBe('muted');
  });
});
