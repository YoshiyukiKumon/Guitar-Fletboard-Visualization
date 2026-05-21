export function createSegmentSwitcher<T extends string>(config: {
  className: string;
  ariaLabel: string;
  modes: readonly T[];
  labels: Record<T, string>;
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
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', mode === config.active ? 'true' : 'false');
    btn.textContent = config.labels[mode];
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
