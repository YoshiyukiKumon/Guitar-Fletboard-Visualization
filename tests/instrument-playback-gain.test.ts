import { describe, expect, it } from 'vitest';
import {
  playbackGainForInstrumentId,
  REFERENCE_BUFFER_PEAK,
  REFERENCE_OUTPUT_PEAK,
} from '../src/domain/settings/instrument-playback-gain';
import { getInstrumentDefinition } from '../src/domain/settings/instrument-catalog';
import { getSynthPreset } from '../src/audio/synth-presets';

describe('instrument playback gain', () => {
  it('uses nylon as unity reference for sample instruments', () => {
    expect(playbackGainForInstrumentId('acoustic-nylon')).toBe(1);
  });

  it('normalizes sample packs by max buffer peak vs nylon', () => {
    expect(playbackGainForInstrumentId('acoustic-steel')).toBeCloseTo(1.0292, 3);
    expect(playbackGainForInstrumentId('electric-overdrive')).toBeCloseTo(
      1.6226,
      3,
    );
    expect(playbackGainForInstrumentId('piano')).toBeCloseTo(1.03, 2);
  });

  it('normalizes synth-tone to nylon output peak', () => {
    const synthGain = playbackGainForInstrumentId('synth-tone');
    const effectivePeak = getSynthPreset('synth-tone').peakGain * synthGain;
    expect(effectivePeak).toBeCloseTo(REFERENCE_OUTPUT_PEAK, 4);
  });

  it('matches definition id lookup', () => {
    expect(
      playbackGainForInstrumentId(getInstrumentDefinition('electric-clean').id),
    ).toBeCloseTo(REFERENCE_BUFFER_PEAK / 0.944489, 3);
  });
});
