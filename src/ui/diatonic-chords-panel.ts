import { diatonicRepeatButtonId, tonePlayer, type PlaybackButtonId } from '../audio/tone-player';
import {
  computeDiatonicChords,
  type DiatonicChordEntry,
  type DiatonicChordPlayPayload,
} from '../domain/diatonic-chords';
import type { FretboardModel } from '../domain/fretboard';
import { t } from '../i18n';

export interface DiatonicChordsPanelOptions {
  chordKeyId: string;
  chordId: string;
  onApply: (chordKeyId: string, chordId: string) => void;
  onPlay: (payload: DiatonicChordPlayPayload) => void;
  onRepeatPlay: (payload: DiatonicChordPlayPayload) => void;
}

export function createDiatonicChordsPanel(
  model: FretboardModel,
  options: DiatonicChordsPanelOptions,
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'diatonic-chords';
  section.setAttribute('aria-label', t('diatonic.ariaLabel'));

  const title = document.createElement('h2');
  title.className = 'diatonic-chords__title';
  title.textContent = t('diatonic.title');
  section.appendChild(title);

  const result = computeDiatonicChords(model.scaleKey, model.scale);

  if (!result.supported) {
    const message = document.createElement('p');
    message.className = 'diatonic-chords__message';
    message.textContent = t('diatonic.unsupported');
    section.appendChild(message);
    return section;
  }

  const scroll = document.createElement('div');
  scroll.className = 'diatonic-chords__scroll';

  const grid = document.createElement('div');
  grid.className = 'diatonic-chords__grid';
  grid.style.setProperty('--diatonic-cols', String(result.entries.length));

  const repeatButtons: HTMLButtonElement[] = [];

  for (const entry of result.entries) {
    const { cell, repeatBtn } = createCell(entry, options);
    repeatButtons.push(repeatBtn);
    grid.appendChild(cell);
  }

  const syncRepeatButtons = (): void => {
    for (const btn of repeatButtons) {
      const buttonId = btn.dataset.playbackButtonId as PlaybackButtonId | undefined;
      const isActive =
        buttonId !== undefined && tonePlayer.isPlaybackActive(buttonId);
      const chordName = btn.dataset.chordName ?? t('diatonic.title');
      btn.textContent = isActive ? '■' : '∞';
      btn.setAttribute(
        'aria-label',
        isActive
          ? t('diatonic.aria.repeatStop')
          : t('diatonic.aria.repeat', { name: chordName }),
      );
      btn.classList.toggle('diatonic-chords__btn--active', isActive);
    }
  };

  tonePlayer.subscribePlayback(syncRepeatButtons);
  syncRepeatButtons();

  scroll.appendChild(grid);
  section.appendChild(scroll);
  return section;
}

function createCell(
  entry: DiatonicChordEntry,
  options: DiatonicChordsPanelOptions,
): { cell: HTMLElement; repeatBtn: HTMLButtonElement } {
  const cell = document.createElement('div');
  cell.className = 'diatonic-chords__cell';
  const selectable = entry.chordId !== null;
  const canPlay = entry.playbackSemitones.length > 0;
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

  const repeatBtn = document.createElement('button');
  repeatBtn.type = 'button';
  repeatBtn.className = 'diatonic-chords__btn diatonic-chords__btn--repeat';
  repeatBtn.textContent = '∞';
  repeatBtn.disabled = !canPlay;
  repeatBtn.dataset.chordName = entry.displayName;
  repeatBtn.dataset.playbackButtonId = diatonicRepeatButtonId(entry.degree);
  repeatBtn.setAttribute(
    'aria-label',
    canPlay
      ? t('diatonic.aria.repeat', { name: entry.displayName })
      : t('diatonic.aria.repeatDisabled', { name: entry.displayName }),
  );
  if (canPlay) {
    const repeatButtonId = diatonicRepeatButtonId(entry.degree);
    repeatBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (tonePlayer.isPlaybackActive(repeatButtonId)) {
        tonePlayer.stopRepeat();
        return;
      }
      options.onRepeatPlay({
        degree: entry.degree,
        chordKeyId: entry.chordKeyId,
        chordId: entry.chordId,
        playbackSemitones: entry.playbackSemitones,
      });
    });
  }

  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.className = 'diatonic-chords__btn diatonic-chords__btn--apply';
  applyBtn.textContent = t('diatonic.apply');
  applyBtn.disabled = !selectable;
  applyBtn.setAttribute(
    'aria-label',
    selectable
      ? t('diatonic.aria.apply', { name: entry.displayName })
      : t('diatonic.aria.applyDisabled', { name: entry.displayName }),
  );
  if (selectable && entry.chordId !== null) {
    applyBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      options.onApply(entry.chordKeyId, entry.chordId as string);
    });
  }

  actions.appendChild(playIcon);
  actions.appendChild(repeatBtn);
  actions.appendChild(applyBtn);

  if (canPlay) {
    cell.classList.add('diatonic-chords__cell--playable');
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute(
      'aria-label',
      t('diatonic.aria.play', { name: entry.displayName }),
    );
    cell.addEventListener('click', (event) => {
      if (
        (event.target as HTMLElement).closest('.diatonic-chords__btn--apply')
      ) {
        return;
      }
      if (
        (event.target as HTMLElement).closest('.diatonic-chords__btn--repeat')
      ) {
        return;
      }
      options.onPlay({
        degree: entry.degree,
        chordKeyId: entry.chordKeyId,
        chordId: entry.chordId,
        playbackSemitones: entry.playbackSemitones,
      });
    });
    cell.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      options.onPlay({
        degree: entry.degree,
        chordKeyId: entry.chordKeyId,
        chordId: entry.chordId,
        playbackSemitones: entry.playbackSemitones,
      });
    });
  }

  cell.appendChild(labels);
  cell.appendChild(actions);
  return { cell, repeatBtn };
}
