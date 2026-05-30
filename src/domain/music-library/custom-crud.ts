import type { ChordDef } from '../data/chords';
import type { ScaleDef } from '../data/scales';
import type { StrumPatternDef } from '../strum-pattern/strum-pattern';
import {
  getChordById,
  getScaleById,
  getStrumPatternById,
  getChordSource,
  getScaleSource,
  getStrumPatternSource,
} from './registry';
import {
  loadCustomLibrary,
  resetCustomLibrary,
  saveCustomLibrary,
} from './storage';
import { generateCustomChordId, generateCustomScaleId, generateCustomStrumPatternId } from './generate-id';
import {
  validateChordDef,
  validateScaleDef,
  type ValidationResult,
} from './validate';
import { validateStrumPatternDef } from '../strum-pattern/validate';

function resolveScaleId(def: ScaleDef): ScaleDef {
  const id = def.id.trim() ? def.id.trim() : generateCustomScaleId(def.name);
  return { ...def, id, tones: [...def.tones] };
}

function resolveChordId(def: ChordDef): ChordDef {
  const id = def.id.trim() ? def.id.trim() : generateCustomChordId(def.name);
  return { ...def, id, tones: [...def.tones] };
}

function resolveStrumPatternId(def: StrumPatternDef): StrumPatternDef {
  const id = def.id.trim()
    ? def.id.trim()
    : generateCustomStrumPatternId(def.name);
  return {
    ...def,
    id,
    timeSignature: def.timeSignature?.trim() || '4/4',
    notation: def.notation.trim(),
  };
}

export function upsertCustomScale(def: ScaleDef): ValidationResult {
  const toSave = resolveScaleId(def);
  const result = validateScaleDef(toSave);
  if (!result.ok) {
    return result;
  }
  const library = loadCustomLibrary();
  const index = library.scales.findIndex((s) => s.id === toSave.id);
  if (index >= 0) {
    library.scales[index] = toSave;
  } else {
    library.scales.push(toSave);
  }
  saveCustomLibrary(library);
  return { ok: true, errors: [], id: toSave.id };
}

export function deleteCustomScale(id: string): void {
  const library = loadCustomLibrary();
  library.scales = library.scales.filter((s) => s.id !== id);
  saveCustomLibrary(library);
}

export function upsertCustomChord(def: ChordDef): ValidationResult {
  const toSave = resolveChordId(def);
  const result = validateChordDef(toSave);
  if (!result.ok) {
    return result;
  }
  const library = loadCustomLibrary();
  const index = library.chords.findIndex((c) => c.id === toSave.id);
  if (index >= 0) {
    library.chords[index] = toSave;
  } else {
    library.chords.push(toSave);
  }
  saveCustomLibrary(library);
  return { ok: true, errors: [], id: toSave.id };
}

export function deleteCustomChord(id: string): void {
  const library = loadCustomLibrary();
  library.chords = library.chords.filter((c) => c.id !== id);
  saveCustomLibrary(library);
}

export function upsertCustomStrumPattern(def: StrumPatternDef): ValidationResult {
  const toSave = resolveStrumPatternId(def);
  const result = validateStrumPatternDef(toSave);
  if (!result.ok) {
    return result;
  }
  const library = loadCustomLibrary();
  const index = library.strumPatterns.findIndex((pattern) => pattern.id === toSave.id);
  if (index >= 0) {
    library.strumPatterns[index] = toSave;
  } else {
    library.strumPatterns.push(toSave);
  }
  saveCustomLibrary(library);
  return { ok: true, errors: [], id: toSave.id };
}

export function deleteCustomStrumPattern(id: string): void {
  const library = loadCustomLibrary();
  library.strumPatterns = library.strumPatterns.filter(
    (pattern) => pattern.id !== id,
  );
  saveCustomLibrary(library);
}

export function duplicateScaleAsCustom(builtinId: string): ScaleDef | undefined {
  const source = getScaleById(builtinId);
  if (!source || getScaleSource(builtinId) !== 'builtin') {
    return undefined;
  }
  return {
    id: '',
    name: `${source.name} (コピー)`,
    tones: [...source.tones],
  };
}

export function duplicateChordAsCustom(builtinId: string): ChordDef | undefined {
  const source = getChordById(builtinId);
  if (!source || getChordSource(builtinId) !== 'builtin') {
    return undefined;
  }
  return {
    id: '',
    name: `${source.name} (コピー)`,
    tones: [...source.tones],
  };
}

export function duplicateStrumPatternAsCustom(
  builtinId: string,
): StrumPatternDef | undefined {
  const source = getStrumPatternById(builtinId);
  if (!source || getStrumPatternSource(builtinId) !== 'builtin') {
    return undefined;
  }
  return {
    id: '',
    name: `${source.name} (コピー)`,
    timeSignature: source.timeSignature,
    notation: source.notation,
  };
}

export function resetLibraryToInitial(): void {
  resetCustomLibrary();
}

export { loadCustomLibrary, saveCustomLibrary } from './storage';
