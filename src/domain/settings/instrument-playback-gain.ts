/**
 * 楽器ごとの再生音量平準化（基準: acoustic-nylon の pack 最大ピーク）。
 *
 * 係数は `node scripts/measure-sample-peaks.mjs` で計測した値。
 * サンプル pack 更新時はスクリプトを再実行して更新すること。
 */
import type { InstrumentDefinition, InstrumentId } from './instrument-catalog';
import { getSynthPreset } from '../../audio/synth-presets';

/** ナイロン pack 内の最大サンプルピーク（measure-sample-peaks.mjs） */
export const REFERENCE_BUFFER_PEAK = 0.972656;

/** tone-player の SAMPLE_PEAK_GAIN と一致させる */
export const REFERENCE_SAMPLE_PEAK_GAIN = 0.92;

/** ナイロン基準の出力ピーク（サンプル再生時） */
export const REFERENCE_OUTPUT_PEAK =
  REFERENCE_BUFFER_PEAK * REFERENCE_SAMPLE_PEAK_GAIN;

/** 各 pack の最大バッファピーク（measure-sample-peaks.mjs） */
const MAX_BUFFER_PEAK_BY_SAMPLE_DIR: Readonly<Record<string, number>> = {
  'acoustic-nylon': 0.972656,
  'steel-guitar': 0.945068,
  'electric-clean': 0.944489,
  'electric-overdrive': 0.599457,
  'electric-distortion': 0.793457,
  piano: 0.944305,
};

const PLAYBACK_GAIN_BY_INSTRUMENT_ID: Readonly<Record<InstrumentId, number>> = {
  'acoustic-steel': REFERENCE_BUFFER_PEAK / MAX_BUFFER_PEAK_BY_SAMPLE_DIR['steel-guitar'],
  'acoustic-nylon': 1,
  'electric-clean':
    REFERENCE_BUFFER_PEAK / MAX_BUFFER_PEAK_BY_SAMPLE_DIR['electric-clean'],
  'electric-overdrive':
    REFERENCE_BUFFER_PEAK / MAX_BUFFER_PEAK_BY_SAMPLE_DIR['electric-overdrive'],
  'electric-distortion':
    REFERENCE_BUFFER_PEAK / MAX_BUFFER_PEAK_BY_SAMPLE_DIR['electric-distortion'],
  piano: REFERENCE_BUFFER_PEAK / MAX_BUFFER_PEAK_BY_SAMPLE_DIR.piano,
  'synth-tone': REFERENCE_OUTPUT_PEAK / getSynthPreset('synth-tone').peakGain,
};

export function playbackGainForInstrumentId(id: InstrumentId): number {
  return PLAYBACK_GAIN_BY_INSTRUMENT_ID[id];
}

export function playbackGainForInstrument(
  definition: InstrumentDefinition,
): number {
  return playbackGainForInstrumentId(definition.id);
}
