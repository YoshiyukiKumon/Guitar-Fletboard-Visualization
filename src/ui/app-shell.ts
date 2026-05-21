import { buildFretboard } from '../domain/fretboard';
import { resolveMusicSelection } from '../domain/resolve-music-selection';
import {
  FRETBOARD_VIEW_MODES,
  type FretboardViewMode,
  VIEW_MODE_LABELS,
} from '../domain/fretboard-view-mode';
import {
  LABEL_DISPLAY_MODES,
  type LabelDisplayMode,
  LABEL_MODE_LABELS,
} from '../domain/label-display-mode';
import type { AppMode, AppSettings } from '../app/storage';
import { tonePlayer } from '../audio/tone-player';
import type { FretboardModel } from '../domain/fretboard';
import {
  formatChordName,
  formatScaleChordSummary,
  formatScaleName,
  noteNamesFromTones,
} from '../domain/tone-sequence';
import {
  createLibraryView,
  type LibraryViewCallbacks,
  type LibraryViewState,
} from './library-view';
import { createMusicSelectors } from './music-selectors';
import { createSegmentSwitcher } from './segment-switcher';
import { createVolumeControl } from './volume-control';
import { renderFretboard } from './fretboard-view';

const APP_MODES = ['practice', 'library'] as const;
const APP_MODE_LABELS: Record<(typeof APP_MODES)[number], string> = {
  practice: '練習',
  library: 'ライブラリ',
};

export interface AppRenderOptions {
  onAppModeChange: (mode: AppMode) => void;
  onViewModeChange: (mode: FretboardViewMode) => void;
  onLabelModeChange: (mode: LabelDisplayMode) => void;
  onScaleKeyChange: (keyId: string) => void;
  onScaleChange: (scaleId: string) => void;
  onChordKeyChange: (keyId: string) => void;
  onChordChange: (chordId: string) => void;
  onVolumeChange: (volume: number) => void;
  libraryState: LibraryViewState;
  onLibraryStateChange: (state: LibraryViewState) => void;
  onLibraryChanged: () => void;
}

export function renderApp(
  root: HTMLElement,
  settings: AppSettings,
  options: AppRenderOptions,
): void {
  const music = resolveMusicSelection(settings);
  const model = buildFretboard(
    music.scaleKey,
    music.scale,
    music.chordKey,
    music.chord,
  );

  root.replaceChildren();

  const header = document.createElement('header');
  header.className = 'app-header';
  const title = document.createElement('h1');
  title.className = 'app-header__title';
  title.textContent = 'ギター練習ツール';
  header.appendChild(title);
  header.appendChild(
    createSegmentSwitcher({
      className: 'segment-switcher app-header__mode',
      ariaLabel: 'アプリモード',
      modes: APP_MODES,
      labels: APP_MODE_LABELS,
      active: settings.appMode,
      onChange: options.onAppModeChange,
    }),
  );
  root.appendChild(header);

  if (settings.appMode === 'library') {
    const libraryCallbacks: LibraryViewCallbacks = {
      onStateChange: options.onLibraryStateChange,
      onLibraryChanged: options.onLibraryChanged,
    };
    root.appendChild(createLibraryView(options.libraryState, libraryCallbacks));
    return;
  }

  root.appendChild(
    createMusicSelectors(
      {
        scaleKeyId: settings.scaleKeyId,
        scaleId: settings.scaleId,
        chordKeyId: settings.chordKeyId,
        chordId: settings.chordId,
      },
      {
        onScaleKeyChange: options.onScaleKeyChange,
        onScaleChange: options.onScaleChange,
        onChordKeyChange: options.onChordKeyChange,
        onChordChange: options.onChordChange,
      },
    ),
  );

  const controls = document.createElement('div');
  controls.className = 'app-controls';
  controls.appendChild(
    createViewSwitcher(settings.viewMode, options.onViewModeChange),
  );

  const toolsRow = document.createElement('div');
  toolsRow.className = 'app-controls__tools';
  toolsRow.appendChild(
    createLabelModeSwitcher(settings.labelMode, options.onLabelModeChange),
  );
  toolsRow.appendChild(
    createVolumeControl(settings.volume, options.onVolumeChange),
  );
  controls.appendChild(toolsRow);
  root.appendChild(controls);

  root.appendChild(createLegend(settings.viewMode));
  root.appendChild(renderFretboard(model, settings.viewMode, settings.labelMode));

  root.appendChild(createTonePanel(model));
}

function createTonePanel(model: FretboardModel): HTMLElement {
  const tones = document.createElement('aside');
  tones.className = 'tone-panel';

  const summary = document.createElement('p');
  summary.className = 'tone-panel__summary';
  summary.textContent = formatScaleChordSummary(
    model.scaleKey,
    model.scale,
    model.chordKey,
    model.chord,
  );
  tones.appendChild(summary);

  const scaleBlock = document.createElement('div');
  scaleBlock.className = 'tone-panel__block';
  scaleBlock.appendChild(
    createToneBlockHeader(
      formatScaleName(model.scaleKey, model.scale),
      'スケールを順番に再生（1オクターブ）',
      () => tonePlayer.playScale(model.scaleKey, model.scale),
    ),
  );
  scaleBlock.appendChild(
    createToneLines(
      model.scale.tones.join(' · '),
      noteNamesFromTones(model.scaleKey, model.scale.tones, model.scaleKey),
    ),
  );
  tones.appendChild(scaleBlock);

  const chordBlock = document.createElement('div');
  chordBlock.className = 'tone-panel__block';
  chordBlock.appendChild(
    createChordToneBlockHeader(
      formatChordName(model.chordKey, model.chord, model.scaleKey),
      () => tonePlayer.playChord(model.chordKey, model.chord),
      () => tonePlayer.playChordArpeggio(model.chordKey, model.chord),
    ),
  );
  chordBlock.appendChild(
    createToneLines(
      model.chord.tones.join(' · '),
      noteNamesFromTones(model.chordKey, model.chord.tones, model.scaleKey),
    ),
  );
  tones.appendChild(chordBlock);

  return tones;
}

function createToneLines(
  intervalLine: string,
  noteNameLine: string,
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'tone-panel__lines';

  const intervals = document.createElement('p');
  intervals.className = 'tone-panel__tones';
  intervals.textContent = intervalLine;

  const noteNames = document.createElement('p');
  noteNames.className = 'tone-panel__note-names';
  noteNames.textContent = noteNameLine;

  wrap.appendChild(intervals);
  wrap.appendChild(noteNames);
  return wrap;
}

function createChordToneBlockHeader(
  title: string,
  onBlockPlay: () => void,
  onArpeggioPlay: () => void,
): HTMLElement {
  const head = document.createElement('div');
  head.className = 'tone-panel__head tone-panel__head--chord';

  const heading = document.createElement('h2');
  heading.className = 'tone-panel__heading';
  heading.textContent = title;

  const actions = document.createElement('div');
  actions.className = 'tone-panel__head-actions';
  actions.appendChild(
    createTonePlayButton(
      '▶ 同時',
      'コードトーンを同時に再生',
      onBlockPlay,
    ),
  );
  actions.appendChild(
    createTonePlayButton(
      '▶ アルペジオ',
      'コードトーンをルートから順に再生（アルペジオ）',
      onArpeggioPlay,
    ),
  );

  head.appendChild(heading);
  head.appendChild(actions);
  return head;
}

function createTonePlayButton(
  label: string,
  ariaLabel: string,
  onPlay: () => void,
): HTMLButtonElement {
  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.className = 'tone-panel__play';
  playBtn.setAttribute('aria-label', ariaLabel);
  playBtn.textContent = label;
  playBtn.addEventListener('click', () => {
    void onPlay();
  });
  return playBtn;
}

function createToneBlockHeader(
  title: string,
  playLabel: string,
  onPlay: () => void,
): HTMLElement {
  const head = document.createElement('div');
  head.className = 'tone-panel__head';

  const heading = document.createElement('h2');
  heading.className = 'tone-panel__heading';
  heading.textContent = title;

  head.appendChild(heading);
  head.appendChild(
    createTonePlayButton('▶ 再生', playLabel, onPlay),
  );
  return head;
}

function createViewSwitcher(
  activeMode: FretboardViewMode,
  onChange: (mode: FretboardViewMode) => void,
): HTMLElement {
  const nav = createSegmentSwitcher({
    className: 'segment-switcher view-switcher',
    ariaLabel: '指板表示モード',
    modes: FRETBOARD_VIEW_MODES,
    labels: VIEW_MODE_LABELS,
    active: activeMode,
    onChange,
  });

  const title = document.createElement('span');
  title.className = 'view-switcher__title';
  title.textContent = '表示';
  nav.prepend(title);
  return nav;
}

function createLabelModeSwitcher(
  activeMode: LabelDisplayMode,
  onChange: (mode: LabelDisplayMode) => void,
): HTMLElement {
  return createSegmentSwitcher({
    className: 'segment-switcher label-switcher',
    ariaLabel: 'ラベル表示',
    modes: LABEL_DISPLAY_MODES,
    labels: LABEL_MODE_LABELS,
    active: activeMode,
    onChange,
  });
}

function createLegend(viewMode: FretboardViewMode): HTMLElement {
  const legend = document.createElement('div');
  legend.className = 'legend';

  if (
    viewMode === 'fretboard' ||
    viewMode === 'scale' ||
    viewMode === 'composite'
  ) {
    const scaleItem = document.createElement('span');
    scaleItem.className = 'legend__item';
    const scaleLabel =
      viewMode === 'fretboard' ? 'ルート以外' : 'スケール音';
    scaleItem.innerHTML = `<span class="legend__capsule legend__capsule--scale">2 / 9</span>${scaleLabel}`;
    legend.appendChild(scaleItem);
  }

  if (viewMode === 'chord' || viewMode === 'composite') {
    const chordItem = document.createElement('span');
    chordItem.className = 'legend__item';
    chordItem.innerHTML =
      '<span class="legend__capsule legend__capsule--chord">3</span>コードトーン';
    legend.appendChild(chordItem);
  }

  if (
    viewMode === 'fretboard' ||
    viewMode === 'scale' ||
    viewMode === 'composite'
  ) {
    const scaleRootItem = document.createElement('span');
    scaleRootItem.className = 'legend__item';
    scaleRootItem.innerHTML =
      '<span class="legend__capsule legend__capsule--scale-root">R</span>スケールルート';
    legend.appendChild(scaleRootItem);
  }

  if (viewMode === 'chord' || viewMode === 'composite') {
    const chordRootItem = document.createElement('span');
    chordRootItem.className = 'legend__item';
    chordRootItem.innerHTML =
      '<span class="legend__capsule legend__capsule--chord-root">R</span>コードルート';
    legend.appendChild(chordRootItem);
  }

  if (viewMode !== 'fretboard') {
    const mutedItem = document.createElement('span');
    mutedItem.className = 'legend__item';
    mutedItem.innerHTML =
      '<span class="legend__capsule legend__capsule--muted" aria-hidden="true">—</span>その他';
    legend.appendChild(mutedItem);
  }

  return legend;
}
