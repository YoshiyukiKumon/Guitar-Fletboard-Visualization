import type { ChordDef } from '../data/chords';
import type { ScaleDef } from '../data/scales';
import { isBuiltinChordId, isBuiltinScaleId } from './builtin-ids';
import { listChords, listScales } from './registry';
import { loadCustomLibrary, type CustomMusicLibrary } from './storage';
import { validateChordDef, validateScaleDef } from './validate';

const HEADER = 'type,id,name,tones';
const TONE_SEP = '|';

export interface CsvImportPreview {
  scales: ScaleDef[];
  chords: ChordDef[];
  errors: string[];
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function encodeTones(tones: readonly string[]): string {
  return tones.join(TONE_SEP);
}

function decodeTones(raw: string): string[] {
  return raw
    .split(TONE_SEP)
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  fields.push(current.trim());
  return fields;
}

export function exportLibraryCsv(): string {
  const lines = [HEADER];
  for (const { def } of listScales()) {
    lines.push(
      ['scale', def.id, def.name, encodeTones(def.tones)]
        .map(escapeCsvField)
        .join(','),
    );
  }
  for (const { def } of listChords()) {
    lines.push(
      ['chord', def.id, def.name, encodeTones(def.tones)]
        .map(escapeCsvField)
        .join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

export function parseLibraryCsv(text: string): CsvImportPreview {
  const scales: ScaleDef[] = [];
  const chords: ChordDef[] = [];
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { scales, chords, errors: ['CSV が空です'] };
  }
  const header = lines[0].trim().toLowerCase();
  if (header !== HEADER) {
    return {
      scales,
      chords,
      errors: [`1 行目は "${HEADER}" である必要があります`],
    };
  }

  const seenIds = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 4) {
      errors.push(`${i + 1} 行目: 列が不足しています`);
      continue;
    }
    const [type, id, name, tonesRaw] = row;
    const tones = decodeTones(tonesRaw);
    if (type !== 'scale' && type !== 'chord') {
      errors.push(`${i + 1} 行目: type は scale または chord です`);
      continue;
    }
    if (type === 'scale' && isBuiltinScaleId(id)) {
      continue;
    }
    if (type === 'chord' && isBuiltinChordId(id)) {
      continue;
    }
    if (seenIds.has(id)) {
      errors.push(`${i + 1} 行目: 重複 ID (${id})`);
      continue;
    }
    const def = { id, name, tones };
    const result =
      type === 'scale' ? validateScaleDef(def) : validateChordDef(def);
    if (!result.ok) {
      errors.push(`${i + 1} 行目: ${result.errors.join(' / ')}`);
      continue;
    }
    seenIds.add(id);
    if (type === 'scale') {
      scales.push(def);
    } else {
      chords.push(def);
    }
  }

  return { scales, chords, errors };
}

export function applyCustomLibraryImport(preview: CsvImportPreview): CustomMusicLibrary {
  const existing = loadCustomLibrary();
  const library: CustomMusicLibrary = {
    scales: preview.scales,
    chords: preview.chords,
    strumPatterns: existing.strumPatterns,
  };
  return library;
}

export function customLibraryFromStorage(): CustomMusicLibrary {
  return loadCustomLibrary();
}
