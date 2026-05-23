import './styles/main.css';
import { tonePlayer } from './audio/tone-player';
import { remapChordKeyIdForScaleKey } from './domain/chord-root-options';
import { findKeyById } from './domain/data/keys';
import { findChordById } from './domain/data/chords';
import {
  loadSettings,
  sanitizeMusicSelectionIds,
  saveSettings,
} from './app/storage';
import type { AppSettings } from './app/storage';
import { renderApp } from './ui/app-shell';
import type { LibraryViewState } from './ui/library-view';

const appRootEl = document.querySelector('#app');
if (!(appRootEl instanceof HTMLDivElement)) {
  throw new Error('#app not found');
}
const appRoot = appRootEl;

let settings = loadSettings();
let libraryState: LibraryViewState = {
  tab: 'scale',
  selectedScaleId: null,
  selectedChordId: null,
};

tonePlayer.setVolume(settings.volume);
tonePlayer.setInstrument(settings.instrumentId);

function installAudioUnlock(): void {
  const unlock = (): void => {
    tonePlayer.unlockFromUserGesture();
  };
  document.addEventListener('touchstart', unlock, { passive: true, capture: true });
  document.addEventListener('pointerdown', unlock, { capture: true });
}

installAudioUnlock();

function applySanitizedMusicIds(): void {
  const next = sanitizeMusicSelectionIds(settings);
  settings = { ...settings, ...next };
}

function refresh(partial?: Partial<AppSettings>): void {
  if (partial) {
    settings = { ...settings, ...partial };
  }
  if (partial?.volume !== undefined) {
    tonePlayer.setVolume(settings.volume);
  }
  if (partial?.instrumentId !== undefined) {
    tonePlayer.setInstrument(settings.instrumentId);
  }
  renderApp(appRoot, settings, {
    libraryState,
    onLibraryStateChange: (state) => {
      libraryState = state;
      refresh();
    },
    onLibraryChanged: () => {
      applySanitizedMusicIds();
      saveSettings(settings);
      refresh();
    },
    onAppModeChange: (appMode) => {
      saveSettings({ ...settings, appMode });
      refresh({ appMode });
    },
    onViewModeChange: (viewMode) => {
      saveSettings({ ...settings, viewMode });
      refresh({ viewMode });
    },
    onLabelModeChange: (labelMode) => {
      saveSettings({ ...settings, labelMode });
      refresh({ labelMode });
    },
    onScaleKeyChange: (scaleKeyId) => {
      const scaleKey = findKeyById(scaleKeyId);
      const chordKeyId =
        scaleKey !== undefined
          ? remapChordKeyIdForScaleKey(settings.chordKeyId, scaleKey)
          : settings.chordKeyId;
      saveSettings({ ...settings, scaleKeyId, chordKeyId });
      refresh({ scaleKeyId, chordKeyId });
    },
    onScaleChange: (scaleId) => {
      saveSettings({ ...settings, scaleId });
      refresh({ scaleId });
    },
    onChordKeyChange: (chordKeyId) => {
      saveSettings({ ...settings, chordKeyId });
      refresh({ chordKeyId });
    },
    onChordChange: (chordId) => {
      saveSettings({ ...settings, chordId });
      refresh({ chordId });
    },
    onDiatonicChordApply: (chordKeyId, chordId) => {
      saveSettings({ ...settings, chordKeyId, chordId });
      refresh({ chordKeyId, chordId });
    },
    onDiatonicChordPlay: (payload) => {
      const chordKey = findKeyById(payload.chordKeyId);
      if (chordKey === undefined) {
        return;
      }
      if (payload.chordId !== null) {
        const chord = findChordById(payload.chordId);
        if (chord === undefined) {
          return;
        }
        void tonePlayer.playChord(chordKey, chord);
        return;
      }
      if (payload.playbackSemitones.length > 0) {
        void tonePlayer.playChordSemitonesFromRoot(
          chordKey,
          payload.playbackSemitones,
        );
      }
    },
    onVolumeChange: (volume) => {
      settings = { ...settings, volume };
      tonePlayer.setVolume(volume);
      saveSettings(settings);
    },
    onInstrumentChange: (instrumentId) => {
      saveSettings({ ...settings, instrumentId });
      refresh({ instrumentId });
    },
  });
}

applySanitizedMusicIds();
refresh();
saveSettings(settings);
