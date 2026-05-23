import { describe, expect, it } from 'vitest';
import { findKeyById } from '../src/domain/data/keys';
import { kanaNoteNameFromWestern, noteNameForPitchClass } from '../src/domain/note-names';

describe('kanaNoteNameFromWestern', () => {
  it('maps natural notes to fixed-do kana', () => {
    expect(kanaNoteNameFromWestern('C')).toBe('ド');
    expect(kanaNoteNameFromWestern('D')).toBe('レ');
    expect(kanaNoteNameFromWestern('E')).toBe('ミ');
    expect(kanaNoteNameFromWestern('F')).toBe('ファ');
    expect(kanaNoteNameFromWestern('G')).toBe('ソ');
    expect(kanaNoteNameFromWestern('A')).toBe('ラ');
    expect(kanaNoteNameFromWestern('B')).toBe('シ');
  });

  it('maps sharps and flats from western spellings', () => {
    expect(kanaNoteNameFromWestern('C#')).toBe('ド♯');
    expect(kanaNoteNameFromWestern('Bb')).toBe('シ♭');
    expect(kanaNoteNameFromWestern('B#')).toBe('シ♯');
    expect(kanaNoteNameFromWestern('Eb')).toBe('ミ♭');
  });

  it('follows key-aware spellings from noteNameForPitchClass', () => {
    const fSharp = findKeyById('F#')!;
    expect(kanaNoteNameFromWestern(noteNameForPitchClass(0, fSharp))).toBe('シ♯');
    const bb = findKeyById('Bb')!;
    expect(kanaNoteNameFromWestern(noteNameForPitchClass(11, bb))).toBe('ド♭');
  });
});
