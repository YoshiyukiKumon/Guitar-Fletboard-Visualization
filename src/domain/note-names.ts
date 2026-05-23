import type { KeyDef } from './data/keys';
import { labelTokens } from './interval-labels';

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

/**
 * 長調キーごとの 12 音表記（音程クラス 0=C … 11=B）
 * @see docs/spec-note-spelling-rules.md
 */
const SPELLING_SHARP_C = NOTE_NAMES_SHARP;

const SPELLING_SHARP_FSHARP: readonly string[] = [
  'B#',
  'C#',
  'D#',
  'D#',
  'E',
  'E#',
  'F#',
  'G',
  'G#',
  'A#',
  'A#',
  'B',
];

const SPELLING_SHARP_CSHARP: readonly string[] = [
  'B#',
  'C#',
  'D#',
  'E#',
  'E#',
  'F#',
  'F#',
  'G#',
  'A#',
  'A#',
  'B',
  'B#',
];

const SPELLING_FLAT = NOTE_NAMES_FLAT;

/** Bb 調では音程クラス 11 を Cb と表記（B 自然とは異名同音） */
const SPELLING_FLAT_BB: readonly string[] = [
  ...NOTE_NAMES_FLAT.slice(0, 11),
  'Cb',
];

const SPELLING_BY_ROOT_ID: Record<string, readonly string[]> = {
  C: SPELLING_SHARP_C,
  G: SPELLING_SHARP_C,
  D: SPELLING_SHARP_C,
  A: SPELLING_SHARP_C,
  E: SPELLING_SHARP_C,
  B: SPELLING_SHARP_C,
  'F#': SPELLING_SHARP_FSHARP,
  'C#': SPELLING_SHARP_CSHARP,
  F: SPELLING_FLAT,
  Bb: SPELLING_FLAT_BB,
  Eb: SPELLING_FLAT,
  Ab: SPELLING_FLAT,
};

export function usesFlatNotationForScaleRoot(scaleKey: KeyDef): boolean {
  return FLAT_PREFERRED_PITCH_CLASSES.has(scaleKey.pitchClass);
}

export function notationStyleForScaleRoot(scaleKey: KeyDef): NotationStyle {
  return usesFlatNotationForScaleRoot(scaleKey) ? 'flat' : 'sharp';
}

function spellingTableForScaleRoot(scaleKey: KeyDef): readonly string[] {
  return SPELLING_BY_ROOT_ID[scaleKey.id] ?? SPELLING_SHARP_C;
}

/** キー ID の表示名（ルート音） */
export function scaleRootDisplayName(scaleKey: KeyDef): string {
  return scaleKey.id;
}

/**
 * 音程クラスをスケールルートの調号で表記（# / b を混在させない）
 */
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
  const pc = ((pitchClass % 12) + 12) % 12;
  if (
    typeof scaleKeyOrStyle === 'object' &&
    scaleKeyOrStyle !== null &&
    'pitchClass' in scaleKeyOrStyle
  ) {
    return spellingTableForScaleRoot(scaleKeyOrStyle)[pc] ?? 'C';
  }
  const style = scaleKeyOrStyle;
  const table = style === 'flat' ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  return table[pc] ?? 'C';
}

/** コードルートの表示名（スケールルートの調号に合わせる） */
export function chordRootDisplayName(
  chordKey: KeyDef,
  scaleKey: KeyDef,
): string {
  return noteNameForPitchClass(chordKey.pitchClass, scaleKey);
}

/**
 * スケールルートとルートからの半音数に応じた音名
 */
export function spellNoteForSemitone(
  scaleKey: KeyDef,
  semitoneFromRoot: number,
): string {
  const semitone = ((semitoneFromRoot % 12) + 12) % 12;
  if (semitone === 0) {
    return scaleRootDisplayName(scaleKey);
  }
  const pitchClass = (scaleKey.pitchClass + semitone) % 12;
  return noteNameForPitchClass(pitchClass, scaleKey);
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

const KANA_BY_LETTER: Record<string, string> = {
  C: 'ド',
  D: 'レ',
  E: 'ミ',
  F: 'ファ',
  G: 'ソ',
  A: 'ラ',
  B: 'シ',
};

/**
 * 西洋音名（スペル済み）を固定ドのカナ表記に変換する。
 * 例: C → ド, C# → ド♯, Bb → シ♭, B# → シ♯
 */
export function kanaNoteNameFromWestern(westernName: string): string {
  const match = /^([A-G])(bb|##|b|#)?$/.exec(westernName);
  if (match === null) {
    return westernName;
  }
  const base = KANA_BY_LETTER[match[1]];
  if (base === undefined) {
    return westernName;
  }
  const accidental = match[2] ?? '';
  if (accidental === '') {
    return base;
  }
  const suffix = accidental
    .replace(/##/g, '♯♯')
    .replace(/bb/g, '♭♭')
    .replace(/#/g, '♯')
    .replace(/b/g, '♭');
  return base + suffix;
}

/** 表記に # と b が混在していないか（検証用） */
export function usesMixedAccidentals(names: readonly string[]): boolean {
  const hasSharp = names.some((n) => n.includes('#'));
  const hasFlat = names.some((n) => n.includes('b'));
  return hasSharp && hasFlat;
}
