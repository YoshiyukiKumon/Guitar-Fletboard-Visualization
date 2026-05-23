import type { SynthPresetId } from '../domain/settings/instrument-catalog';

export interface SynthPreset {
  id: SynthPresetId;
  oscillatorType: OscillatorType;
  peakGain: number;
  attackSec: number;
  releaseSec: number;
  filterCutoffHz?: number;
  filterQ?: number;
  /** 0 = なし, 1 = 強い歪み */
  distortionAmount?: number;
}

function makeDistortionCurve(amount: number): Float32Array {
  const samples = 256;
  const curve = new Float32Array(samples);
  const k = amount * 100;
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

export const SYNTH_PRESETS: Record<SynthPresetId, SynthPreset> = {
  'synth-tone': {
    id: 'synth-tone',
    oscillatorType: 'triangle',
    peakGain: 0.22,
    attackSec: 0.02,
    releaseSec: 0.08,
  },
  'acoustic-nylon-fallback': {
    id: 'acoustic-nylon-fallback',
    oscillatorType: 'sine',
    peakGain: 0.28,
    attackSec: 0.004,
    releaseSec: 0.35,
    filterCutoffHz: 2800,
    filterQ: 0.7,
  },
  'electric-clean': {
    id: 'electric-clean',
    oscillatorType: 'sawtooth',
    peakGain: 0.16,
    attackSec: 0.004,
    releaseSec: 0.25,
    filterCutoffHz: 2200,
    filterQ: 0.8,
  },
  'electric-overdrive': {
    id: 'electric-overdrive',
    oscillatorType: 'sawtooth',
    peakGain: 0.2,
    attackSec: 0.003,
    releaseSec: 0.22,
    filterCutoffHz: 3200,
    filterQ: 0.9,
    distortionAmount: 0.35,
  },
  'electric-distortion': {
    id: 'electric-distortion',
    oscillatorType: 'sawtooth',
    peakGain: 0.18,
    attackSec: 0.002,
    releaseSec: 0.18,
    filterCutoffHz: 4200,
    filterQ: 0.6,
    distortionAmount: 0.85,
  },
  piano: {
    id: 'piano',
    oscillatorType: 'triangle',
    peakGain: 0.34,
    attackSec: 0.001,
    releaseSec: 0.55,
    filterCutoffHz: 5200,
    filterQ: 0.5,
  },
};

export function getSynthPreset(id: SynthPresetId): SynthPreset {
  return SYNTH_PRESETS[id];
}

export function createDistortionNode(
  ctx: AudioContext,
  amount: number,
): WaveShaperNode {
  const shaper = ctx.createWaveShaper();
  shaper.curve = makeDistortionCurve(amount);
  shaper.oversample = '4x';
  return shaper;
}
