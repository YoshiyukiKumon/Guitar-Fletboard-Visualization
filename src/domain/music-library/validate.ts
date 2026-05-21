import type { ChordDef } from '../data/chords';
import type { ScaleDef } from '../data/scales';
import { semitoneForToneLabel } from '../tone-sequence';
import { isBuiltinChordId, isBuiltinScaleId } from './builtin-ids';

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  /** 保存成功時の確定 ID（自動発行時） */
  id?: string;
}

function validateId(id: string, kind: 'scale' | 'chord'): string[] {
  const errors: string[] = [];
  if (!id.trim()) {
    errors.push('ID を入力してください');
    return errors;
  }
  if (!ID_PATTERN.test(id)) {
    errors.push(
      'ID は英小文字で始まり、英小文字・数字・ハイフンのみ使用できます',
    );
  }
  if (kind === 'scale' && isBuiltinScaleId(id)) {
    errors.push('組み込みスケールと同じ ID は使えません');
  }
  if (kind === 'chord' && isBuiltinChordId(id)) {
    errors.push('組み込みコードと同じ ID は使えません');
  }
  return errors;
}

export function parseTonesInput(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function validateTones(tones: readonly string[]): string[] {
  const errors: string[] = [];
  if (tones.length === 0) {
    errors.push('構成音を 1 つ以上入力してください');
    return errors;
  }
  for (const tone of tones) {
    if (semitoneForToneLabel(tone) === undefined) {
      errors.push(`不明な構成音ラベル: ${tone}`);
    }
  }
  return errors;
}

export function validateScaleDef(
  def: Pick<ScaleDef, 'id' | 'name' | 'tones'>,
  options?: { allowBuiltinId?: boolean },
): ValidationResult {
  const errors: string[] = [];
  if (!options?.allowBuiltinId) {
    errors.push(...validateId(def.id, 'scale'));
  }
  if (!def.name.trim()) {
    errors.push('名前を入力してください');
  }
  errors.push(...validateTones(def.tones));
  return { ok: errors.length === 0, errors };
}

export function validateChordDef(
  def: Pick<ChordDef, 'id' | 'name' | 'tones'>,
  options?: { allowBuiltinId?: boolean },
): ValidationResult {
  const errors: string[] = [];
  if (!options?.allowBuiltinId) {
    errors.push(...validateId(def.id, 'chord'));
  }
  if (!def.name.trim()) {
    errors.push('名前を入力してください');
  }
  errors.push(...validateTones(def.tones));
  return { ok: errors.length === 0, errors };
}
