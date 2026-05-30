export function createSegmentSwitcher<T extends string>(config: {
  className: string;
  ariaLabel: string;
  modes: readonly T[];
  labels: Record<T, string>;
  /** アイコン表示（SVG 等）。指定時は labels を aria-label に使用 */
  icons?: Record<T, string>;
  /** ボタン表示より詳しい説明（アクセシビリティ用） */
  buttonAriaLabels?: Partial<Record<T, string>>;
  active: T;
  onChange: (mode: T) => void;
}): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = config.className;
  nav.setAttribute('aria-label', config.ariaLabel);

  const list = document.createElement('div');
  list.className = 'segment-switcher__list';
  list.setAttribute('role', 'tablist');

  for (const mode of config.modes) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'segment-switcher__btn';
    btn.dataset.mode = mode;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', mode === config.active ? 'true' : 'false');
    const iconHtml = config.icons?.[mode];
    const buttonLabel = config.labels[mode];
    if (iconHtml !== undefined) {
      btn.innerHTML = iconHtml;
      btn.classList.add('segment-switcher__btn--icon');
      btn.setAttribute('aria-label', buttonLabel);
    } else {
      btn.textContent = buttonLabel;
      const buttonAria = config.buttonAriaLabels?.[mode];
      if (buttonAria !== undefined) {
        btn.setAttribute('aria-label', buttonAria);
      }
    }
    if (mode === config.active) {
      btn.classList.add('segment-switcher__btn--active');
    }
    btn.addEventListener('click', () => {
      if (mode !== config.active) {
        config.onChange(mode);
      }
    });
    list.appendChild(btn);
  }

  nav.appendChild(list);
  return nav;
}
