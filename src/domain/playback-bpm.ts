/** 構成音パネル再生の BPM（テンポ） */
export const DEFAULT_BPM = 90;
export const MIN_BPM = 40;
export const MAX_BPM = 240;

export function clampBpm(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_BPM;
  }
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
}

/** 4 分音符 1 拍の長さ（秒） */
export function beatDurationSec(bpm: number): number {
  return 60 / clampBpm(bpm);
}

/** 1 音の長さ（拍の 90%、残りは間） */
export function noteDurationSec(bpm: number): number {
  return beatDurationSec(bpm) * 0.9;
}

/** 8 分音符 1 個の長さ（秒） */
export function eighthNoteDurationSec(bpm: number): number {
  return beatDurationSec(bpm) / 2;
}

/** 8 分音符 1 音の鳴り続け時間（90%） */
export function eighthNoteLengthSec(bpm: number): number {
  return eighthNoteDurationSec(bpm) * 0.9;
}

/**
 * リピート epoch を基準に、次の 8 分音符グリッド時刻を返す
 */
export function nextEighthGridTime(
  epoch: number,
  now: number,
  bpm: number,
  leadSec = 0.05,
): number {
  const eighthSec = eighthNoteDurationSec(bpm);
  const target = now + leadSec;
  if (epoch <= 0) {
    return target;
  }
  const elapsed = target - epoch;
  const index = Math.ceil(elapsed / eighthSec - 1e-9);
  return epoch + Math.max(0, index) * eighthSec;
}

/**
 * リピート再生中の BPM 変更後も、小節内の拍位置を保った epoch を返す
 */
export function realignRepeatEpochForBpmChange(
  epoch: number,
  now: number,
  oldBpm: number,
  newBpm: number,
  measureBeats: number,
): number {
  const oldBeatSec = beatDurationSec(oldBpm);
  const newBeatSec = beatDurationSec(newBpm);
  const elapsed = Math.max(0, now - epoch);
  const beatInMeasure = (elapsed / oldBeatSec) % measureBeats;
  return now - beatInMeasure * newBeatSec;
}
