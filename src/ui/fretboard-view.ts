import { tonePlayer } from '../audio/tone-player';
import type { FretCell, FretboardModel } from '../domain/fretboard';
import { MAX_FRET } from '../domain/data/fretboard-matrix';
import { inlayDotCount } from '../domain/fret-inlays';
import {
  displayLabelForCell,
  type LabelDisplayMode,
} from '../domain/label-display-mode';
import {
  type FretboardViewMode,
  resolveCapsuleStyle,
} from '../domain/fretboard-view-mode';

export function renderFretboard(
  model: FretboardModel,
  viewMode: FretboardViewMode,
  labelMode: LabelDisplayMode,
): HTMLElement {
  const board = document.createElement('section');
  board.className = 'fretboard';
  board.id = 'fretboard-panel';
  board.setAttribute('role', 'tabpanel');
  board.setAttribute('aria-label', 'ギター指板');

  const scroll = document.createElement('div');
  scroll.className = 'fretboard__scroll';

  const grid = document.createElement('div');
  grid.className = 'fretboard__grid';

  appendHeaderRow(grid);

  /* 画面上: 上＝1 弦、下＝6 弦（ドメイン配列は 0＝6 弦のまま） */
  for (let s = model.strings.length - 1; s >= 0; s--) {
    appendStringRow(grid, model.strings[s], viewMode, labelMode);
  }

  const inlayLayer = document.createElement('div');
  inlayLayer.className = 'fretboard__inlays';
  inlayLayer.setAttribute('aria-hidden', 'true');
  inlayLayer.appendChild(createInlaySpacer());
  for (let fret = 1; fret <= MAX_FRET; fret++) {
    inlayLayer.appendChild(createInlayColumn(fret));
  }
  grid.appendChild(inlayLayer);

  scroll.appendChild(grid);
  board.appendChild(scroll);
  return board;
}

function appendHeaderRow(grid: HTMLElement): void {
  const corner = document.createElement('div');
  corner.className = 'fretboard__head-corner';
  grid.appendChild(corner);

  const nutHead = document.createElement('div');
  nutHead.className = 'fretboard__head-cell fretboard__head-cell--nut';
  grid.appendChild(nutHead);

  for (let fret = 1; fret <= MAX_FRET; fret++) {
    const cell = createHeadCell(String(fret));
    cell.classList.add('fretboard__head-cell--fret');
    grid.appendChild(cell);
  }
}

function appendStringRow(
  grid: HTMLElement,
  stringRow: FretboardModel['strings'][number],
  viewMode: FretboardViewMode,
  labelMode: LabelDisplayMode,
): void {
  const label = document.createElement('div');
  label.className = 'fretboard__string-label';
  label.innerHTML = `<span class="fretboard__string-name">${stringRow.name}</span>`;
  grid.appendChild(label);

  grid.appendChild(createOpenIntersection(stringRow.frets[0], viewMode, labelMode));

  for (let fret = 1; fret <= MAX_FRET; fret++) {
    grid.appendChild(
      createIntersection(stringRow.frets[fret], viewMode, labelMode),
    );
  }
}

function createHeadCell(text: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'fretboard__head-cell';
  const num = document.createElement('span');
  num.className = 'fretboard__fret-num';
  num.textContent = text;
  el.appendChild(num);
  return el;
}

function createInlaySpacer(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'fretboard__inlay-cell';
  return el;
}

function createInlayColumn(fret: number): HTMLElement {
  const cell = document.createElement('div');
  cell.className = 'fretboard__inlay-cell';

  const count = inlayDotCount(fret);
  if (count === 0) {
    return cell;
  }

  const wrap = document.createElement('div');
  wrap.className =
    count === 2
      ? 'fretboard__inlay-dots fretboard__inlay-dots--double'
      : 'fretboard__inlay-dots';

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = 'fretboard__inlay-dot';
    wrap.appendChild(dot);
  }
  cell.appendChild(wrap);
  return cell;
}

function createOpenIntersection(
  cell: FretCell,
  viewMode: FretboardViewMode,
  labelMode: LabelDisplayMode,
): HTMLElement {
  const node = document.createElement('div');
  node.className =
    'fretboard__intersection fretboard__intersection--nut fretboard__intersection--open';

  attachPlayableCapsule(node, cell, viewMode, labelMode);
  return node;
}

function createIntersection(
  cell: FretCell,
  viewMode: FretboardViewMode,
  labelMode: LabelDisplayMode,
): HTMLElement {
  const node = document.createElement('div');
  node.className = 'fretboard__intersection';

  attachPlayableCapsule(node, cell, viewMode, labelMode);
  return node;
}

function attachPlayableCapsule(
  intersection: HTMLElement,
  cell: FretCell,
  viewMode: FretboardViewMode,
  labelMode: LabelDisplayMode,
): void {
  const anchor = document.createElement('div');
  anchor.className = 'fretboard__capsule-anchor';

  const capsule = document.createElement('button');
  capsule.type = 'button';
  capsule.className = `${capsuleClass(cell, viewMode)} interval-capsule--playable`;
  const label = displayLabelForCell(cell, labelMode);
  capsule.textContent = label;
  capsule.setAttribute(
    'aria-label',
    `${cell.noteName}（${STRING_LABEL_FOR_ARIA(cell.stringIndex)}弦 ${cell.fret} フレット）を再生`,
  );

  const play = (): void => {
    void tonePlayer.playFret(cell.stringIndex, cell.fret);
  };

  capsule.addEventListener('click', (event) => {
    event.stopPropagation();
    play();
  });

  anchor.appendChild(capsule);
  intersection.appendChild(anchor);
}

function STRING_LABEL_FOR_ARIA(stringIndex: number): number {
  return 6 - stringIndex;
}

function capsuleClass(cell: FretCell, viewMode: FretboardViewMode): string {
  const kind = resolveCapsuleStyle(cell, viewMode);
  return `interval-capsule interval-capsule--${kind}`;
}
