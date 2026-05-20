import type { KeyDef } from './data/keys';
import { labelTokens } from './interval-labels';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const LETTER_PITCH_CLASS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** ルートからの半音 → ダイアトニック音度（R=0 … 7th=6） */
const SEMITONE_DEGREE_INDEX = [0, 1, 1, 2, 2, 3, 4, 4, 4, 5, 6, 6] as const;

/** メジャースケールのダイアトニック音（異名同音の強制上書き対象外） */
const MAJOR_DIATONIC_SEMITONES = new Set([0, 2, 4, 5, 7, 9, 11]);

/** @deprecated テスト互換 */
export const NOTE_NAMES_SHARP = [
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
] as const;

export const NOTE_NAMES_FLAT = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

/** @deprecated NOTE_NAMES_SHARP の別名 */
export const NOTE_NAMES = NOTE_NAMES_SHARP;

export type NotationStyle = 'sharp' | 'flat';

/** フラット系スケールルート（表示・フォールバック用） */
export const FLAT_PREFERRED_PITCH_CLASSES = new Set([3, 8, 10]);

/** シャープ優先キーでの異名同音（例: C → B#） */
const SHARP_ENHARMONIC: Partial<Record<number, string>> = {
  0: 'B#',
  3: 'D#',
  5: 'E#',
  10: 'A#',
};

/** フラット優先キーでの異名同音（例: B → Cb） */
const FLAT_ENHARMONIC: Partial<Record<number, string>> = {
  1: 'Db',
  3: 'Eb',
  6: 'Gb',
  8: 'Ab',
  10: 'Bb',
  11: 'Cb',
};

export function usesFlatNotationForScaleRoot(scaleKey: KeyDef): boolean {
  return FLAT_PREFERRED_PITCH_CLASSES.has(scaleKey.pitchClass);
}

export function notationStyleForScaleRoot(scaleKey: KeyDef): NotationStyle {
  return usesFlatNotationForScaleRoot(scaleKey) ? 'flat' : 'sharp';
}

function letterIndex(letter: string): number {
  const idx = LETTERS.indexOf(letter as (typeof LETTERS)[number]);
  return idx >= 0 ? idx : 0;
}

/** キー ID の表示名（ルート音） */
export function scaleRootDisplayName(scaleKey: KeyDef): string {
  return scaleKey.id;
}

function parseRootLetter(scaleKey: KeyDef): string {
  const id = scaleKey.id;
  if (id === 'Eb' || id === 'Ab' || id === 'Bb') {
    return id[0];
  }
  if (id.startsWith('C#') || id === 'C#') {
    return 'C';
  }
  if (id.startsWith('F#') || id === 'F#') {
    return 'F';
  }
  return id.charAt(0);
}

function normalizeSemitoneDiff(diff: number): number {
  let d = ((diff % 12) + 12) % 12;
  if (d > 6) {
    d -= 12;
  }
  return d;
}

function applyAccidentalToLetter(
  letter: string,
  diff: number,
  scaleKey: KeyDef,
  targetPc: number,
): string {
  const d = normalizeSemitoneDiff(diff);
  if (d === 0) {
    return letter;
  }
  if (d === 1) {
    return `${letter}#`;
  }
  if (d === -1) {
    return `${letter}b`;
  }
  if (d === 2) {
    return `${letter}##`;
  }
  if (d === -2) {
    return `${letter}bb`;
  }
  const style = notationStyleForScaleRoot(scaleKey);
  const table = style === 'flat' ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  return table[targetPc] ?? letter;
}

/**
 * スケールルートとルートからの半音数に応じた音名（B#, Cb などキー文脈の表記）
 */
export function spellNoteForSemitone(
  scaleKey: KeyDef,
  semitoneFromRoot: number,
): string {
  const semitone = ((semitoneFromRoot % 12) + 12) % 12;
  const degreeIndex = SEMITONE_DEGREE_INDEX[semitone];
  if (degreeIndex === 0) {
    return scaleRootDisplayName(scaleKey);
  }

  const rootLetter = parseRootLetter(scaleKey);
  const letter = LETTERS[(letterIndex(rootLetter) + degreeIndex) % 7];
  const targetPc =
    (scaleKey.pitchClass + semitone) % 12;
  const basePc = LETTER_PITCH_CLASS[letter] ?? 0;
  return applyAccidentalToLetter(letter, targetPc - basePc, scaleKey, targetPc);
}

function preferredEnharmonic(
  pitchClass: number,
  scaleKey: KeyDef,
): string | undefined {
  const pc = ((pitchClass % 12) + 12) % 12;
  if (usesFlatNotationForScaleRoot(scaleKey)) {
    return FLAT_ENHARMONIC[pc];
  }
  return SHARP_ENHARMONIC[pc];
}

export function noteNameForPitchClass(
  pitchClass: number,
  scaleKey: KeyDef,
): string;
export function noteNameForPitchClass(
  pitchClass: number,
  style: NotationStyle,
): string;
export function noteNameForPitchClass(
  pitchClass: number,
  scaleKeyOrStyle: KeyDef | NotationStyle,
): string {
  if (
    typeof scaleKeyOrStyle === 'object' &&
    scaleKeyOrStyle !== null &&
    'pitchClass' in scaleKeyOrStyle
  ) {
    const scaleKey = scaleKeyOrStyle;
    const pc = ((pitchClass % 12) + 12) % 12;
    const semitone =
      ((pitchClass - scaleKey.pitchClass) % 12 + 12) % 12;
    const spelled = spellNoteForSemitone(scaleKey, semitone);
    const preferred = preferredEnharmonic(pc, scaleKey);
    if (preferred && !MAJOR_DIATONIC_SEMITONES.has(semitone)) {
      return preferred;
    }
    return spelled;
  }

  const style = scaleKeyOrStyle;
  const pc = ((pitchClass % 12) + 12) % 12;
  const table = style === 'flat' ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  return table[pc] ?? '';
}

/** 構成音ラベルの主表記（併記の左側）を参考にルート基準で音名化 */
export function noteNameForPitchClassWithScale(
  pitchClass: number,
  scaleKey: KeyDef,
): string {
  return noteNameForPitchClass(pitchClass, scaleKey);
}

/** インターバル併記の主トークンが示す音名（スケール構成音リスト用） */
export function spellToneLabel(scaleKey: KeyDef, toneLabel: string): string {
  const token = labelTokens(toneLabel)[0] ?? 'R';
  const semitone = toneLabelToSemitone(token);
  return spellNoteForSemitone(scaleKey, semitone);
}

function toneLabelToSemitone(token: string): number {
  const map: Record<string, number> = {
    R: 0,
    b2: 1,
    '2': 2,
    m3: 3,
    '3': 4,
    '4': 5,
    b5: 6,
    '5': 7,
    '+5': 8,
    '6': 9,
    b7: 10,
    '△7': 11,
    '7': 11,
  };
  return map[token] ?? 0;
}
