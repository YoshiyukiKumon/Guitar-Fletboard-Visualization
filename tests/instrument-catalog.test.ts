import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INSTRUMENT_ID,
  getInstrumentDefinition,
  INSTRUMENT_CATALOG,
  INSTRUMENT_IDS,
  instrumentUsesSamples,
  isInstrumentId,
  normalizeInstrumentId,
  sampleMaxDurationSec,
  samplePitchRate,
  instrumentUsesGuitarStrum,
} from '../src/domain/settings/instrument-catalog';

describe('instrument catalog', () => {
  it('lists all requested instruments', () => {
    expect(INSTRUMENT_IDS).toEqual([
      'acoustic-steel',
      'acoustic-nylon',
      'electric-clean',
      'electric-overdrive',
      'electric-distortion',
      'piano',
      'synth-tone',
    ]);
    expect(INSTRUMENT_CATALOG).toHaveLength(INSTRUMENT_IDS.length);
  });

  it('validates instrument ids', () => {
    expect(isInstrumentId('acoustic-steel')).toBe(true);
    expect(isInstrumentId('unknown')).toBe(false);
    expect(normalizeInstrumentId('unknown')).toBe(DEFAULT_INSTRUMENT_ID);
  });

  it('marks bundled sample instruments', () => {
    expect(instrumentUsesSamples(getInstrumentDefinition('acoustic-steel'))).toBe(
      true,
    );
    expect(instrumentUsesSamples(getInstrumentDefinition('synth-tone'))).toBe(
      false,
    );
    expect(getInstrumentDefinition('synth-tone').kind).toBe('synth');
    expect(getInstrumentDefinition('piano').kind).toBe('sample');
  });

  it('sets per-instrument sample decay duration', () => {
    expect(sampleMaxDurationSec(getInstrumentDefinition('electric-clean'))).toBe(
      0.5,
    );
    expect(sampleMaxDurationSec(getInstrumentDefinition('piano'))).toBe(0.7);
    expect(sampleMaxDurationSec(getInstrumentDefinition('acoustic-steel'))).toBe(
      1.5,
    );
  });

  it('applies optional sample pitch correction', () => {
    expect(samplePitchRate(getInstrumentDefinition('acoustic-steel'))).toBe(1);
    expect(samplePitchRate(getInstrumentDefinition('acoustic-nylon'))).toBeCloseTo(
      2 ** (30 / 1200),
      5,
    );
  });

  it('marks guitar-family instruments for chord strum', () => {
    expect(instrumentUsesGuitarStrum(getInstrumentDefinition('acoustic-steel'))).toBe(
      true,
    );
    expect(instrumentUsesGuitarStrum(getInstrumentDefinition('electric-clean'))).toBe(
      true,
    );
    expect(instrumentUsesGuitarStrum(getInstrumentDefinition('piano'))).toBe(false);
    expect(instrumentUsesGuitarStrum(getInstrumentDefinition('synth-tone'))).toBe(
      false,
    );
  });
});
