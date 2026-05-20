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
  { id: 'Eb', name: 'Eb', pitchClass: 3 },
  { id: 'E', name: 'E', pitchClass: 4 },
  { id: 'F', name: 'F', pitchClass: 5 },
  { id: 'F#', name: 'F# / Gb', pitchClass: 6 },
  { id: 'G', name: 'G', pitchClass: 7 },
  { id: 'Ab', name: 'Ab', pitchClass: 8 },
  { id: 'A', name: 'A', pitchClass: 9 },
  { id: 'Bb', name: 'Bb', pitchClass: 10 },
  { id: 'B', name: 'B', pitchClass: 11 },
];

/** localStorage 等の旧 ID（シャープ名）→ 現行 ID */
export const LEGACY_KEY_ID_ALIASES: Readonly<Record<string, string>> = {
  'D#': 'Eb',
  'G#': 'Ab',
  'A#': 'Bb',
};

export const MVP_KEY = KEYS[0];

export function normalizeKeyId(id: string): string {
  return LEGACY_KEY_ID_ALIASES[id] ?? id;
}

export function findKeyById(id: string): KeyDef | undefined {
  const normalized = normalizeKeyId(id);
  return KEYS.find((k) => k.id === normalized);
}

export function isKeyId(id: string): boolean {
  return findKeyById(id) !== undefined;
}
