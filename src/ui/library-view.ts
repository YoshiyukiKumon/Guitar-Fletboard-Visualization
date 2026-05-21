import type { ChordDef } from '../domain/data/chords';
import type { ScaleDef } from '../domain/data/scales';
import {
  applyCustomLibraryImport,
  exportLibraryCsv,
  parseLibraryCsv,
} from '../domain/music-library/csv';
import {
  deleteCustomChord,
  deleteCustomScale,
  duplicateChordAsCustom,
  duplicateScaleAsCustom,
  resetLibraryToInitial,
  upsertCustomChord,
  upsertCustomScale,
} from '../domain/music-library/custom-crud';
import {
  displayChordName,
  displayScaleName,
  listChords,
  listScales,
} from '../domain/music-library/registry';
import { saveCustomLibrary } from '../domain/music-library/storage';
import { getToneLabelOptions } from '../domain/music-library/tone-label-options';
import { createSegmentSwitcher } from './segment-switcher';

export type LibraryTab = 'scale' | 'chord';

export interface LibraryViewState {
  tab: LibraryTab;
  selectedScaleId: string | null;
  selectedChordId: string | null;
  draftScale?: ScaleDef | null;
  draftChord?: ChordDef | null;
}

export interface LibraryViewCallbacks {
  onStateChange: (state: LibraryViewState) => void;
  onLibraryChanged: () => void;
}

export function createLibraryView(
  state: LibraryViewState,
  callbacks: LibraryViewCallbacks,
): HTMLElement {
  const root = document.createElement('section');
  root.className = 'library-view';
  root.setAttribute('aria-label', 'スケール・コードライブラリ');

  const tabBar = createSegmentSwitcher({
    className: 'segment-switcher library-view__tabs',
    ariaLabel: 'ライブラリの種類',
    modes: ['scale', 'chord'] as const,
    labels: { scale: 'スケール', chord: 'コード' },
    active: state.tab,
    onChange: (tab) => {
      callbacks.onStateChange({ ...state, tab });
    },
  });
  root.appendChild(tabBar);

  const body = document.createElement('div');
  body.className = 'library-view__body';
  root.appendChild(body);

  const toolbar = document.createElement('div');
  toolbar.className = 'library-view__toolbar';
  root.appendChild(toolbar);

  if (state.tab === 'scale') {
    renderScalePanel(body, state, callbacks);
  } else {
    renderChordPanel(body, state, callbacks);
  }

  renderToolbar(toolbar, callbacks);

  return root;
}

function renderScalePanel(
  body: HTMLElement,
  state: LibraryViewState,
  callbacks: LibraryViewCallbacks,
): void {
  const items = listScales();
  const selectedId =
    state.selectedScaleId === '__new__'
      ? '__new__'
      : (state.selectedScaleId ?? items[0]?.def.id ?? null);
  const selected =
    selectedId === '__new__'
      ? undefined
      : items.find((i) => i.def.id === selectedId) ?? items[0];

  body.appendChild(
    createListEditor({
      items: items.map((item) => ({
        id: item.def.id,
        label: displayScaleName(item.def, item.source),
        badge: item.source === 'builtin' ? '組み込み' : null,
      })),
      selectedId: selected?.def.id ?? null,
      onSelect: (id) => {
        callbacks.onStateChange({ ...state, selectedScaleId: id });
      },
      onAdd: () => {
        callbacks.onStateChange({
          ...state,
          selectedScaleId: '__new__',
          draftScale: null,
        });
      },
      renderForm: () => {
        if (!selected && state.selectedScaleId !== '__new__') {
          return createMessage('スケールを選択するか、新規追加してください');
        }
        const isNew = state.selectedScaleId === '__new__';
        const def = isNew
          ? (state.draftScale ?? { id: '', name: '', tones: ['R'] })
          : selected!.def;
        const readonly = !isNew && selected!.source === 'builtin';
        return createScaleForm(def, readonly, isNew, callbacks, state);
      },
    }),
  );
}

function renderChordPanel(
  body: HTMLElement,
  state: LibraryViewState,
  callbacks: LibraryViewCallbacks,
): void {
  const items = listChords();
  const selectedId =
    state.selectedChordId === '__new__'
      ? '__new__'
      : (state.selectedChordId ?? items[0]?.def.id ?? null);
  const selected =
    selectedId === '__new__'
      ? undefined
      : items.find((i) => i.def.id === selectedId) ?? items[0];

  body.appendChild(
    createListEditor({
      items: items.map((item) => ({
        id: item.def.id,
        label: displayChordName(item.def, item.source),
        badge: item.source === 'builtin' ? '組み込み' : null,
      })),
      selectedId: selected?.def.id ?? null,
      onSelect: (id) => {
        callbacks.onStateChange({ ...state, selectedChordId: id });
      },
      onAdd: () => {
        callbacks.onStateChange({
          ...state,
          selectedChordId: '__new__',
          draftChord: null,
        });
      },
      renderForm: () => {
        if (!selected && state.selectedChordId !== '__new__') {
          return createMessage('コードを選択するか、新規追加してください');
        }
        const isNew = state.selectedChordId === '__new__';
        const def = isNew
          ? (state.draftChord ?? { id: '', name: '', tones: ['R', '3', '5'] })
          : selected!.def;
        const readonly = !isNew && selected!.source === 'builtin';
        return createChordForm(def, readonly, isNew, callbacks, state);
      },
    }),
  );
}

interface ListEditorConfig {
  items: { id: string; label: string; badge: string | null }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  renderForm: () => HTMLElement;
}

function createListEditor(config: ListEditorConfig): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'library-view__split';

  const listPane = document.createElement('div');
  listPane.className = 'library-view__list-pane';

  const list = document.createElement('ul');
  list.className = 'library-view__list';

  for (const item of config.items) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'library-view__list-btn';
    if (item.id === config.selectedId && config.selectedId !== '__new__') {
      btn.classList.add('library-view__list-btn--active');
    }
    btn.textContent = item.label;
    if (item.badge) {
      const badge = document.createElement('span');
      badge.className = 'library-view__badge';
      badge.textContent = item.badge;
      btn.appendChild(badge);
    }
    btn.addEventListener('click', () => config.onSelect(item.id));
    li.appendChild(btn);
    list.appendChild(li);
  }

  listPane.appendChild(list);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'library-view__add-btn';
  addBtn.textContent = '+ 新規追加';
  addBtn.addEventListener('click', config.onAdd);
  listPane.appendChild(addBtn);

  const formPane = document.createElement('div');
  formPane.className = 'library-view__form-pane';
  formPane.appendChild(config.renderForm());

  wrap.appendChild(listPane);
  wrap.appendChild(formPane);
  return wrap;
}

function createScaleForm(
  def: ScaleDef,
  readonly: boolean,
  isNew: boolean,
  callbacks: LibraryViewCallbacks,
  state: LibraryViewState,
): HTMLElement {
  return createDefForm({
    kind: 'scale',
    def,
    readonly,
    isNew,
    onSave: (next) => {
      const result = upsertCustomScale(next);
      if (!result.ok) {
        return result.errors;
      }
      callbacks.onLibraryChanged();
      callbacks.onStateChange({
        ...state,
        selectedScaleId: result.id ?? next.id,
        draftScale: null,
      });
      return [];
    },
    onDelete: () => {
      deleteCustomScale(def.id);
      callbacks.onLibraryChanged();
      callbacks.onStateChange({
        ...state,
        selectedScaleId: null,
        draftScale: null,
      });
    },
    onDuplicate: readonly
      ? () => {
          const copy = duplicateScaleAsCustom(def.id);
          if (copy) {
            callbacks.onStateChange({
              ...state,
              selectedScaleId: '__new__',
              draftScale: copy,
            });
          }
        }
      : undefined,
  });
}

function createChordForm(
  def: ChordDef,
  readonly: boolean,
  isNew: boolean,
  callbacks: LibraryViewCallbacks,
  state: LibraryViewState,
): HTMLElement {
  return createDefForm({
    kind: 'chord',
    def,
    readonly,
    isNew,
    onSave: (next) => {
      const result = upsertCustomChord(next);
      if (!result.ok) {
        return result.errors;
      }
      callbacks.onLibraryChanged();
      callbacks.onStateChange({
        ...state,
        selectedChordId: result.id ?? next.id,
        draftChord: null,
      });
      return [];
    },
    onDelete: () => {
      deleteCustomChord(def.id);
      callbacks.onLibraryChanged();
      callbacks.onStateChange({
        ...state,
        selectedChordId: null,
        draftChord: null,
      });
    },
    onDuplicate: readonly
      ? () => {
          const copy = duplicateChordAsCustom(def.id);
          if (copy) {
            callbacks.onStateChange({
              ...state,
              selectedChordId: '__new__',
              draftChord: copy,
            });
          }
        }
      : undefined,
  });
}

interface DefFormConfig {
  kind: 'scale' | 'chord';
  def: ScaleDef | ChordDef;
  readonly: boolean;
  isNew: boolean;
  onSave: (def: ScaleDef | ChordDef) => string[];
  onDelete: () => void;
  onDuplicate?: () => void;
}

function createTonePicker(
  initialTones: readonly string[],
  readonly: boolean,
): { element: HTMLElement; getTones: () => string[] } {
  const masterOptions = getToneLabelOptions();
  const tones = initialTones.length > 0 ? [...initialTones] : ['R'];

  const wrap = document.createElement('div');
  wrap.className = 'library-view__tones';

  function optionsForRow(current: string): string[] {
    if (masterOptions.includes(current)) {
      return [...masterOptions];
    }
    return [current, ...masterOptions];
  }

  function render(): void {
    wrap.replaceChildren();
    if (readonly) {
      const list = document.createElement('ul');
      list.className = 'library-view__tone-readonly';
      for (const tone of tones) {
        const li = document.createElement('li');
        li.textContent = tone;
        list.appendChild(li);
      }
      wrap.appendChild(list);
      return;
    }

    tones.forEach((tone, index) => {
      const row = document.createElement('div');
      row.className = 'library-view__tone-row';

      const select = document.createElement('select');
      select.className = 'library-view__input library-view__tone-select';
      for (const opt of optionsForRow(tone)) {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        option.selected = opt === tone;
        select.appendChild(option);
      }
      select.addEventListener('change', () => {
        tones[index] = select.value;
      });
      row.appendChild(select);

      if (tones.length > 1) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'library-view__tone-remove';
        removeBtn.textContent = '削除';
        removeBtn.setAttribute('aria-label', 'この構成音を削除');
        removeBtn.addEventListener('click', () => {
          tones.splice(index, 1);
          render();
        });
        row.appendChild(removeBtn);
      }

      wrap.appendChild(row);
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'library-view__add-tone-btn';
    addBtn.textContent = '+ 構成音を追加';
    addBtn.addEventListener('click', () => {
      tones.push(masterOptions[0] ?? 'R');
      render();
    });
    wrap.appendChild(addBtn);
  }

  render();
  return {
    element: wrap,
    getTones: () => [...tones],
  };
}

function createDefForm(config: DefFormConfig): HTMLElement {
  const form = document.createElement('div');
  form.className = 'library-view__form';

  const errorsEl = document.createElement('div');
  errorsEl.className = 'library-view__errors';
  errorsEl.hidden = true;

  const nameInput = document.createElement('input');
  nameInput.className = 'library-view__input';
  nameInput.value = config.def.name;
  nameInput.readOnly = config.readonly;

  const tonePicker = createTonePicker(config.def.tones, config.readonly);

  form.appendChild(createField('名前', nameInput));
  form.appendChild(createField('構成音', tonePicker.element));
  form.appendChild(errorsEl);

  const actions = document.createElement('div');
  actions.className = 'library-view__form-actions';

  if (!config.readonly) {
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'library-view__btn library-view__btn--primary';
    saveBtn.textContent = '保存';
    saveBtn.addEventListener('click', () => {
      const next = {
        id: config.isNew ? '' : config.def.id,
        name: nameInput.value.trim(),
        tones: tonePicker.getTones(),
      };
      const errors = config.onSave(next);
      if (errors.length > 0) {
        errorsEl.textContent = errors.join('\n');
        errorsEl.hidden = false;
      } else {
        errorsEl.hidden = true;
      }
    });
    actions.appendChild(saveBtn);

    if (!config.isNew) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'library-view__btn library-view__btn--danger';
      delBtn.textContent = '削除';
      delBtn.addEventListener('click', () => {
        if (window.confirm(`「${config.def.name}」を削除しますか？`)) {
          config.onDelete();
        }
      });
      actions.appendChild(delBtn);
    }
  }

  if (config.onDuplicate) {
    const dupBtn = document.createElement('button');
    dupBtn.type = 'button';
    dupBtn.className = 'library-view__btn';
    dupBtn.textContent = '複製してカスタム追加';
    dupBtn.addEventListener('click', () => {
      config.onDuplicate?.();
    });
    actions.appendChild(dupBtn);
  }

  form.appendChild(actions);
  return form;
}

function createField(label: string, control: HTMLElement): HTMLElement {
  const field = document.createElement('label');
  field.className = 'library-view__field';
  const span = document.createElement('span');
  span.className = 'library-view__field-label';
  span.textContent = label;
  field.appendChild(span);
  field.appendChild(control);
  return field;
}

function createMessage(text: string): HTMLElement {
  const p = document.createElement('p');
  p.className = 'library-view__message';
  p.textContent = text;
  return p;
}

function renderToolbar(
  toolbar: HTMLElement,
  callbacks: LibraryViewCallbacks,
): void {
  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.className = 'library-view__btn';
  downloadBtn.textContent = 'CSVダウンロード';
  downloadBtn.addEventListener('click', () => {
    const csv = exportLibraryCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guitar-practice-library.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  const uploadLabel = document.createElement('label');
  uploadLabel.className = 'library-view__btn library-view__btn--upload';
  uploadLabel.textContent = 'CSVアップロード';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.csv,text/csv';
  fileInput.hidden = true;
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) {
      return;
    }
    const text = await file.text();
    const preview = parseLibraryCsv(text);
    if (preview.errors.length > 0) {
      window.alert(
        `CSV の読み込みエラー:\n${preview.errors.slice(0, 8).join('\n')}`,
      );
      return;
    }
    const msg = `カスタム定義を置き換えます。\nスケール ${preview.scales.length} 件\nコード ${preview.chords.length} 件\nよろしいですか？`;
    if (!window.confirm(msg)) {
      return;
    }
    saveCustomLibrary(applyCustomLibraryImport(preview));
    callbacks.onLibraryChanged();
  });
  uploadLabel.appendChild(fileInput);

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'library-view__btn library-view__btn--danger';
  resetBtn.textContent = '初期状態にリセット';
  resetBtn.addEventListener('click', () => {
    if (
      !window.confirm(
        'カスタムのスケール・コードをすべて削除します。よろしいですか？',
      )
    ) {
      return;
    }
    if (!window.confirm('この操作は取り消せません。本当に実行しますか？')) {
      return;
    }
    resetLibraryToInitial();
    callbacks.onLibraryChanged();
  });

  toolbar.appendChild(downloadBtn);
  toolbar.appendChild(uploadLabel);
  toolbar.appendChild(resetBtn);
}
