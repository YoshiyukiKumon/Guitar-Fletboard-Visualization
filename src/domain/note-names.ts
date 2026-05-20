/** 音程クラス 0〜11 の音名（シャープ表記） */
export const NOTE_NAMES: readonly string[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export function noteNameForPitchClass(pitchClass: number): string {
  const pc = ((pitchClass % 12) + 12) % 12;
  return NOTE_NAMES[pc] ?? '';
}
