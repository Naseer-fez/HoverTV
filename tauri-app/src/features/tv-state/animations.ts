import { logInfo } from '../../core/utils/logger';
import { setAnimPhase, setAnimProgress } from '../shader/uniforms';
import { getState, dispatch, onStateChange } from './store';
import { TVState } from './state-machine';
import { invokePowerOff } from '../../core/ipc/tauri-bridge';

export interface AnimStep {
  phase: number;
  durationMs: number;
}

export const POWER_ON_STEPS: AnimStep[] = [
  { phase: 1, durationMs: 100 },
  { phase: 2, durationMs: 200 },
  { phase: 3, durationMs: 100 },
];

export const POWER_OFF_STEPS: AnimStep[] = [
  { phase: 4, durationMs: 200 },
  { phase: 5, durationMs: 100 },
  { phase: 6, durationMs: 100 },
  { phase: 7, durationMs: 150 },
];

let activeRafId: number | null = null;

function cancelActiveAnimation(): void {
  if (activeRafId !== null) {
    cancelAnimationFrame(activeRafId);
    activeRafId = null;
  }
}

function runStep(
  steps: AnimStep[],
  index: number,
  onFinish: () => void,
  targetState: TVState
): void {
  if (getState() !== targetState) return;
  if (index >= steps.length) {
    onFinish();
    return;
  }

  const step = steps[index];
  setAnimPhase(step.phase);
  const startTime = performance.now();

  function tick(now: number): void {
    if (getState() !== targetState) return;
    const elapsed = now - startTime;
    const progress = Math.min(1.0, elapsed / step.durationMs);
    setAnimProgress(progress);

    if (progress < 1.0) {
      activeRafId = requestAnimationFrame(tick);
    } else {
      runStep(steps, index + 1, onFinish, targetState);
    }
  }

  activeRafId = requestAnimationFrame(tick);
}

function playPowerOn(): void {
  logInfo('tv-state', 'playPowerOn', 'Starting CRT power-on sequence');
  cancelActiveAnimation();
  runStep(
    POWER_ON_STEPS,
    0,
    () => {
      setAnimPhase(0);
      setAnimProgress(0);
      logInfo('tv-state', 'playPowerOn', 'Power-on sequence finished');
      dispatch({ type: 'ANIMATION_COMPLETE' });
    },
    TVState.POWERING_ON
  );
}

function playPowerOff(): void {
  logInfo('tv-state', 'playPowerOff', 'Starting CRT power-off sequence');
  cancelActiveAnimation();
  runStep(
    POWER_OFF_STEPS,
    0,
    () => {
      setAnimPhase(8);
      setAnimProgress(0);
      logInfo('tv-state', 'playPowerOff', 'Power-off sequence finished');
      dispatch({ type: 'ANIMATION_COMPLETE' });
    },
    TVState.POWERING_OFF
  );
}

export function initAnimations(): void {
  logInfo('tv-state', 'initAnimations', 'Initializing CRT animation controller');
  setAnimPhase(8);
  setAnimProgress(0);

  onStateChange((state) => {
    if (state === TVState.POWERING_ON) {
      playPowerOn();
    } else if (state === TVState.POWERING_OFF) {
      playPowerOff();
    } else if (state === TVState.OFF) {
      cancelActiveAnimation();
      setAnimPhase(8);
      setAnimProgress(0);
    }
  });
}
