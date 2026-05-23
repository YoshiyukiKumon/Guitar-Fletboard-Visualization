import { describe, expect, it } from 'vitest';
import { CHORDS } from '../src/domain/data/chords';
import {
  orderedSemitonesForChordArpeggio,
  orderedSemitonesForChordPlayback,
  selectTokenForChordPlayback,
  semitoneForChordPlaybackTone,
} from '../src/domain/chord-playback';

describe('selectTokenForChordPlayback', () => {
  it('picks 6 for 6(9) on 6 / 13 and 9 on 2 / 9', () => {
    expect(selectTokenForChordPlayback('6 / 13', '6(9)')).toBe('6');
    expect(selectTokenForChordPlayback('2 / 9', '6(9)')).toBe('9');
  });

  it('picks 13 for 7(13) on 6 / 13', () => {
    expect(selectTokenForChordPlayback('6 / 13', '7(13)')).toBe('13');
  });

  it('picks 2 for sus2 on 2 / 9', () => {
    expect(selectTokenForChordPlayback('2 / 9', 'sus2')).toBe('2');
  });

  it('picks 4 for sus4 on 4 / 11', () => {
    expect(selectTokenForChordPlayback('4 / 11', 'sus4')).toBe('4');
  });
});

describe('semitoneForChordPlaybackTone', () => {
  it('plays 13th one octave above 6th pitch class', () => {
    expect(semitoneForChordPlaybackTone('6 / 13', '7(13)')).toBe(21);
    expect(semitoneForChordPlaybackTone('6 / 13', '6')).toBe(9);
  });

  it('plays 9th one octave above 2nd pitch class', () => {
    expect(semitoneForChordPlaybackTone('2 / 9', '7(9)')).toBe(14);
    expect(semitoneForChordPlaybackTone('2 / 9', 'sus2')).toBe(2);
  });

  it('plays 11th one octave above 4th pitch class', () => {
    expect(semitoneForChordPlaybackTone('4 / 11', '7(11)')).toBe(17);
  });
});

describe('orderedSemitonesForChordPlayback', () => {
  it('matches maj7 in-octave playback', () => {
    const maj7 = CHORDS.find((c) => c.id === 'maj7')!;
    expect(orderedSemitonesForChordPlayback(maj7.tones, maj7.name)).toEqual([
      0, 4, 7, 11,
    ]);
  });

  it('matches 6 in-octave playback with fifth', () => {
    const chord = CHORDS.find((c) => c.id === '6')!;
    expect(orderedSemitonesForChordPlayback(chord.tones, chord.name)).toEqual([
      0, 4, 7, 9,
    ]);
  });

  it('raises 13 on 7(13) chord', () => {
    const chord = CHORDS.find((c) => c.id === '7-13')!;
    expect(orderedSemitonesForChordPlayback(chord.tones, chord.name)).toEqual([
      0, 4, 7, 10, 21,
    ]);
  });
});

describe('orderedSemitonesForChordArpeggio', () => {
  it('sorts from root upward', () => {
    const chord = CHORDS.find((c) => c.id === '7-13')!;
    expect(orderedSemitonesForChordArpeggio(chord.tones, chord.name)).toEqual([
      0, 4, 7, 10, 21,
    ]);
  });

  it('puts R first even when definition order differs', () => {
    const chord = CHORDS.find((c) => c.id === 'm9')!;
    const arp = orderedSemitonesForChordArpeggio(chord.tones, chord.name);
    expect(arp[0]).toBe(0);
    expect([...arp].sort((a, b) => a - b)).toEqual(arp);
  });
});
