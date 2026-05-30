import { chordRootOptionsForScaleKey } from '../domain/chord-root-options';
import { KEYS, findKeyById } from '../domain/data/keys';
import {
  displayChordName,
  displayScaleName,
  listChords,
  listScales,
} from '../domain/music-library/registry';
import { t } from '../i18n';

export interface MusicSelectorValues {
  scaleKeyId: string;
  scaleId: string;
  chordKeyId: string;
  chordId: string;
}

export interface MusicSelectorCallbacks {
  onScaleKeyChange: (keyId: string) => void;
  onScaleChange: (scaleId: string) => void;
  onChordKeyChange: (keyId: string) => void;
  onChordChange: (chordId: string) => void;
}

export function createMusicSelectors(
  values: MusicSelectorValues,
  callbacks: MusicSelectorCallbacks,
): HTMLElement {
  const scaleKey = findKeyById(values.scaleKeyId) ?? KEYS[0];
  const chordRootOptions = chordRootOptionsForScaleKey(scaleKey);
  const scaleOptions = listScales().map(({ def, source }) => ({
    id: def.id,
    name: displayScaleName(def, source),
  }));
  const chordOptions = listChords().map(({ def, source }) => ({
    id: def.id,
    name: displayChordName(def, source),
  }));

  const section = document.createElement('section');
  section.className = 'music-selectors';
  section.setAttribute('aria-label', t('selectors.ariaLabel'));

  const scaleRow = document.createElement('div');
  scaleRow.className = 'music-selectors__row';
  scaleRow.appendChild(
    createSelectField({
      id: 'scale-key-select',
      label: t('selectors.scaleRoot'),
      items: KEYS,
      value: values.scaleKeyId,
      onChange: callbacks.onScaleKeyChange,
    }),
  );
  scaleRow.appendChild(
    createSelectField({
      id: 'scale-select',
      label: t('selectors.scale'),
      items: scaleOptions,
      value: values.scaleId,
      onChange: callbacks.onScaleChange,
    }),
  );
  section.appendChild(scaleRow);

  const chordRow = document.createElement('div');
  chordRow.className = 'music-selectors__row';
  chordRow.appendChild(
    createSelectField({
      id: 'chord-key-select',
      label: t('selectors.chordRoot'),
      items: chordRootOptions,
      value: values.chordKeyId,
      onChange: callbacks.onChordKeyChange,
    }),
  );
  chordRow.appendChild(
    createSelectField({
      id: 'chord-select',
      label: t('selectors.chord'),
      items: chordOptions,
      value: values.chordId,
      onChange: callbacks.onChordChange,
    }),
  );
  section.appendChild(chordRow);

  return section;
}

function createSelectField<T extends { id: string; name: string }>(config: {
  id: string;
  label: string;
  items: readonly T[];
  value: string;
  onChange: (id: string) => void;
}): HTMLElement {
  const field = document.createElement('div');
  field.className = 'music-selectors__field';

  const label = document.createElement('label');
  label.className = 'music-selectors__label';
  label.htmlFor = config.id;
  label.textContent = config.label;

  const select = document.createElement('select');
  select.id = config.id;
  select.className = 'music-selectors__select';

  for (const item of config.items) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    if (item.id === config.value) {
      option.selected = true;
    }
    select.appendChild(option);
  }

  select.addEventListener('change', () => {
    if (select.value !== config.value) {
      config.onChange(select.value);
    }
  });

  field.appendChild(label);
  field.appendChild(select);
  return field;
}
