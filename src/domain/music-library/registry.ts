import { CHORDS, type ChordDef } from '../data/chords';
import { SCALES, type ScaleDef } from '../data/scales';
import { loadCustomLibrary } from './storage';

export type MusicSource = 'builtin' | 'custom';

export interface ListedScale {
  def: ScaleDef;
  source: MusicSource;
}

export interface ListedChord {
  def: ChordDef;
  source: MusicSource;
}

function customScales(): ScaleDef[] {
  return loadCustomLibrary().scales;
}

function customChords(): ChordDef[] {
  return loadCustomLibrary().chords;
}

export function listScales(): ListedScale[] {
  const builtin: ListedScale[] = SCALES.map((def) => ({
    def,
    source: 'builtin' as const,
  }));
  const custom: ListedScale[] = customScales().map((def) => ({
    def,
    source: 'custom' as const,
  }));
  return [...builtin, ...custom];
}

export function listChords(): ListedChord[] {
  const builtin: ListedChord[] = CHORDS.map((def) => ({
    def,
    source: 'builtin' as const,
  }));
  const custom: ListedChord[] = customChords().map((def) => ({
    def,
    source: 'custom' as const,
  }));
  return [...builtin, ...custom];
}

export function getScaleById(id: string): ScaleDef | undefined {
  return SCALES.find((s) => s.id === id) ?? customScales().find((s) => s.id === id);
}

export function getChordById(id: string): ChordDef | undefined {
  return CHORDS.find((c) => c.id === id) ?? customChords().find((c) => c.id === id);
}

export function isKnownScaleId(id: string): boolean {
  return getScaleById(id) !== undefined;
}

export function isKnownChordId(id: string): boolean {
  return getChordById(id) !== undefined;
}

export function getScaleSource(id: string): MusicSource | undefined {
  if (SCALES.some((s) => s.id === id)) {
    return 'builtin';
  }
  if (customScales().some((s) => s.id === id)) {
    return 'custom';
  }
  return undefined;
}

export function getChordSource(id: string): MusicSource | undefined {
  if (CHORDS.some((c) => c.id === id)) {
    return 'builtin';
  }
  if (customChords().some((c) => c.id === id)) {
    return 'custom';
  }
  return undefined;
}

export function displayScaleName(def: ScaleDef, source: MusicSource): string {
  return source === 'custom' ? `${def.name} (カスタム)` : def.name;
}

export function displayChordName(def: ChordDef, source: MusicSource): string {
  return source === 'custom' ? `${def.name} (カスタム)` : def.name;
}
