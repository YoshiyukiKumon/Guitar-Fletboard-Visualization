import type { AppSettings } from '../app/storage';
import {
  INSTRUMENT_CATALOG,
  type InstrumentId,
} from '../domain/settings/instrument-catalog';
import { tonePlayer } from '../audio/tone-player';
import { createVolumeControl } from './volume-control';

export interface SettingsViewCallbacks {
  onInstrumentChange: (instrumentId: InstrumentId) => void;
  onVolumeChange: (volume: number) => void;
}

export interface SettingsSectionContext {
  settings: AppSettings;
  callbacks: SettingsViewCallbacks;
}

export interface SettingsSectionDefinition {
  id: string;
  title: string;
  render: (context: SettingsSectionContext) => HTMLElement;
}

function renderInstrumentSection(context: SettingsSectionContext): HTMLElement {
  const body = document.createElement('div');
  body.className = 'settings-section__body';

  const hint = document.createElement('p');
  hint.className = 'settings-section__hint';
  hint.textContent =
    '指板・構成音・ライブラリのプレビュー再生に使う音色です。';
  body.appendChild(hint);

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'settings-instrument-list';
  const legend = document.createElement('legend');
  legend.className = 'settings-section__legend';
  legend.textContent = '楽器';
  fieldset.appendChild(legend);

  for (const instrument of INSTRUMENT_CATALOG) {
    const row = document.createElement('div');
    row.className = 'settings-instrument-list__row';

    const label = document.createElement('label');
    label.className = 'settings-instrument-list__label';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'instrument-id';
    input.className = 'settings-instrument-list__radio';
    input.value = instrument.id;
    input.checked = context.settings.instrumentId === instrument.id;
    input.addEventListener('change', () => {
      if (input.checked) {
        context.callbacks.onInstrumentChange(instrument.id);
      }
    });

    const text = document.createElement('span');
    text.className = 'settings-instrument-list__text';
    text.textContent = instrument.label;
    if (instrument.kind === 'synth') {
      text.textContent += '（合成音）';
    }

    label.append(input, text);

    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'settings-instrument-list__preview';
    preview.textContent = '▶';
    preview.setAttribute('aria-label', `${instrument.label}を試聴`);
    preview.addEventListener('click', () => {
      void tonePlayer.previewInstrument(instrument.id);
    });

    row.append(label, preview);
    fieldset.appendChild(row);
  }

  body.appendChild(fieldset);
  return body;
}

function renderVolumeSection(context: SettingsSectionContext): HTMLElement {
  const body = document.createElement('div');
  body.className = 'settings-section__body';
  body.appendChild(
    createVolumeControl(context.settings.volume, context.callbacks.onVolumeChange),
  );
  return body;
}

/** 将来の設定項目はここに追加する */
export const SETTINGS_SECTIONS: readonly SettingsSectionDefinition[] = [
  {
    id: 'instrument',
    title: '再生音',
    render: renderInstrumentSection,
  },
  {
    id: 'volume',
    title: '音量',
    render: renderVolumeSection,
  },
];

export function createSettingsView(
  settings: AppSettings,
  callbacks: SettingsViewCallbacks,
): HTMLElement {
  const root = document.createElement('section');
  root.className = 'settings-view';
  root.setAttribute('aria-label', '設定');

  const intro = document.createElement('p');
  intro.className = 'settings-view__intro';
  intro.textContent = 'アプリ全体の動作に関する設定です。';
  root.appendChild(intro);

  const context: SettingsSectionContext = { settings, callbacks };

  for (const section of SETTINGS_SECTIONS) {
    const block = document.createElement('section');
    block.className = 'settings-section';
    block.dataset.settingsSection = section.id;

    const heading = document.createElement('h2');
    heading.className = 'settings-section__title';
    heading.textContent = section.title;
    block.appendChild(heading);
    block.appendChild(section.render(context));

    root.appendChild(block);
  }

  return root;
}
