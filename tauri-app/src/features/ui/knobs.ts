import { logInfo } from '../../core/utils/logger';
import { getIntensity, setIntensity, getTemperature, setTemperature } from '../shader/uniforms';

interface KnobBinding {
  element: HTMLElement;
  indicator: HTMLElement;
  tooltip: HTMLElement;
  getValue: () => number;
  setValue: (v: number) => void;
  formatText: (v: number) => string;
}

function updateKnobVisual(binding: KnobBinding, value: number): void {
  // Map [0, 1] to [-135deg, 135deg] rotation
  const deg = (value - 0.5) * 270;
  binding.indicator.style.transform = `rotate(${deg}deg)`;
  binding.tooltip.textContent = binding.formatText(value);
}

function bindKnobDrag(binding: KnobBinding): void {
  let startY = 0;
  let startVal = 0;
  let isDragging = false;

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dy = startY - e.clientY;
    const delta = dy / 150.0;
    const newVal = Math.max(0, Math.min(1, startVal + delta));
    binding.setValue(newVal);
    updateKnobVisual(binding, newVal);
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    binding.tooltip.style.opacity = '0';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    logInfo('ui', 'knobDragEnd', `Knob drag finished: ${binding.getValue().toFixed(2)}`);
  };

  binding.element.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    isDragging = true;
    startY = e.clientY;
    startVal = binding.getValue();
    binding.tooltip.style.opacity = '1';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  binding.element.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newVal = Math.max(0, Math.min(1, binding.getValue() + delta));
    binding.setValue(newVal);
    updateKnobVisual(binding, newVal);
    binding.tooltip.style.opacity = '1';
    setTimeout(() => { binding.tooltip.style.opacity = '0'; }, 800);
  });
}

export function setupKnobs(root: HTMLElement): void {
  logInfo('ui', 'setupKnobs', 'Initializing retro rotary knobs');

  const intensityEl = root.querySelector<HTMLElement>('#knob-intensity');
  const tempEl = root.querySelector<HTMLElement>('#knob-temp');
  if (!intensityEl || !tempEl) return;

  const intensityBinding: KnobBinding = {
    element: intensityEl,
    indicator: intensityEl.querySelector('.knob-indicator') as HTMLElement,
    tooltip: intensityEl.querySelector('.knob-tooltip') as HTMLElement,
    getValue: getIntensity,
    setValue: setIntensity,
    formatText: (v) => `CRT: ${Math.round(v * 100)}%`,
  };

  const tempBinding: KnobBinding = {
    element: tempEl,
    indicator: tempEl.querySelector('.knob-indicator') as HTMLElement,
    tooltip: tempEl.querySelector('.knob-tooltip') as HTMLElement,
    getValue: getTemperature,
    setValue: setTemperature,
    formatText: (v) => v < 0.45 ? 'Warm Amber' : v > 0.55 ? 'Cool Blue' : 'Neutral',
  };

  bindKnobDrag(intensityBinding);
  bindKnobDrag(tempBinding);
  updateKnobVisual(intensityBinding, getIntensity());
  updateKnobVisual(tempBinding, getTemperature());
}
