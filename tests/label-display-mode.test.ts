import { describe, expect, it } from 'vitest';
import {
  displayLabelForCell,
  isLabelDisplayMode,
  LABEL_DISPLAY_MODES,
} from '../src/domain/label-display-mode';

describe('label display mode', () => {
  const cell = { intervalLabel: '3', noteName: 'E' };

  it('includes dot mode as first option (default order)', () => {
    expect(LABEL_DISPLAY_MODES[0]).toBe('dot');
    expect(isLabelDisplayMode('dot')).toBe(true);
  });

  it('uses empty label in dot mode (circle capsule only)', () => {
    expect(displayLabelForCell(cell, 'dot')).toBe('');
    expect(displayLabelForCell(cell, 'interval')).toBe('3');
    expect(displayLabelForCell(cell, 'note')).toBe('E');
  });
});
