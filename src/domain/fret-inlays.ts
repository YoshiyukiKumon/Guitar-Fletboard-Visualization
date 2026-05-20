/**
 * ギター指板のフレット目印（インレイ）位置 — 装飾用
 * 番号 N はフレット (N-1) と N の間（N 番目のフレット列の中央）に表示
 */
export const FRET_INLAY_POSITIONS: readonly number[] = [
  3, 5, 7, 9, 12, 15, 17, 19, 21,
];

export function isFretInlayPosition(fret: number): boolean {
  return FRET_INLAY_POSITIONS.includes(fret);
}

/** 12 フレットは通常 2 つのドット */
export function inlayDotCount(fret: number): 0 | 1 | 2 {
  if (fret === 12) {
    return 2;
  }
  return isFretInlayPosition(fret) ? 1 : 0;
}
