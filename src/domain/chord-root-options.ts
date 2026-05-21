import { KEYS, findKeyById, type KeyDef } from './data/keys';
import { chordRootDisplayName } from './note-names';

/** 音程クラスごとの正規キー ID（保存・再生用） */
const CANONICAL_KEY_ID_BY_PITCH_CLASS: readonly string[] = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];

export interface ChordRootOption {
  /** localStorage / 選択値用（正規キー ID） */
  id: string;
  /** プルダウン表示（スケールルートの調号に合わせた表記） */
  name: string;
  pitchClass: number;
}

export function canonicalKeyIdForPitchClass(pitchClass: number): string {
  const pc = ((pitchClass % 12) + 12) % 12;
  return CANONICAL_KEY_ID_BY_PITCH_CLASS[pc] ?? 'C';
}

/** スケールルートに合わせたコードルート候補（12 音） */
export function chordRootOptionsForScaleKey(scaleKey: KeyDef): ChordRootOption[] {
  return CANONICAL_KEY_ID_BY_PITCH_CLASS.map((id, pitchClass) => {
    const key = KEYS.find((k) => k.id === id)!;
    return {
      id,
      name: chordRootDisplayName(key, scaleKey),
      pitchClass,
    };
  });
}

/**
 * スケールルート変更後も同じ音程クラスのコードルートを維持する
 */
export function remapChordKeyIdForScaleKey(
  chordKeyId: string,
  _scaleKey: KeyDef,
): string {
  const current = findKeyById(chordKeyId);
  if (!current) {
    return canonicalKeyIdForPitchClass(0);
  }
  return canonicalKeyIdForPitchClass(current.pitchClass);
}
