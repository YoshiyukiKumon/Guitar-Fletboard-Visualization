export function createVolumeControl(
  volume: number,
  onChange: (volume: number) => void,
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'volume-control';

  const label = document.createElement('label');
  label.className = 'volume-control__label';
  label.htmlFor = 'volume-slider';
  label.textContent = '音量';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = 'volume-slider';
  slider.className = 'volume-control__slider';
  slider.min = '0';
  slider.max = '100';
  slider.step = '1';
  slider.value = String(volume);

  const valueLabel = document.createElement('span');
  valueLabel.className = 'volume-control__value';
  valueLabel.setAttribute('aria-live', 'polite');
  valueLabel.textContent = `${volume}%`;

  slider.addEventListener('input', () => {
    const next = Number(slider.value);
    valueLabel.textContent = `${next}%`;
    onChange(next);
  });

  label.appendChild(slider);
  wrap.appendChild(label);
  wrap.appendChild(valueLabel);
  return wrap;
}
