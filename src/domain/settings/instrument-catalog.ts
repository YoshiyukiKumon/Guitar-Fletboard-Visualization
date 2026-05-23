/** 再生楽器 ID（`public/samples/<sampleDir>/` と対応） */
import { sampleBaseUrlForSampleDir } from '../../app/asset-url';

export const INSTRUMENT_IDS = [
  'acoustic-steel',
  'acoustic-nylon',
  'electric-clean',
  'electric-overdrive',
  'electric-distortion',
  'piano',
  'synth-tone',
] as const;

export type InstrumentId = (typeof INSTRUMENT_IDS)[number];

export type InstrumentPlaybackKind = 'sample' | 'synth';

export type SynthPresetId =
  | 'synth-tone'
  | 'acoustic-nylon-fallback'
  | 'electric-clean'
  | 'electric-overdrive'
  | 'electric-distortion'
  | 'piano';

export interface InstrumentDefinition {
  id: InstrumentId;
  label: string;
  kind: InstrumentPlaybackKind;
  /** `public/samples/` 以下のディレクトリ名（sample 時） */
  sampleDir?: string;
  /** 同梱サンプルが利用可能か（未同梱は合成音で代用） */
  sampleBundled: boolean;
  /** sample 失敗時・synth 楽器時の合成プリセット */
  synthPresetId: SynthPresetId;
  /** サンプル再生の最大長（秒）。未指定時は既定 1.5 秒 */
  sampleMaxDurationSec?: number;
  /** サンプル音源のピッチ補正（セント）。+ でシャープ */
  samplePitchCents?: number;
}

export const DEFAULT_SAMPLE_MAX_DURATION_SEC = 1.5;

export const DEFAULT_INSTRUMENT_ID: InstrumentId = 'acoustic-steel';

export const INSTRUMENT_CATALOG: readonly InstrumentDefinition[] = [
  {
    id: 'acoustic-steel',
    label: 'アコースティック（スチール）',
    kind: 'sample',
    sampleDir: 'steel-guitar',
    sampleBundled: true,
    synthPresetId: 'acoustic-nylon-fallback',
  },
  {
    id: 'acoustic-nylon',
    label: 'アコースティック（ナイロン）',
    kind: 'sample',
    sampleDir: 'acoustic-nylon',
    sampleBundled: true,
    synthPresetId: 'acoustic-nylon-fallback',
    samplePitchCents: 30,
  },
  {
    id: 'electric-clean',
    label: 'エレキ（クリーン）',
    kind: 'sample',
    sampleDir: 'electric-clean',
    sampleBundled: true,
    synthPresetId: 'electric-clean',
    sampleMaxDurationSec: 0.5,
  },
  {
    id: 'electric-overdrive',
    label: 'エレキ（オーバードライブ）',
    kind: 'sample',
    sampleDir: 'electric-overdrive',
    sampleBundled: true,
    synthPresetId: 'electric-overdrive',
    sampleMaxDurationSec: 0.5,
  },
  {
    id: 'electric-distortion',
    label: 'エレキ（ディストーション）',
    kind: 'sample',
    sampleDir: 'electric-distortion',
    sampleBundled: true,
    synthPresetId: 'electric-distortion',
    sampleMaxDurationSec: 0.5,
  },
  {
    id: 'piano',
    label: 'ピアノ',
    kind: 'sample',
    sampleDir: 'piano',
    sampleBundled: true,
    synthPresetId: 'piano',
    sampleMaxDurationSec: 0.7,
  },
  {
    id: 'synth-tone',
    label: 'シンセ',
    kind: 'synth',
    sampleBundled: false,
    synthPresetId: 'synth-tone',
  },
];

const CATALOG_BY_ID = new Map(
  INSTRUMENT_CATALOG.map((item) => [item.id, item]),
);

export function isInstrumentId(value: unknown): value is InstrumentId {
  return typeof value === 'string' && CATALOG_BY_ID.has(value as InstrumentId);
}

export function getInstrumentDefinition(
  id: InstrumentId,
): InstrumentDefinition {
  const found = CATALOG_BY_ID.get(id);
  if (found === undefined) {
    throw new Error(`Unknown instrument: ${id}`);
  }
  return found;
}

export function normalizeInstrumentId(value: unknown): InstrumentId {
  return isInstrumentId(value) ? value : DEFAULT_INSTRUMENT_ID;
}

export function instrumentUsesSamples(definition: InstrumentDefinition): boolean {
  return definition.kind === 'sample';
}

export function sampleMaxDurationSec(definition: InstrumentDefinition): number {
  return definition.sampleMaxDurationSec ?? DEFAULT_SAMPLE_MAX_DURATION_SEC;
}

export function samplePitchRate(definition: InstrumentDefinition): number {
  const cents = definition.samplePitchCents ?? 0;
  return 2 ** (cents / 1200);
}

const GUITAR_INSTRUMENT_IDS: ReadonlySet<InstrumentId> = new Set([
  'acoustic-steel',
  'acoustic-nylon',
  'electric-clean',
  'electric-overdrive',
  'electric-distortion',
]);

/** コード同時再生時にルートから順へわずかにずらす（ストローク風） */
export function instrumentUsesGuitarStrum(definition: InstrumentDefinition): boolean {
  return GUITAR_INSTRUMENT_IDS.has(definition.id);
}

export function sampleBaseUrlForInstrument(
  definition: InstrumentDefinition,
): string | undefined {
  if (definition.sampleDir === undefined) {
    return undefined;
  }
  return sampleBaseUrlForSampleDir(definition.sampleDir);
}
