import { describe, expect, it } from 'vitest';
import { MVP_CHORD } from '../src/domain/data/chords';
import { MVP_KEY } from '../src/domain/data/keys';
import { MVP_SCALE } from '../src/domain/data/scales';
import { buildFretboard } from '../src/domain/fretboard';
import { displayLabelForCell } from '../src/domain/label-display-mode';
import { noteNameForPitchClass } from '../src/domain/note-names';

describe('noteNameForPitchClass', () => {
  it('maps pitch classes to sharp note names', () => {
    expect(noteNameForPitchClass(0)).toBe('C');
    expect(noteNameForPitchClass(4)).toBe('E');
    expect(noteNameForPitchClass(11)).toBe('B');
  });
});

describe('buildFretboard note names', () => {
  const model = buildFretboard(MVP_KEY, MVP_SCALE, MVP_KEY, MVP_CHORD);

  it('6th string open is E (interval 3 in key C)', () => {
    const open = model.strings[0].frets[0];
    expect(open.noteName).toBe('E');
    expect(open.intervalLabel).toBe('3');
  });

  it('displayLabelForCell switches by mode', () => {
    const cell = model.strings[0].frets[1];
    expect(displayLabelForCell(cell, 'interval')).toBe(cell.intervalLabel);
    expect(displayLabelForCell(cell, 'note')).toBe(cell.noteName);
  });
});
