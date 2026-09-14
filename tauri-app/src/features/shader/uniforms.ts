import { logInfo } from '../../core/utils/logger';

export type CRTEffectKey =
  | 'scanlines'
  | 'curvature'
  | 'vignette'
  | 'chromatic'
  | 'glow'
  | 'noise';

interface ShaderState {
  intensity: number;
  temperature: number;
  animPhase: number;
  animProgress: number;
  effects: Record<CRTEffectKey, boolean>;
}

type UniformListener = (state: Readonly<ShaderState>) => void;

const state: ShaderState = {
  intensity: 0.7,
  temperature: 0.5,
  animPhase: 8.0, // Initial state: 8.0 (OFF)
  animProgress: 0.0,
  effects: {
    scanlines: true,
    curvature: true,
    vignette: true,
    chromatic: true,
    glow: true,
    noise: true,
  },
};

const listeners: Set<UniformListener> = new Set();

function notify(): void {
  listeners.forEach((cb) => cb(state));
}

export function getIntensity(): number {
  return state.intensity;
}

export function setIntensity(v: number): void {
  const clamped = Math.max(0.0, Math.min(1.0, v));
  state.intensity = clamped;
  logInfo('shader', 'setIntensity', `Intensity: ${clamped.toFixed(2)}`);
  notify();
}

export function getTemperature(): number {
  return state.temperature;
}

export function setTemperature(v: number): void {
  const clamped = Math.max(0.0, Math.min(1.0, v));
  state.temperature = clamped;
  logInfo('shader', 'setTemperature', `Temperature: ${clamped.toFixed(2)}`);
  notify();
}

export function isEffectEnabled(key: CRTEffectKey): boolean {
  return state.effects[key];
}

export function setEffectEnabled(key: CRTEffectKey, enabled: boolean): void {
  state.effects[key] = enabled;
  logInfo('shader', 'setEffectEnabled', `Effect '${key}': ${enabled}`);
  notify();
}

export function onUniformsChange(cb: UniformListener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getAnimPhase(): number {
  return state.animPhase;
}

export function setAnimPhase(phase: number): void {
  state.animPhase = phase;
  logInfo('shader', 'setAnimPhase', `Animation phase set to: ${phase}`);
  notify();
}

export function getAnimProgress(): number {
  return state.animProgress;
}

export function setAnimProgress(progress: number): void {
  state.animProgress = Math.max(0.0, Math.min(1.0, progress));
  notify();
}
