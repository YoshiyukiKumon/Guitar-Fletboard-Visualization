import { describe, expect, it } from 'vitest';
import { KEYS, MVP_KEY } from '../src/domain/data/keys';
import { MVP_SCALE } from '../src/domain/data/scales';
import { MVP_CHORD } from '../src/domain/data/chords';
import { buildFretboard } from '../src/domain/fretboard';
import { resolveMusicSelection } from '../src/domain/resolve-music-selection';

describe('resolveMusicSelection', () => {
  it('resolves separate scale and chord roots', () => {
    const resolved = resolveMusicSelection({
      scaleKeyId: 'C',
      scaleId: 'major',
      chordKeyId: 'A',
      chordId: 'm7',
    });
    expect(resolved.scaleKey.id).toBe('C');
    expect(resolved.chordKey.id).toBe('A');
    expect(resolved.scale.id).toBe('major');
    expect(resolved.chord.id).toBe('m7');
  });

  it('falls back to MVP for unknown ids', () => {
    const resolved = resolveMusicSelection({
      scaleKeyId: 'invalid',
      scaleId: 'invalid',
      chordKeyId: 'invalid',
      chordId: 'invalid',
    });
    expect(resolved.scaleKey.id).toBe(MVP_KEY.id);
    expect(resolved.chordKey.id).toBe(MVP_KEY.id);
    expect(resolved.scale.id).toBe(MVP_SCALE.id);
    expect(resolved.chord.id).toBe(MVP_CHORD.id);
  });
});

describe('buildFretboard separate roots', () => {
  it('uses scale root for scale degrees and chord root for chord tones', () => {
    const keyC = KEYS.find((k) => k.id === 'C')!;
    const keyA = KEYS.find((k) => k.id === 'A')!;
    const model = buildFretboard(keyC, MVP_SCALE, keyA, MVP_CHORD);

    const open6 = model.strings[0].frets[0];
    expect(open6.noteName).toBe('E');
    expect(open6.intervalLabel).toBe('3');
    expect(open6.isScaleRoot).toBe(false);
    expect(open6.inScale).toBe(true);

    expect(open6.isChordRoot).toBe(false);
    expect(open6.inChord).toBe(true);
  });

  it('scale root E makes 6th string open R in scale context', () => {
    const keyE = KEYS.find((k) => k.id === 'E')!;
    const model = buildFretboard(keyE, MVP_SCALE, MVP_KEY, MVP_CHORD);
    expect(model.strings[0].frets[0].isScaleRoot).toBe(true);
    expect(model.strings[0].frets[0].intervalLabel).toBe('R');
  });
});
