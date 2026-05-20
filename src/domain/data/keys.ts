/** 調音テーブル（master シート準拠） */
export interface KeyDef {
  id: string;
  name: string;
  pitchClass: number;
}

export const KEYS: readonly KeyDef[] = [
  { id: 'C', name: 'C', pitchClass: 0 },
  { id: 'C#', name: 'C# / Db', pitchClass: 1 },
  { id: 'D', name: 'D', pitchClass: 2 },
  { id: 'D#', name: 'D# / Eb', pitchClass: 3 },
  { id: 'E', name: 'E', pitchClass: 4 },
  { id: 'F', name: 'F', pitchClass: 5 },
  { id: 'F#', name: 'F# / Gb', pitchClass: 6 },
  { id: 'G', name: 'G', pitchClass: 7 },
  { id: 'G#', name: 'G# / Ab', pitchClass: 8 },
  { id: 'A', name: 'A', pitchClass: 9 },
  { id: 'A#', name: 'A# / Bb', pitchClass: 10 },
  { id: 'B', name: 'B', pitchClass: 11 },
];

export const MVP_KEY = KEYS[0];

export function findKeyById(id: string): KeyDef | undefined {
  return KEYS.find((k) => k.id === id);
}

export function isKeyId(id: string): boolean {
  return KEYS.some((k) => k.id === id);
}
