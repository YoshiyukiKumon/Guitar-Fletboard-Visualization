import { isChordId, MVP_CHORD } from '../domain/data/chords';
import { isKeyId, MVP_KEY } from '../domain/data/keys';
import { isScaleId, MVP_SCALE } from '../domain/data/scales';
import {
  type FretboardViewMode,
  isFretboardViewMode,
} from '../domain/fretboard-view-mode';
import {
  type LabelDisplayMode,
  isLabelDisplayMode,
} from '../domain/label-display-mode';

const STORAGE_KEY = 'guitar-practice-settings';

export interface AppSettings {
  viewMode: FretboardViewMode;
  labelMode: LabelDisplayMode;
  scaleKeyId: string;
  scaleId: string;
  chordKeyId: string;
  chordId: string;
  /** 再生音量 0〜100 */
  volume: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  viewMode: 'composite',
  labelMode: 'interval',
  scaleKeyId: MVP_KEY.id,
  scaleId: MVP_SCALE.id,
  chordKeyId: MVP_KEY.id,
  chordId: MVP_CHORD.id,
  volume: 80,
};

function clampVolume(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_SETTINGS.volume;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings> & {
      keyId?: string;
      showScaleLegend?: boolean;
      showChordLegend?: boolean;
    };

    const legacyKeyId =
      parsed.scaleKeyId && isKeyId(parsed.scaleKeyId)
        ? parsed.scaleKeyId
        : parsed.keyId && isKeyId(parsed.keyId)
          ? parsed.keyId
          : DEFAULT_SETTINGS.scaleKeyId;

    const chordKeyId =
      parsed.chordKeyId && isKeyId(parsed.chordKeyId)
        ? parsed.chordKeyId
        : parsed.keyId && isKeyId(parsed.keyId)
          ? parsed.keyId
          : DEFAULT_SETTINGS.chordKeyId;

    return {
      viewMode:
        parsed.viewMode && isFretboardViewMode(parsed.viewMode)
          ? parsed.viewMode
          : DEFAULT_SETTINGS.viewMode,
      labelMode:
        parsed.labelMode && isLabelDisplayMode(parsed.labelMode)
          ? parsed.labelMode
          : DEFAULT_SETTINGS.labelMode,
      scaleKeyId: legacyKeyId,
      scaleId:
        parsed.scaleId && isScaleId(parsed.scaleId)
          ? parsed.scaleId
          : DEFAULT_SETTINGS.scaleId,
      chordKeyId,
      chordId:
        parsed.chordId && isChordId(parsed.chordId)
          ? parsed.chordId
          : DEFAULT_SETTINGS.chordId,
      volume: clampVolume(parsed.volume),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
