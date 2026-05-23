import { canonicalKeyIdForPitchClass } from './chord-root-options';
import { findChordById } from './data/chords';
import { findKeyById, type KeyDef } from './data/keys';
import type { ScaleDef } from './data/scales';
import { labelForSemitone } from './interval-labels';
import { chordRootDisplayName } from './note-names';
import { formatChordName, orderedSemitonesFromTones } from './tone-sequence';

const IONIAN_DEGREE_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;
const FULL_STACK_STEPS = [0, 2, 4, 6] as const;
const TRIAD_STACK_STEPS = [0, 2, 4] as const;

const MIN_SCALE_TONES = 4;

export interface DiatonicChordEntry {
  degree: number;
  relativeLabel: string;
  chordKeyId: string;
  chordId: string | null;
  displayName: string;
  toneLabels: readonly string[];
  playbackSemitones: readonly number[];
}

export interface DiatonicChordPlayPayload {
  chordKeyId: string;
  chordId: string | null;
  playbackSemitones: readonly number[];
}

export type DiatonicChordsResult =
  | { supported: true; entries: DiatonicChordEntry[] }
  | { supported: false; reason: 'too-few-tones' | 'invalid-tones' };

type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented';

interface ChordMapping {
  chordId: string;
  relativeSuffix: string;
}

interface DegreeStack {
  degreeIndex: number;
  degree: number;
  third: number;
  fifth: number;
  seventh: number;
  triad: TriadQuality | undefined;
  toneLabels: string[];
  stackSteps: readonly number[];
  voiceCount: number;
  playbackSemitones: number[];
  pcKey: string;
  chordKeyId: string;
}

interface DirectResolution {
  chordId: string;
  chordKeyId: string;
  relativeLabel: string;
  displayName: string;
}

export function computeDiatonicChords(
  scaleKey: KeyDef,
  scale: ScaleDef,
): DiatonicChordsResult {
  const N = scale.tones.length;
  if (N < MIN_SCALE_TONES) {
    return { supported: false, reason: 'too-few-tones' };
  }

  const scaleSemitones = orderedSemitonesFromTones(scale.tones);
  if (scaleSemitones.length !== N) {
    return { supported: false, reason: 'invalid-tones' };
  }

  const stacks: DegreeStack[] = [];
  for (let i = 0; i < N; i++) {
    stacks.push(buildStack(scaleKey, scaleSemitones, i));
  }

  const directByIndex: (DirectResolution | undefined)[] = stacks.map((stack) =>
    tryDirectResolution(scaleKey, scaleSemitones, stack),
  );

  const entries = stacks.map((stack, i) =>
    resolveEntry(scaleKey, scaleSemitones, stack, stacks, directByIndex, i),
  );

  return { supported: true, entries };
}

function buildStack(
  scaleKey: KeyDef,
  scaleSemitones: number[],
  degreeIndex: number,
): DegreeStack {
  const fullIntervals = FULL_STACK_STEPS.map((step) =>
    intervalFromRoot(scaleSemitones, degreeIndex, step),
  );
  const uniquePitchClassCount = countUniquePitchClasses(fullIntervals);
  const stackSteps =
    uniquePitchClassCount <= 3 ? TRIAD_STACK_STEPS : FULL_STACK_STEPS;
  const stackIntervals = stackSteps.map((step) =>
    intervalFromRoot(scaleSemitones, degreeIndex, step),
  );
  const rootPc =
    (scaleKey.pitchClass + scaleSemitones[degreeIndex] + 12) % 12;

  return {
    degreeIndex,
    degree: degreeIndex + 1,
    third: stackIntervals[1] ?? 0,
    fifth: stackIntervals[2] ?? 0,
    seventh: stackSteps.length === 4 ? (stackIntervals[3] ?? 0) : 0,
    triad: triadQuality(stackIntervals[1] ?? 0, stackIntervals[2] ?? 0),
    toneLabels: stackIntervals.map((interval) =>
      labelForSemitone(interval % 12),
    ),
    stackSteps,
    voiceCount: stackSteps.length,
    playbackSemitones: dedupePlaybackIntervals(stackIntervals),
    pcKey: pitchClassKeyFromRoot(rootPc, stackIntervals),
    chordKeyId: canonicalKeyIdForPitchClass(rootPc),
  };
}

function countUniquePitchClasses(intervals: number[]): number {
  const seen = new Set<number>();
  for (const interval of intervals) {
    seen.add(((interval % 12) + 12) % 12);
  }
  return seen.size;
}

function dedupePlaybackIntervals(intervals: number[]): number[] {
  const seen = new Set<number>();
  const playback: number[] = [];
  for (const interval of intervals) {
    const pc = ((interval % 12) + 12) % 12;
    if (!seen.has(pc)) {
      seen.add(pc);
      playback.push(interval);
    }
  }
  return playback;
}

function pitchClassKeyFromRoot(rootPc: number, intervals: number[]): string {
  const pcs = intervals.map(
    (interval) => (rootPc + ((interval % 12) + 12) % 12) % 12,
  );
  pcs.sort((a, b) => a - b);
  return pcs.join(',');
}

function tryDirectResolution(
  scaleKey: KeyDef,
  scaleSemitones: number[],
  stack: DegreeStack,
): DirectResolution | undefined {
  const mapping =
    stack.voiceCount === 3
      ? stack.triad !== undefined
        ? mapTriadChord(stack.triad)
        : undefined
      : stack.triad !== undefined
        ? mapSeventhChord(stack.triad, stack.seventh)
        : undefined;
  if (mapping === undefined) {
    return undefined;
  }

  const chord = findChordById(mapping.chordId);
  const chordKey = findKeyById(stack.chordKeyId);
  if (chord === undefined || chordKey === undefined) {
    return undefined;
  }

  return {
    chordId: mapping.chordId,
    chordKeyId: stack.chordKeyId,
    relativeLabel: relativeLabelForDegree(
      stack.degree,
      stack.degreeIndex,
      scaleSemitones,
      stack.triad,
      mapping.relativeSuffix,
    ),
    displayName: formatChordName(chordKey, chord, scaleKey),
  };
}

function resolveEntry(
  scaleKey: KeyDef,
  scaleSemitones: number[],
  stack: DegreeStack,
  stacks: DegreeStack[],
  directByIndex: (DirectResolution | undefined)[],
  index: number,
): DiatonicChordEntry {
  const playbackSemitones = stack.playbackSemitones;

  const direct = directByIndex[index];
  if (direct !== undefined) {
    return entryFromResolution(stack, direct, playbackSemitones);
  }

  const inversionSource = findInversionSource(
    stack,
    stacks,
    directByIndex,
    index,
  );
  if (inversionSource !== undefined) {
    const bassKey = findKeyById(stack.chordKeyId);
    const bassName =
      bassKey !== undefined
        ? chordRootDisplayName(bassKey, scaleKey)
        : stack.chordKeyId;
    return {
      degree: stack.degree,
      relativeLabel: `${inversionSource.relativeLabel}/${toRomanNumeral(stack.degree)}`,
      chordKeyId: inversionSource.chordKeyId,
      chordId: inversionSource.chordId,
      displayName: `${inversionSource.displayName}/${bassName}`,
      toneLabels: stack.toneLabels,
      playbackSemitones,
    };
  }

  const relativeOnly = tryRelativeLabelOnly(
    scaleSemitones,
    stack,
    scaleKey,
  );
  if (relativeOnly !== undefined) {
    return {
      degree: stack.degree,
      relativeLabel: relativeOnly.relativeLabel,
      chordKeyId: stack.chordKeyId,
      chordId: null,
      displayName: relativeOnly.displayName,
      toneLabels: stack.toneLabels,
      playbackSemitones,
    };
  }

  return fallbackEntry(scaleKey, scaleSemitones, stack, playbackSemitones);
}

function entryFromResolution(
  stack: DegreeStack,
  resolution: DirectResolution,
  playbackSemitones: readonly number[],
): DiatonicChordEntry {
  return {
    degree: stack.degree,
    relativeLabel: resolution.relativeLabel,
    chordKeyId: resolution.chordKeyId,
    chordId: resolution.chordId,
    displayName: resolution.displayName,
    toneLabels: stack.toneLabels,
    playbackSemitones,
  };
}

function findInversionSource(
  stack: DegreeStack,
  stacks: DegreeStack[],
  directByIndex: (DirectResolution | undefined)[],
  index: number,
): DirectResolution | undefined {
  let best: { sourceIndex: number; resolution: DirectResolution } | undefined;

  for (let j = 0; j < stacks.length; j++) {
    if (j === index) {
      continue;
    }
    if (stacks[j].pcKey !== stack.pcKey) {
      continue;
    }
    const resolution = directByIndex[j];
    if (resolution === undefined) {
      continue;
    }
    if (best === undefined || j < best.sourceIndex) {
      best = { sourceIndex: j, resolution };
    }
  }

  return best?.resolution;
}

function tryRelativeLabelOnly(
  scaleSemitones: number[],
  stack: DegreeStack,
  scaleKey: KeyDef,
): { relativeLabel: string; displayName: string } | undefined {
  const suffix = inferRelativeSuffix(stack);
  if (suffix === undefined) {
    return undefined;
  }

  const relativeLabel = relativeLabelForDegree(
    stack.degree,
    stack.degreeIndex,
    scaleSemitones,
    stack.triad,
    suffix,
  );
  const chordKey = findKeyById(stack.chordKeyId);
  const displayName =
    chordKey !== undefined
      ? `${chordRootDisplayName(chordKey, scaleKey)}${suffix}`
      : `${stack.chordKeyId}${suffix}`;

  return { relativeLabel, displayName };
}

function inferRelativeSuffix(stack: DegreeStack): string | undefined {
  if (stack.voiceCount === 3 && stack.triad !== undefined) {
    const mapping = mapTriadChord(stack.triad);
    if (mapping !== undefined) {
      return mapping.relativeSuffix;
    }
  }

  if (stack.triad !== undefined) {
    const mapping = mapSeventhChord(stack.triad, stack.seventh);
    if (mapping !== undefined) {
      return mapping.relativeSuffix;
    }
  }

  if (stack.voiceCount === 3) {
    return describeTriadIntervalSuffix(stack.third, stack.fifth);
  }

  return describeIntervalSuffix(stack.third, stack.fifth, stack.seventh);
}

function describeTriadIntervalSuffix(
  third: number,
  fifth: number,
): string | undefined {
  const triad = triadQuality(third, fifth);
  if (triad === undefined) {
    return `(3=${third}-5=${fifth})`;
  }
  return mapTriadChord(triad)?.relativeSuffix ?? `(3=${third}-5=${fifth})`;
}

function describeIntervalSuffix(
  third: number,
  fifth: number,
  seventh: number,
): string | undefined {
  const parts: string[] = [];
  if (third === 3) {
    parts.push('m3');
  } else if (third === 4) {
    parts.push('M3');
  } else if (third === 2) {
    parts.push('2');
  } else {
    parts.push(`3=${third}`);
  }

  if (fifth === 7) {
    parts.push('5');
  } else if (fifth === 6) {
    parts.push('b5');
  } else if (fifth === 8) {
    parts.push('+5');
  } else if (fifth === 5) {
    parts.push('4');
  } else {
    parts.push(`5=${fifth}`);
  }

  if (seventh === 10) {
    parts.push('b7');
  } else if (seventh === 11) {
    parts.push('7');
  } else if (seventh === 9) {
    parts.push('6');
  } else {
    parts.push(`7=${seventh}`);
  }

  return `(${parts.join('-')})`;
}

function fallbackEntry(
  scaleKey: KeyDef,
  scaleSemitones: number[],
  stack: DegreeStack,
  playbackSemitones: readonly number[],
): DiatonicChordEntry {
  const roman = relativeLabelForDegree(
    stack.degree,
    stack.degreeIndex,
    scaleSemitones,
    stack.triad,
    '',
  );
  const abbrev = stack.toneLabels
    .map((label) => label.split('/')[0]?.trim() ?? label)
    .join('-');
  const chordKey = findKeyById(stack.chordKeyId);
  const rootName =
    chordKey !== undefined
      ? chordRootDisplayName(chordKey, scaleKey)
      : stack.chordKeyId;

  return {
    degree: stack.degree,
    relativeLabel: `${roman}[${abbrev}]`,
    chordKeyId: stack.chordKeyId,
    chordId: null,
    displayName: `${rootName} ${stack.toneLabels.join(' ')}`,
    toneLabels: stack.toneLabels,
    playbackSemitones,
  };
}

function absoluteSemitone(
  scaleSemitones: number[],
  degreeIndex: number,
  stackStep: number,
): number {
  const N = scaleSemitones.length;
  const absoluteIndex = degreeIndex + stackStep;
  const wrapCount = Math.floor(absoluteIndex / N);
  const idx = absoluteIndex % N;
  return scaleSemitones[idx] + 12 * wrapCount;
}

function intervalFromRoot(
  scaleSemitones: number[],
  degreeIndex: number,
  stackStep: number,
): number {
  const root = absoluteSemitone(scaleSemitones, degreeIndex, 0);
  const note = absoluteSemitone(scaleSemitones, degreeIndex, stackStep);
  return note - root;
}

function triadQuality(
  third: number,
  fifth: number,
): TriadQuality | undefined {
  if (third === 4 && fifth === 7) {
    return 'major';
  }
  if (third === 3 && fifth === 7) {
    return 'minor';
  }
  if (third === 3 && fifth === 6) {
    return 'diminished';
  }
  if (third === 4 && fifth === 8) {
    return 'augmented';
  }
  return undefined;
}

function mapTriadChord(triad: TriadQuality): ChordMapping | undefined {
  switch (triad) {
    case 'major':
      return { chordId: 'major-triad', relativeSuffix: '' };
    case 'minor':
      return { chordId: 'm', relativeSuffix: 'm' };
    case 'diminished':
      return { chordId: 'dim', relativeSuffix: 'dim' };
    case 'augmented':
      return { chordId: 'aug', relativeSuffix: 'aug' };
    default: {
      const _exhaustive: never = triad;
      return _exhaustive;
    }
  }
}

function mapSeventhChord(
  triad: TriadQuality,
  seventh: number,
): ChordMapping | undefined {
  switch (triad) {
    case 'major':
      if (seventh === 11) {
        return { chordId: 'maj7', relativeSuffix: '△7' };
      }
      if (seventh === 10) {
        return { chordId: '7', relativeSuffix: '7' };
      }
      if (seventh === 9) {
        return { chordId: '6', relativeSuffix: '6' };
      }
      return undefined;
    case 'minor':
      if (seventh === 10) {
        return { chordId: 'm7', relativeSuffix: 'm7' };
      }
      if (seventh === 11) {
        return { chordId: 'm-maj7', relativeSuffix: 'm△7' };
      }
      return undefined;
    case 'diminished':
      if (seventh === 10) {
        return { chordId: 'm7b5', relativeSuffix: 'm7(♭5)' };
      }
      if (seventh === 9) {
        return { chordId: 'dim7', relativeSuffix: 'dim7' };
      }
      return undefined;
    case 'augmented':
      if (seventh === 11) {
        return { chordId: 'maj7-sharp5', relativeSuffix: '△7(+5)' };
      }
      if (seventh === 10) {
        return { chordId: '7sharp5', relativeSuffix: '7(♯5)' };
      }
      return undefined;
    default: {
      const _exhaustive: never = triad;
      return _exhaustive;
    }
  }
}

function normalizedDegreeDelta(actual: number, ionianExpected: number): number {
  let delta = actual - ionianExpected;
  while (delta > 6) {
    delta -= 12;
  }
  while (delta < -6) {
    delta += 12;
  }
  return delta;
}

function accidentalPrefix(delta: number): string {
  if (delta === -1) {
    return '♭';
  }
  if (delta === 1) {
    return '♯';
  }
  return '';
}

function toRomanNumeral(degree: number): string {
  const pairs: readonly (readonly [number, string])[] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let n = degree;
  let result = '';
  for (const [value, numeral] of pairs) {
    while (n >= value) {
      result += numeral;
      n -= value;
    }
  }
  return result;
}

function relativeLabelForDegree(
  degree: number,
  degreeIndex: number,
  scaleSemitones: number[],
  triad: TriadQuality | undefined,
  suffix: string,
): string {
  const delta = normalizedDegreeDelta(
    scaleSemitones[degreeIndex],
    IONIAN_DEGREE_SEMITONES[degreeIndex % 7],
  );
  const prefix = accidentalPrefix(delta);
  const roman = toRomanNumeral(degree);

  if (degreeIndex === 0 && triad === 'minor') {
    return `${prefix}I${suffix}`;
  }

  return `${prefix}${roman}${suffix}`;
}
