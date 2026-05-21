import type { FretboardViewMode } from './fretboard-view-mode';

export type LabelDisplayMode = 'interval' | 'note' | 'dot';

export const LABEL_DISPLAY_MODES: readonly LabelDisplayMode[] = [
  'dot',
  'interval',
  'note',
] as const;

export const LABEL_MODE_LABELS: Record<LabelDisplayMode, string> = {
  interval: 'インターバル',
  note: '音名',
  dot: '●',
};

export interface CellDisplayLabels {
  intervalLabel: string;
  chordIntervalLabel: string;
  noteName: string;
}

/** 表示モードに応じたインターバルラベル（コードビューはコードルート基準） */
export function intervalLabelForView(
  cell: Pick<CellDisplayLabels, 'intervalLabel' | 'chordIntervalLabel'>,
  viewMode: FretboardViewMode,
): string {
  return viewMode === 'chord' ? cell.chordIntervalLabel : cell.intervalLabel;
}

export function displayLabelForCell(
  cell: CellDisplayLabels,
  mode: LabelDisplayMode,
  viewMode: FretboardViewMode,
): string {
  if (mode === 'dot') {
    return '';
  }
  if (mode === 'note') {
    return cell.noteName;
  }
  return intervalLabelForView(cell, viewMode);
}

export function isLabelDisplayMode(value: string): value is LabelDisplayMode {
  return (LABEL_DISPLAY_MODES as readonly string[]).includes(value);
}
