import {
  getLanguageIcon,
  getLocale,
  t,
} from '../i18n';
import {
  APP_LOCALES,
  type AppLocale,
} from '../i18n/locale';

export function createLanguageSwitcher(
  locale: AppLocale,
  onChange: (locale: AppLocale) => void,
): HTMLElement {
  const root = document.createElement('div');
  root.className = 'language-switcher';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'language-switcher__toggle';
  toggle.setAttribute('aria-label', t('language.aria'));
  toggle.setAttribute('aria-haspopup', 'listbox');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = getLanguageIcon(locale);

  const menu = document.createElement('ul');
  menu.className = 'language-switcher__menu';
  menu.hidden = true;
  menu.setAttribute('role', 'listbox');

  let outsideHandler: ((event: MouseEvent) => void) | null = null;

  const closeMenu = (): void => {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (outsideHandler !== null) {
      document.removeEventListener('click', outsideHandler);
      outsideHandler = null;
    }
  };

  const openMenu = (): void => {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    outsideHandler = (event: MouseEvent) => {
      if (!root.contains(event.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('click', outsideHandler);
  };

  for (const option of APP_LOCALES) {
    const item = document.createElement('li');
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', option === locale ? 'true' : 'false');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'language-switcher__option';
    btn.textContent = t(option === 'ja' ? 'language.ja' : 'language.en');
    if (option === locale) {
      btn.classList.add('language-switcher__option--active');
    }
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      closeMenu();
      if (option !== getLocale()) {
        onChange(option);
      }
    });

    item.appendChild(btn);
    menu.appendChild(item);
  }

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  root.appendChild(toggle);
  root.appendChild(menu);
  return root;
}
