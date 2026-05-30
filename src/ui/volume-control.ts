import { t } from '../i18n';

export function createVolumeControl(
  volume: number,
  onChange: (volume: number) => void,
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'volume-control';

  const icon = document.createElement('span');
  icon.className = 'volume-control__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML =
    '<svg class="volume-control__icon-svg" viewBox="0 0 24 24" width="16" height="16" focusable="false"><path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.74 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = 'volume-slider';
  slider.className = 'volume-control__slider';
  slider.min = '0';
  slider.max = '100';
  slider.step = '1';
  slider.value = String(volume);
  slider.setAttribute('aria-label', t('volume.ariaLabel'));

  const syncSliderAria = (value: number): void => {
    slider.setAttribute('aria-valuenow', String(value));
    slider.setAttribute('aria-valuetext', t('volume.ariaValue', { value }));
  };
  syncSliderAria(volume);

  slider.addEventListener('input', () => {
    const next = Number(slider.value);
    syncSliderAria(next);
    onChange(next);
  });

  wrap.appendChild(icon);
  wrap.appendChild(slider);
  return wrap;
}
