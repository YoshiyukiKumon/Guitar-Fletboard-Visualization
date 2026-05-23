import { loadCustomLibrary } from '../music-library/storage';

export interface ScaleDef {
  id: string;
  name: string;
  /** master シートの構成音ラベル（併記含む） */
  tones: readonly string[];
}

/** master シート §8.4 — MVP 以降の選択 UI 用に全件保持 */
export const SCALES: readonly ScaleDef[] = [
  { id: 'major', name: 'Major', tones: ['R', '2 / 9', '3', '4 / 11', '5', '6 / 13', '△7'] },
  {
    id: 'natural-minor',
    name: 'Natural Minor',
    tones: ['R', '2 / 9', 'm3 / #9', '4 / 11', '5', '+5 / b13', 'b7'],
  },
  {
    id: 'harmonic-minor',
    name: 'Harmonic Minor',
    tones: ['R', '2 / 9', 'm3 / #9', '4 / 11', '5', '+5 / b13', '△7'],
  },
  {
    id: 'melodic-minor',
    name: 'Melodic Minor',
    tones: ['R', '2 / 9', 'm3 / #9', '4 / 11', '5', '6 / 13', '△7'],
  },
  {
    id: 'major-penta',
    name: 'Major Penta Tonics',
    tones: ['R', '2 / 9', '3', '5', '6 / 13'],
  },
  {
    id: 'minor-penta',
    name: 'Minor Penta Tonics',
    tones: ['R', 'm3 / #9', '4 / 11', '5', 'b7'],
  },
  {
    id: 'altered',
    name: 'Altered',
    tones: ['R', 'b2 / b9', 'm3 / #9', '3', 'b5 / #11', '+5 / b13', 'b7'],
  },
  { id: 'hp5', name: 'HP5', tones: ['R', 'b2 / b9', '3', '4 / 11', '5', '+5 / b13', 'b7'] },
  {
    id: 'lydian-b7',
    name: 'Lydian b7',
    tones: ['R', '2 / 9', '3', 'b5 / #11', '5', '6 / 13', 'b7'],
  },
  {
    id: 'dorian',
    name: 'Dorian',
    tones: ['R', '2 / 9', 'm3 / #9', '4 / 11', '5', '6 / 13', 'b7'],
  },
  {
    id: 'phrygian',
    name: 'Phrygian',
    tones: ['R', 'b2 / b9', 'm3 / #9', '4 / 11', '5', '+5 / b13', 'b7'],
  },
  {
    id: 'lydian',
    name: 'Lydian',
    tones: ['R', '2 / 9', '3', 'b5 / #11', '5', '6 / 13', '△7'],
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    tones: ['R', '2 / 9', '3', '4 / 11', '5', '6 / 13', 'b7'],
  },
  {
    id: 'locrian',
    name: 'Locrian',
    tones: ['R', 'b2 / b9', 'm3 / #9', '4 / 11', 'b5 / #11', '+5 / b13', 'b7'],
  },
  {
    id: 'whole-half-dim',
    name: 'Whole/Half Diminish',
    tones: [
      'R',
      '2 / 9',
      'm3 / #9',
      '4 / 11',
      'b5 / #11',
      '+5 / b13',
      '6 / 13',
      '△7',
    ],
  },
  {
    id: 'half-whole-dim',
    name: 'Half/Whole Diminish',
    tones: [
      'R',
      'b2 / b9',
      'm3 / #9',
      '3',
      'b5 / #11',
      '5',
      '6 / 13',
      'b7',
    ],
  },
  {
    id: 'whole-tone',
    name: 'Whole Tone',
    tones: ['R', '2 / 9', '3', 'b5 / #11', '+5 / b13', 'b7'],
  },
  {
    id: 'kumoi-penta',
    name: 'KUMOI Penta Tonics',
    tones: ['R', '2 / 9', 'm3 / #9', '5', '6 / 13'],
  },
  {
    id: 'diminished-6th',
    name: 'Diminished 6th',
    tones: [
      'R',
      '2 / 9',
      '3',
      '4 / 11',
      '5',
      '+5 / b13',
      '6 / 13',
      '△7',
    ],
  },
];

export const MVP_SCALE = SCALES[0];

export function findScaleById(id: string): ScaleDef | undefined {
  return (
    SCALES.find((s) => s.id === id) ??
    loadCustomLibrary().scales.find((s) => s.id === id)
  );
}

export function isScaleId(id: string): boolean {
  return findScaleById(id) !== undefined;
}
