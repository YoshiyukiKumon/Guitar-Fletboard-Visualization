import { CHORDS } from '../data/chords';
import { SCALES } from '../data/scales';
import { semitoneForToneLabel } from '../tone-sequence';

/** 組み込み定義で使われる構成音ラベル（プルダウン用・半音順） */
export function getToneLabelOptions(): readonly string[] {
  const set = new Set<string>();
  for (const scale of SCALES) {
    for (const tone of scale.tones) {
      set.add(tone);
    }
  }
  for (const chord of CHORDS) {
    for (const tone of chord.tones) {
      set.add(tone);
    }
  }
  return [...set].sort((a, b) => {
    const sa = semitoneForToneLabel(a) ?? 99;
    const sb = semitoneForToneLabel(b) ?? 99;
    if (sa !== sb) {
      return sa - sb;
    }
    return a.localeCompare(b);
  });
}
