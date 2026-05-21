import type { ChordDef } from '../data/chords';
import type { ScaleDef } from '../data/scales';
import { getChordById, getScaleById, getChordSource, getScaleSource } from './registry';
import {
  loadCustomLibrary,
  resetCustomLibrary,
  saveCustomLibrary,
} from './storage';
import { generateCustomChordId, generateCustomScaleId } from './generate-id';
import {
  validateChordDef,
  validateScaleDef,
  type ValidationResult,
} from './validate';

function resolveScaleId(def: ScaleDef): ScaleDef {
  const id = def.id.trim() ? def.id.trim() : generateCustomScaleId(def.name);
  return { ...def, id, tones: [...def.tones] };
}

function resolveChordId(def: ChordDef): ChordDef {
  const id = def.id.trim() ? def.id.trim() : generateCustomChordId(def.name);
  return { ...def, id, tones: [...def.tones] };
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

export function resetLibraryToInitial(): void {
  resetCustomLibrary();
}

export { loadCustomLibrary, saveCustomLibrary } from './storage';
