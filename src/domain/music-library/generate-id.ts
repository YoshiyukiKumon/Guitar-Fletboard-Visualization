import { isBuiltinChordId, isBuiltinScaleId } from './builtin-ids';
import { getChordById, getScaleById } from './registry';

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  if (!slug || !ID_PATTERN.test(slug)) {
    return '';
  }
  return slug;
}

function nextUniqueId(
  prefix: string,
  base: string,
  exists: (id: string) => boolean,
): string {
  let id = `${prefix}-${base}`;
  if (!exists(id)) {
    return id;
  }
  let n = 2;
  while (exists(`${prefix}-${base}-${n}`)) {
    n++;
  }
  return `${prefix}-${base}-${n}`;
}

function scaleIdTaken(id: string): boolean {
  return getScaleById(id) !== undefined || isBuiltinScaleId(id);
}

function chordIdTaken(id: string): boolean {
  return getChordById(id) !== undefined || isBuiltinChordId(id);
}

/** 新規カスタムスケール用 ID（名前から生成、重複時は連番） */
export function generateCustomScaleId(name: string): string {
  const base = slugify(name) || `s${Date.now().toString(36)}`;
  return nextUniqueId('custom-scale', base, scaleIdTaken);
}

/** 新規カスタムコード用 ID（名前から生成、重複時は連番） */
export function generateCustomChordId(name: string): string {
  const base = slugify(name) || `c${Date.now().toString(36)}`;
  return nextUniqueId('custom-chord', base, chordIdTaken);
}
