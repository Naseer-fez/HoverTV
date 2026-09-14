import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getIntensity,
  setIntensity,
  getTemperature,
  setTemperature,
  isEffectEnabled,
  setEffectEnabled,
  onUniformsChange,
} from './uniforms.ts';

test('Uniforms - Intensity clamp and listener notification', () => {
  let latestIntensity = 0;
  const unsubscribe = onUniformsChange((state) => {
    latestIntensity = state.intensity;
  });

  setIntensity(0.85);
  assert.equal(getIntensity(), 0.85);
  assert.equal(latestIntensity, 0.85);

  // Clamping test
  setIntensity(1.5);
  assert.equal(getIntensity(), 1.0);
  assert.equal(latestIntensity, 1.0);

  setIntensity(-0.5);
  assert.equal(getIntensity(), 0.0);
  assert.equal(latestIntensity, 0.0);

  unsubscribe();
});

test('Uniforms - Color temperature clamp and listeners', () => {
  setTemperature(0.25);
  assert.equal(getTemperature(), 0.25);

  setTemperature(10);
  assert.equal(getTemperature(), 1.0);

  setTemperature(-2);
  assert.equal(getTemperature(), 0.0);
});

test('Uniforms - Individual effect toggles', () => {
  assert.equal(isEffectEnabled('scanlines'), true);
  setEffectEnabled('scanlines', false);
  assert.equal(isEffectEnabled('scanlines'), false);

  setEffectEnabled('scanlines', true);
  assert.equal(isEffectEnabled('scanlines'), true);
});
