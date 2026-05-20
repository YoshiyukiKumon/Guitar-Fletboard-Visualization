export interface ChordDef {
  id: string;
  name: string;
  tones: readonly string[];
}

/** master シート §8.5 */
export const CHORDS: readonly ChordDef[] = [
  { id: 'major-triad', name: 'major triad', tones: ['R', '3', '5'] },
  { id: 'm', name: 'm', tones: ['R', 'm3 / #9', '5'] },
  { id: 'm7', name: 'm7', tones: ['R', 'm3 / #9', '5', 'b7'] },
  { id: 'maj7', name: '△7', tones: ['R', '3', '5', '△7'] },
  { id: '7', name: '7', tones: ['R', '3', '5', 'b7'] },
  { id: 'm7b5', name: 'm7-5 (∅)', tones: ['R', 'm3 / #9', 'b5 / #11', 'b7'] },
  { id: 'm-maj7', name: 'm△7', tones: ['R', 'm3 / #9', '5', '△7'] },
  { id: 'maj7-9', name: '△7(9)', tones: ['R', '3', '5', '△7', '2 / 9'] },
  { id: 'maj7-sharp11', name: '△7(#11)', tones: ['R', '3', '5', '△7', 'b5 / #11'] },
  { id: 'maj6-9', name: '△6(9)', tones: ['R', '3', '6 / 13', '2 / 9'] },
  { id: '6', name: '6', tones: ['R', '3', '6 / 13'] },
  { id: 'aug', name: 'aug', tones: ['R', '3', '+5 / b13'] },
  { id: '7sharp5', name: '7+5', tones: ['R', '3', '+5 / b13', 'b7'] },
  { id: 'dim', name: 'dim', tones: ['R', 'm3 / #9', 'b5 / #11'] },
  { id: 'dim7', name: 'dim7', tones: ['R', 'm3 / #9', 'b5 / #11', '6 / 13'] },
  { id: 'sus4', name: 'sus4', tones: ['R', '4 / 11', '5'] },
  { id: 'sus2', name: 'sus2', tones: ['R', '2 / 9', '5'] },
  { id: 'add9', name: 'add9', tones: ['R', '3', '5', '2 / 9'] },
  { id: '7-9', name: '7(9)', tones: ['R', '3', '5', 'b7', '2 / 9'] },
  { id: '7-b9', name: '7(b9)', tones: ['R', '3', '5', 'b7', 'b9'] },
  { id: '7-sharp9', name: '7(#9)', tones: ['R', '3', '5', 'b7', 'm3 / #9'] },
  { id: '7-11', name: '7(11)', tones: ['R', '3', '5', 'b7', '4 / 11'] },
  { id: '7-9-11', name: '7(9, 11)', tones: ['R', '3', '5', 'b7', '2 / 9', '4 / 11'] },
  { id: '7-sharp11', name: '7(#11)', tones: ['R', '3', '5', 'b7', 'b5 / #11'] },
  { id: '7-13', name: '7(13)', tones: ['R', '3', '5', 'b7', '6 / 13'] },
  { id: '7-b13', name: '7(b13)', tones: ['R', '3', '5', 'b7', '+5 / b13'] },
  { id: 'm6', name: 'm6', tones: ['R', 'm3 / #9', '5', '6 / 13'] },
  { id: 'm9', name: 'm9', tones: ['R', '3', 'b7', '2 / 9'] },
  { id: 'm11', name: 'm11', tones: ['R', '3', 'b7', '4 / 11'] },
];

export const MVP_CHORD = CHORDS[3];

export function findChordById(id: string): ChordDef | undefined {
  return CHORDS.find((c) => c.id === id);
}

export function isChordId(id: string): boolean {
  return CHORDS.some((c) => c.id === id);
}
