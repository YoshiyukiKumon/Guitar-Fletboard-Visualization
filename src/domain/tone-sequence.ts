import type { ChordDef } from './data/chords';
import type { KeyDef } from './data/keys';
import type { ScaleDef } from './data/scales';
import { labelInToneSet, INTERVAL_LABEL_BY_SEMITONE } from './interval-labels';
import { noteNameForPitchClass } from './note-names';

/** 構成音ラベル（併記可）をルートからの半音数に変換 */
export function semitoneForToneLabel(tone: string): number | undefined {
  for (let s = 0; s < 12; s++) {
    const label = INTERVAL_LABEL_BY_SEMITONE[s];
    if (labelInToneSet(label, [tone])) {
      return s;
    }
  }
  return undefined;
}

/** 定義順の 1 オクターブ分の半音オフセット（重複除去） */
export function orderedSemitonesFromTones(tones: readonly string[]): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const tone of tones) {
    const semitone = semitoneForToneLabel(tone);
    if (semitone === undefined || seen.has(semitone)) {
      continue;
    }
    seen.add(semitone);
    result.push(semitone);
  }
  return result;
}

/** ルート音程クラス + 半音オフセット → MIDI ノート番号（オクターブ 4 付近） */
export function midiNoteNumber(rootPitchClass: number, semitone: number): number {
  return 60 + rootPitchClass + semitone;
}

/** 表示用スケール名（例: D Major） */
export function formatScaleName(scaleKey: KeyDef, scale: ScaleDef): string {
  return `${scaleKey.id} ${scale.name}`;
}

/** 表示用コード名（例: Dm7） */
export function formatChordName(chordKey: KeyDef, chord: ChordDef): string {
  return `${chordKey.id}${chord.name}`;
}

/** スケール / コードの一行表示（例: D Major / Dm7） */
export function formatScaleChordSummary(
  scaleKey: KeyDef,
  scale: ScaleDef,
  chordKey: KeyDef,
  chord: ChordDef,
): string {
  return `${formatScaleName(scaleKey, scale)} / ${formatChordName(chordKey, chord)}`;
}

/** 構成音定義順の音名一覧（例: D · E · F# · G） */
export function noteNamesFromTones(
  rootKey: KeyDef,
  tones: readonly string[],
  notationScaleKey?: KeyDef,
): string {
  const spellingKey = notationScaleKey ?? rootKey;
  return orderedSemitonesFromTones(tones)
    .map((semitone) =>
      noteNameForPitchClass(
        (rootKey.pitchClass + semitone) % 12,
        spellingKey,
      ),
    )
    .join(' · ');
}
