import { describe, expect, it } from 'vitest';
import {
  beatDurationSec,
  clampBpm,
  DEFAULT_BPM,
  eighthNoteDurationSec,
  eighthNoteLengthSec,
  nextEighthGridTime,
  noteDurationSec,
  realignRepeatEpochForBpmChange,
} from '../src/domain/playback-bpm';

describe('clampBpm', () => {
  it('defaults invalid values to DEFAULT_BPM', () => {
    expect(clampBpm(undefined)).toBe(DEFAULT_BPM);
    expect(DEFAULT_BPM).toBe(90);
    expect(clampBpm(Number.NaN)).toBe(DEFAULT_BPM);
  });

  it('clamps to 40–240', () => {
    expect(clampBpm(10)).toBe(40);
    expect(clampBpm(999)).toBe(240);
    expect(clampBpm(90)).toBe(90);
  });
});

describe('beatDurationSec', () => {
  it('returns quarter-note length from BPM', () => {
    expect(beatDurationSec(120)).toBe(0.5);
    expect(beatDurationSec(60)).toBe(1);
  });
});

describe('eighthNoteDurationSec', () => {
  it('is half of quarter note at same BPM', () => {
    expect(eighthNoteDurationSec(120)).toBe(0.25);
    expect(eighthNoteLengthSec(120)).toBeCloseTo(0.225);
  });
});

describe('nextEighthGridTime', () => {
  it('aligns to eighth grid from epoch', () => {
    const epoch = 10;
    const now = 10.3;
    const aligned = nextEighthGridTime(epoch, now, 120, 0.05);
    expect(aligned).toBeCloseTo(10.5);
  });
});

describe('realignRepeatEpochForBpmChange', () => {
  it('preserves beat position within measure when tempo changes', () => {
    const epoch = 10;
    const now = 11;
    const nextEpoch = realignRepeatEpochForBpmChange(epoch, now, 120, 60, 4);
    expect((now - nextEpoch) / beatDurationSec(60)).toBeCloseTo(2);
  });
});
