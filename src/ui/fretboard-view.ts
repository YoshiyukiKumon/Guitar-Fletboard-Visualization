import { tonePlayer } from '../audio/tone-player';
import type { FretCell, FretboardModel } from '../domain/fretboard';
import { MAX_FRET } from '../domain/data/fretboard-matrix';
import {
  FRET_INLAY_POSITIONS,
  inlayDotCount,
} from '../domain/fret-inlays';
import {
  displayLabelForCell,
  type LabelDisplayMode,
} from '../domain/label-display-mode';
import {
  type FretboardViewMode,
  resolveCapsuleStyle,
  type CapsuleStyleKind,
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
  for (const fret of FRET_INLAY_POSITIONS) {
    inlayLayer.appendChild(createInlayMarker(fret));
  }
  grid.appendChild(inlayLayer);

  scroll.appendChild(grid);
  attachFretboardScrollInteractions(scroll);
  board.appendChild(scroll);
  return board;
}

const FRETBOARD_SCROLL_DRAG_THRESHOLD_PX = 6;

function horizontalWheelDelta(event: WheelEvent): number {
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
    return event.deltaX;
  }
  if (event.shiftKey && event.deltaY !== 0) {
    return event.deltaY;
  }
  return 0;
}

/** 指板スクロール領域全体で横ホイール・ドラッグスクロールを統一 */
function attachFretboardScrollInteractions(scroll: HTMLElement): void {
  scroll.addEventListener(
    'wheel',
    (event) => {
      const delta = horizontalWheelDelta(event);
      if (delta === 0) {
        return;
      }

      const maxLeft = scroll.scrollWidth - scroll.clientWidth;
      const next = Math.max(0, Math.min(maxLeft, scroll.scrollLeft + delta));
      if (next === scroll.scrollLeft) {
        return;
      }

      scroll.scrollLeft = next;
      event.preventDefault();
    },
    { passive: false },
  );

  type DragState = {
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    dragging: boolean;
  };

  let dragState: DragState | null = null;

  const finishDrag = (event: PointerEvent): void => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }
    if (dragState.dragging) {
      scroll.dataset.dragged = '1';
      scroll.classList.remove('fretboard__scroll--dragging');
      try {
        scroll.releasePointerCapture(event.pointerId);
      } catch {
        /* pointer capture may already be released */
      }
    }
    dragState = null;
  };

  scroll.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) {
        return;
      }
      delete scroll.dataset.dragged;
      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: scroll.scrollLeft,
        dragging: false,
      };
    },
    { capture: true },
  );

  scroll.addEventListener(
    'pointermove',
    (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      if (!dragState.dragging) {
        if (Math.abs(deltaX) < FRETBOARD_SCROLL_DRAG_THRESHOLD_PX) {
          return;
        }
        dragState.dragging = true;
        scroll.classList.add('fretboard__scroll--dragging');
        scroll.setPointerCapture(event.pointerId);
      }

      scroll.scrollLeft = dragState.startScrollLeft - deltaX;
      event.preventDefault();
    },
    { capture: true },
  );

  scroll.addEventListener('pointerup', finishDrag, { capture: true });
  scroll.addEventListener('pointercancel', finishDrag, { capture: true });
}

function shouldSuppressFretboardTapAfterScroll(scroll: HTMLElement): boolean {
  if (scroll.dataset.dragged !== '1') {
    return false;
  }
  delete scroll.dataset.dragged;
  return true;
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

/**
 * フレット N の目印はフレット (N-1) と N の間（N 列目の中央）。
 * 列番号: 1=弦ラベル, 2=ナット, 3=1フレット … → N フレットは 2+N 列目。
 */
function createInlayMarker(fret: number): HTMLElement {
  const marker = document.createElement('div');
  marker.className = 'fretboard__inlay-marker';
  if (inlayDotCount(fret) === 2) {
    marker.classList.add('fretboard__inlay-marker--double');
  }
  marker.style.gridColumn = String(2 + fret);

  const count = inlayDotCount(fret);
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = 'fretboard__inlay-dot';
    marker.appendChild(dot);
  }
  return marker;
}

function createOpenIntersection(
  cell: FretCell,
  viewMode: FretboardViewMode,
  labelMode: LabelDisplayMode,
): HTMLElement {
  const node = document.createElement('div');
  node.className =
    'fretboard__intersection fretboard__intersection--nut fretboard__intersection--open';

  attachFretTapTarget(node, cell, viewMode, labelMode);
  return node;
}

function createIntersection(
  cell: FretCell,
  viewMode: FretboardViewMode,
  labelMode: LabelDisplayMode,
): HTMLElement {
  const node = document.createElement('div');
  node.className = 'fretboard__intersection';

  attachFretTapTarget(node, cell, viewMode, labelMode);
  return node;
}

function attachFretTapTarget(
  intersection: HTMLElement,
  cell: FretCell,
  viewMode: FretboardViewMode,
  labelMode: LabelDisplayMode,
): void {
  const styleKind = resolveCapsuleStyle(cell, viewMode);
  const showVisual = !(labelMode === 'dot' && styleKind === 'muted');

  const tapTarget = document.createElement('button');
  tapTarget.type = 'button';
  tapTarget.className = 'fretboard__tap-target';
  const pitchForAria =
    labelMode === 'kana'
      ? displayLabelForCell(cell, 'kana', viewMode)
      : cell.noteName;
  tapTarget.setAttribute(
    'aria-label',
    `${pitchForAria}（${STRING_LABEL_FOR_ARIA(cell.stringIndex)}弦 ${cell.fret} フレット）を再生`,
  );

  tapTarget.addEventListener('click', (event) => {
    event.stopPropagation();
    const scroll = tapTarget.closest('.fretboard__scroll');
    if (scroll instanceof HTMLElement && shouldSuppressFretboardTapAfterScroll(scroll)) {
      event.preventDefault();
      return;
    }
    void tonePlayer.playFret(cell.stringIndex, cell.fret);
  });

  if (showVisual) {
    const capsule = document.createElement('span');
    capsule.className = capsuleClassFromKind(styleKind);
    if (labelMode === 'dot') {
      capsule.classList.add('interval-capsule--dot-circle');
    } else {
      capsule.textContent = displayLabelForCell(cell, labelMode, viewMode);
    }
    tapTarget.appendChild(capsule);
  }

  intersection.appendChild(tapTarget);
}

function STRING_LABEL_FOR_ARIA(stringIndex: number): number {
  return 6 - stringIndex;
}

function capsuleClassFromKind(kind: CapsuleStyleKind): string {
  return `interval-capsule interval-capsule--playable interval-capsule--${kind}`;
}
