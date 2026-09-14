import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, calculateProgress } from './seek-bar.ts';

test('SeekBar - formatTime formats seconds into mm:ss', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(59), '00:59');
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(3600), '60:00');
  assert.equal(formatTime(-10), '00:00');
  assert.equal(formatTime(NaN), '00:00');
});

test('SeekBar - calculateProgress computes ratios clamped between 0 and 1', () => {
  assert.equal(calculateProgress(0, 100), 0);
  assert.equal(calculateProgress(50, 100), 0.5);
  assert.equal(calculateProgress(100, 100), 1);
  assert.equal(calculateProgress(150, 100), 1);
  assert.equal(calculateProgress(-10, 100), 0);
  assert.equal(calculateProgress(50, 0), 0);
  assert.equal(calculateProgress(50, NaN), 0);
});
