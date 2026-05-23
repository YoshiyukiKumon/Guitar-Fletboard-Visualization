import { describe, expect, it } from 'vitest';
import {
  buildSampleLookup,
  nearestSampleForMidi,
  parseMidiFromSampleFilename,
  playbackRateForMidi,
  uniqueSampleRoots,
} from '../src/audio/guitar-samples';

describe('parseMidiFromSampleFilename', () => {
  it('parses note names from steel guitar sample filenames', () => {
    expect(parseMidiFromSampleFilename('E2.wav')).toBe(40);
    expect(parseMidiFromSampleFilename('A2.wav')).toBe(45);
    expect(parseMidiFromSampleFilename('D#3.wav')).toBe(51);
    expect(parseMidiFromSampleFilename('C6.wav')).toBe(84);
    expect(parseMidiFromSampleFilename('c2_s1_04.wav')).toBe(36);
    expect(parseMidiFromSampleFilename('cs4_s5_04.wav')).toBe(61);
  });
});

describe('buildSampleLookup', () => {
  it('prefers filename-matching root over mismatched duplicate', () => {
    const entries = [
      { midi: 60, rootMidi: 61, file: 'b3_s5_04.wav' },
      { midi: 60, rootMidi: 61, file: 'cs4_s5_04.wav' },
    ];
    const lookup = buildSampleLookup(entries);
    expect(lookup.get(60)?.file).toBe('cs4_s5_04.wav');
  });
});

describe('nearestSampleForMidi', () => {
  const entries = [
    { midi: 40, rootMidi: 40, file: 'e2.wav' },
    { midi: 45, rootMidi: 45, file: 'a2.wav' },
    { midi: 64, rootMidi: 64, file: 'mid.wav' },
    { midi: 71, rootMidi: 64, file: 'mid.wav' },
  ];

  it('picks nearest root sample for unmapped midi', () => {
    const sample = nearestSampleForMidi(58, entries);
    expect(sample?.file).toBe('mid.wav');
    expect(sample?.rootMidi).toBe(64);
  });

  it('prefers lower root when distance is tied', () => {
    const tied = [
      { midi: 60, rootMidi: 60, file: 'low.wav' },
      { midi: 64, rootMidi: 64, file: 'high.wav' },
    ];
    const sample = nearestSampleForMidi(62, tied);
    expect(sample?.rootMidi).toBe(60);
  });

  it('dedupes sample files for lookup', () => {
    expect(uniqueSampleRoots(entries)).toHaveLength(3);
  });
});

describe('playbackRateForMidi', () => {
  it('returns octave ratio between target and root', () => {
    expect(playbackRateForMidi(52, 64)).toBeCloseTo(0.5, 5);
    expect(playbackRateForMidi(76, 64)).toBeCloseTo(2, 5);
  });
});
