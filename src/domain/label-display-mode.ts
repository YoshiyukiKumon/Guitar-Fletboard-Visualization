export type LabelDisplayMode = 'interval' | 'note';

export const LABEL_DISPLAY_MODES: readonly LabelDisplayMode[] = [
  'interval',
  'note',
] as const;

export const LABEL_MODE_LABELS: Record<LabelDisplayMode, string> = {
  interval: 'インターバル',
  note: '音名',
};

export interface CellDisplayLabels {
  intervalLabel: string;
  noteName: string;
}

export function displayLabelForCell(
  cell: CellDisplayLabels,
  mode: LabelDisplayMode,
): string {
  return mode === 'note' ? cell.noteName : cell.intervalLabel;
}

export function isLabelDisplayMode(value: string): value is LabelDisplayMode {
  return (LABEL_DISPLAY_MODES as readonly string[]).includes(value);
}
