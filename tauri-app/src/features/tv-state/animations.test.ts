import test from 'node:test';
import assert from 'node:assert/strict';
import { POWER_ON_STEPS, POWER_OFF_STEPS } from './animations.ts';

test('Animations - Power-On sequence phases and timings', () => {
  assert.equal(POWER_ON_STEPS.length, 3);
  assert.deepEqual(
    POWER_ON_STEPS.map((s) => s.phase),
    [1, 2, 3]
  );

  const totalPowerOnDuration = POWER_ON_STEPS.reduce((sum, s) => sum + s.durationMs, 0);
  assert.equal(totalPowerOnDuration, 400); // 100 + 200 + 100
});

test('Animations - Power-Off sequence phases and timings', () => {
  assert.equal(POWER_OFF_STEPS.length, 4);
  assert.deepEqual(
    POWER_OFF_STEPS.map((s) => s.phase),
    [4, 5, 6, 7]
  );

  const totalPowerOffDuration = POWER_OFF_STEPS.reduce((sum, s) => sum + s.durationMs, 0);
  assert.equal(totalPowerOffDuration, 550); // 200 + 100 + 100 + 150
});
