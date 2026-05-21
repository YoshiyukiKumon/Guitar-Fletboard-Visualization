import { describe, expect, it } from 'vitest';
import {
  displayLabelForCell,
  intervalLabelForView,
  isLabelDisplayMode,
  LABEL_DISPLAY_MODES,
} from '../src/domain/label-display-mode';

describe('label display mode', () => {
  const cell = {
    intervalLabel: '3',
    chordIntervalLabel: '5',
    noteName: 'E',
  };

  it('includes dot mode as first option (default order)', () => {
    expect(LABEL_DISPLAY_MODES[0]).toBe('dot');
    expect(isLabelDisplayMode('dot')).toBe(true);
  });

  it('uses empty label in dot mode (circle capsule only)', () => {
    expect(displayLabelForCell(cell, 'dot', 'scale')).toBe('');
    expect(displayLabelForCell(cell, 'interval', 'scale')).toBe('3');
    expect(displayLabelForCell(cell, 'note', 'scale')).toBe('E');
  });

  it('uses chord-root interval in chord view', () => {
    expect(intervalLabelForView(cell, 'chord')).toBe('5');
    expect(intervalLabelForView(cell, 'scale')).toBe('3');
    expect(displayLabelForCell(cell, 'interval', 'chord')).toBe('5');
    expect(displayLabelForCell(cell, 'interval', 'composite')).toBe('3');
  });
});
