import {
  computeDiatonicChords,
  type DiatonicChordEntry,
  type DiatonicChordPlayPayload,
} from '../domain/diatonic-chords';
import type { FretboardModel } from '../domain/fretboard';

export interface DiatonicChordsPanelOptions {
  chordKeyId: string;
  chordId: string;
  onApply: (chordKeyId: string, chordId: string) => void;
  onPlay: (payload: DiatonicChordPlayPayload) => void;
}

export function createDiatonicChordsPanel(
  model: FretboardModel,
  options: DiatonicChordsPanelOptions,
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'diatonic-chords';
  section.setAttribute('aria-label', 'ダイアトニックコード');

  const title = document.createElement('h2');
  title.className = 'diatonic-chords__title';
  title.textContent = 'ダイアトニックコード';
  section.appendChild(title);

  const result = computeDiatonicChords(model.scaleKey, model.scale);

  if (!result.supported) {
    const message = document.createElement('p');
    message.className = 'diatonic-chords__message';
    message.textContent =
      'このスケールではダイアトニックコード（四和音）を表示できません。';
    section.appendChild(message);
    return section;
  }

  const scroll = document.createElement('div');
  scroll.className = 'diatonic-chords__scroll';

  const grid = document.createElement('div');
  grid.className = 'diatonic-chords__grid';
  grid.style.setProperty('--diatonic-cols', String(result.entries.length));

  for (const entry of result.entries) {
    grid.appendChild(createCell(entry, options));
  }

  scroll.appendChild(grid);
  section.appendChild(scroll);
  return section;
}

function createCell(
  entry: DiatonicChordEntry,
  options: DiatonicChordsPanelOptions,
): HTMLElement {
  const cell = document.createElement('div');
  cell.className = 'diatonic-chords__cell';
  const selectable = entry.chordId !== null;
  if (!selectable) {
    cell.classList.add('diatonic-chords__cell--unmapped');
  }
  if (
    selectable &&
    entry.chordKeyId === options.chordKeyId &&
    entry.chordId === options.chordId
  ) {
    cell.classList.add('diatonic-chords__cell--active');
  }

  const labels = document.createElement('div');
  labels.className = 'diatonic-chords__labels';

  const relative = document.createElement('span');
  relative.className = 'diatonic-chords__relative';
  relative.textContent = entry.relativeLabel;

  const actual = document.createElement('span');
  actual.className = 'diatonic-chords__actual';
  actual.textContent = entry.displayName;

  labels.appendChild(relative);
  labels.appendChild(actual);

  const actions = document.createElement('div');
  actions.className = 'diatonic-chords__actions';

  const playIcon = document.createElement('span');
  playIcon.className = 'diatonic-chords__btn diatonic-chords__btn--play';
  playIcon.textContent = '▶';
  playIcon.setAttribute('aria-hidden', 'true');

  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.className = 'diatonic-chords__btn diatonic-chords__btn--apply';
  applyBtn.textContent = '選択';
  applyBtn.disabled = !selectable;
  applyBtn.setAttribute(
    'aria-label',
    selectable
      ? `${entry.displayName} をコードルート・コードに反映`
      : `${entry.displayName} は選択未対応`,
  );
  if (selectable && entry.chordId !== null) {
    applyBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      options.onApply(entry.chordKeyId, entry.chordId as string);
    });
  }

  actions.appendChild(playIcon);
  actions.appendChild(applyBtn);

  cell.classList.add('diatonic-chords__cell--playable');
  cell.setAttribute('role', 'button');
  cell.setAttribute('tabindex', '0');
  cell.setAttribute('aria-label', `${entry.displayName} を同時再生`);
  cell.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('.diatonic-chords__btn--apply')) {
      return;
    }
    options.onPlay({
      chordKeyId: entry.chordKeyId,
      chordId: entry.chordId,
      playbackSemitones: entry.playbackSemitones,
    });
  });
  cell.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    if ((event.target as HTMLElement).closest('.diatonic-chords__btn--apply')) {
      return;
    }
    event.preventDefault();
    options.onPlay({
      chordKeyId: entry.chordKeyId,
      chordId: entry.chordId,
      playbackSemitones: entry.playbackSemitones,
    });
  });

  cell.appendChild(labels);
  cell.appendChild(actions);

  return cell;
}
