/**
 * 指板マトリクス（master シート 弦 1〜6 × フレット 0〜24）
 * 各値は音程クラス 0〜11（キー非依存）
 * 配列インデックス 0＝6 弦。UI 表示は上＝1 弦・下＝6 弦（fretboard-view で反転）
 */
const MASTER_ROWS = [
  // master 弦 1 — 6 弦 E
  [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4],
  // master 弦 5 — 5 弦 A
  [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  // master 弦 4 — 4 弦 D
  [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2],
  // master 弦 3 — 3 弦 G
  [7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7],
  // master 弦 2 — 2 弦 B
  [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  // master 弦 6 — 1 弦 E
  [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4],
] as const;

export const FRETBOARD_MATRIX: readonly (readonly number[])[] = MASTER_ROWS;

/** 弦名（インデックス 0＝6 弦 E … 5＝1 弦 E） */
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E'] as const;

export const MAX_FRET = 24;

/** 標準チューニングの開放弦 MIDI（弦インデックス 0＝6 弦 … 5＝1 弦） */
export const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64] as const;

/** 弦・フレット位置の MIDI ノート番号（E2〜E6 付近） */
export function midiNoteForFret(stringIndex: number, fret: number): number {
  return OPEN_STRING_MIDI[stringIndex] + fret;
}
