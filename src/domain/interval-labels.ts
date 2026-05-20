/** ルートからの半音数 → 表示ラベル（master 併記ルール・+ は半角） */
export const INTERVAL_LABEL_BY_SEMITONE: readonly string[] = [
  'R',
  'b2 / b9',
  '2 / 9',
  'm3 / #9',
  '3',
  '4 / 11',
  'b5 / #11',
  '5',
  '+5 / b13',
  '6 / 13',
  'b7',
  '△7',
];

export function semitoneFromRoot(pitchClass: number, rootPc: number): number {
  return ((pitchClass - rootPc) % 12 + 12) % 12;
}

export function labelForSemitone(semitone: number): string {
  return INTERVAL_LABEL_BY_SEMITONE[semitone] ?? '';
}

/** ラベル文字列を正規化（全角＋→半角+、空白除去） */
export function normalizeLabel(label: string): string {
  return label.replace(/＋/g, '+').replace(/\s+/g, ' ').trim();
}

/** 併記ラベルをトークンに分割（例: "b2 / b9" → ["b2", "b9"]） */
export function labelTokens(label: string): string[] {
  return normalizeLabel(label)
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
}

/** 構成音ラベル集合にセルラベルが含まれるか（併記対応） */
export function labelInToneSet(cellLabel: string, toneSet: readonly string[]): boolean {
  const cellParts = labelTokens(cellLabel);
  return toneSet.some((tone) => {
    const toneParts = labelTokens(tone);
    return cellParts.some((c) => toneParts.some((t) => c === t));
  });
}

/** 構成音ラベル → 半音集合 */
export function semitonesFromTones(tones: readonly string[]): Set<number> {
  const result = new Set<number>();
  for (let s = 0; s < 12; s++) {
    const label = INTERVAL_LABEL_BY_SEMITONE[s];
    if (labelInToneSet(label, tones)) {
      result.add(s);
    }
  }
  return result;
}
