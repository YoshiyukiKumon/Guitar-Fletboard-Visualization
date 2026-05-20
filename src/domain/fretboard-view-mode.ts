/** スプレッドシート相当の指板表示モード */
export type FretboardViewMode = 'fretboard' | 'scale' | 'chord' | 'composite';

export const FRETBOARD_VIEW_MODES: readonly FretboardViewMode[] = [
  'fretboard',
  'scale',
  'chord',
  'composite',
] as const;

export const VIEW_MODE_LABELS: Record<FretboardViewMode, string> = {
  fretboard: '指板',
  scale: 'スケール',
  chord: 'コード',
  composite: '複合',
};

export type CapsuleStyleKind = 'root' | 'scale' | 'chord' | 'muted';

export interface CapsuleToneFlags {
  inScale: boolean;
  inChord: boolean;
  isScaleRoot: boolean;
  isChordRoot: boolean;
}

export function resolveCapsuleStyle(
  cell: CapsuleToneFlags,
  mode: FretboardViewMode,
): CapsuleStyleKind {
  switch (mode) {
    case 'fretboard':
      return cell.isScaleRoot ? 'root' : 'scale';
    case 'scale':
      if (cell.isScaleRoot) {
        return 'root';
      }
      return cell.inScale ? 'scale' : 'muted';
    case 'chord':
      if (cell.isChordRoot) {
        return 'root';
      }
      return cell.inChord ? 'chord' : 'muted';
    case 'composite':
      if (cell.isScaleRoot || cell.isChordRoot) {
        return 'root';
      }
      if (cell.inChord) {
        return 'chord';
      }
      if (cell.inScale) {
        return 'scale';
      }
      return 'muted';
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function isFretboardViewMode(value: string): value is FretboardViewMode {
  return (FRETBOARD_VIEW_MODES as readonly string[]).includes(value);
}
