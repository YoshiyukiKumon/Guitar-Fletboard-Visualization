import { labelTokens, normalizeLabel } from './interval-labels';
import { semitoneForToneLabel } from './tone-sequence';

/** コード表示名から度数番号を抽出（例: 6(9) → [6, 9]、sus4 → [4]） */
export function parseDegreesFromChordName(chordName: string): number[] {
  const matches = chordName.match(/\d+/g);
  return matches ? matches.map((n) => Number(n)) : [];
}

/** 構成音トークン → インターバル度数（R=1, 9=9, 13=13 など） */
export function intervalDegreeForToken(token: string): number | undefined {
  const t = normalizeLabel(token);
  switch (t) {
    case 'R':
      return 1;
    case 'b2':
    case '2':
      return 2;
    case 'm3':
    case '3':
      return 3;
    case '#9':
    case 'b9':
    case '9':
      return 9;
    case '4':
      return 4;
    case '11':
    case '#11':
      return 11;
    case 'b5':
    case '5':
    case '+5':
      return 5;
    case '6':
      return 6;
    case '13':
    case 'b13':
      return 13;
    case 'b7':
    case '△7':
      return 7;
    default:
      return undefined;
  }
}

/**
 * 併記ラベルからコード再生用トークンを選ぶ。
 * コード名の度数と一致するトークンを優先（6(9) の 6/13 は 6、2/9 は 9 など）。
 */
export function selectTokenForChordPlayback(
  tone: string,
  chordName: string,
): string {
  const tokens = labelTokens(tone);
  if (tokens.length <= 1) {
    return tokens[0] ?? tone;
  }

  const nameDegrees = parseDegreesFromChordName(chordName);
  const withDegree = tokens
    .map((t) => ({ t, d: intervalDegreeForToken(t) }))
    .filter((x): x is { t: string; d: number } => x.d !== undefined);

  const matching = withDegree.filter((x) => nameDegrees.includes(x.d));
  if (matching.length === 1) {
    return matching[0].t;
  }
  if (matching.length > 1) {
    return matching.sort((a, b) => b.d - a.d)[0].t;
  }

  if (nameDegrees.some((d) => d >= 9)) {
    const tension = withDegree
      .filter((x) => x.d >= 9)
      .sort((a, b) => b.d - a.d);
    if (tension.length > 0) {
      return tension[0].t;
    }
  }

  const inOctave = withDegree
    .filter((x) => x.d < 9)
    .sort((a, b) => a.d - b.d);
  if (inOctave.length > 0) {
    return inOctave[0].t;
  }

  return tokens[0];
}

/** コード再生用のルートからの半音オフセット（9 度以上は +12） */
export function semitoneForChordPlaybackTone(
  tone: string,
  chordName: string,
): number | undefined {
  const token = selectTokenForChordPlayback(tone, chordName);
  const pitchClass = semitoneForToneLabel(token);
  if (pitchClass === undefined) {
    return undefined;
  }
  const degree = intervalDegreeForToken(token);
  if (degree !== undefined && degree >= 9) {
    return pitchClass + 12;
  }
  return pitchClass;
}

/** コード再生用：定義順・重複除去・テンションは 1 オクターブ上 */
export function orderedSemitonesForChordPlayback(
  tones: readonly string[],
  chordName: string,
): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const tone of tones) {
    const semitone = semitoneForChordPlaybackTone(tone, chordName);
    if (semitone === undefined || seen.has(semitone)) {
      continue;
    }
    seen.add(semitone);
    result.push(semitone);
  }
  return result;
}

/** アルペジオ用：ルートから昇順（R → 3 → 5 → …） */
export function orderedSemitonesForChordArpeggio(
  tones: readonly string[],
  chordName: string,
): number[] {
  return [...orderedSemitonesForChordPlayback(tones, chordName)].sort(
    (a, b) => a - b,
  );
}
