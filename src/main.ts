import './styles/main.css';
import { tonePlayer } from './audio/tone-player';
import { loadSettings, saveSettings } from './app/storage';
import type { AppSettings } from './app/storage';
import { renderApp } from './ui/app-shell';

const appRootEl = document.querySelector('#app');
if (!(appRootEl instanceof HTMLDivElement)) {
  throw new Error('#app not found');
}
const appRoot = appRootEl;

let settings = loadSettings();
tonePlayer.setVolume(settings.volume);

function refresh(partial?: Partial<AppSettings>): void {
  if (partial) {
    settings = { ...settings, ...partial };
  }
  if (partial?.volume !== undefined) {
    tonePlayer.setVolume(settings.volume);
  }
  renderApp(appRoot, settings, {
    onViewModeChange: (viewMode) => {
      saveSettings({ ...settings, viewMode });
      refresh({ viewMode });
    },
    onLabelModeChange: (labelMode) => {
      saveSettings({ ...settings, labelMode });
      refresh({ labelMode });
    },
    onScaleKeyChange: (scaleKeyId) => {
      saveSettings({ ...settings, scaleKeyId });
      refresh({ scaleKeyId });
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
    onVolumeChange: (volume) => {
      settings = { ...settings, volume };
      tonePlayer.setVolume(volume);
      saveSettings(settings);
    },
  });
}

refresh();
saveSettings(settings);
