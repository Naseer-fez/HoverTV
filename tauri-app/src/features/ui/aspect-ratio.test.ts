import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeWindowDimensions,
  DEFAULT_ASPECT_RATIO,
  BASE_WINDOW_WIDTH,
  BASE_WINDOW_HEIGHT,
  HORIZONTAL_OVERHEAD,
  VERTICAL_OVERHEAD,
} from './aspect-ratio.ts';

test('AspectRatio - constants are calibrated for retro TV housing', () => {
  assert.equal(DEFAULT_ASPECT_RATIO, 4 / 3);
  assert.equal(BASE_WINDOW_WIDTH, 680);
  assert.equal(BASE_WINDOW_HEIGHT, 520);
  assert.equal(HORIZONTAL_OVERHEAD, 200);
  assert.equal(VERTICAL_OVERHEAD, 84);
});

test('AspectRatio - computes 16:9 widescreen dimensions accurately', () => {
  const height = 520;
  const ratio = 16 / 9;
  const dims = computeWindowDimensions(ratio, height);

  assert.equal(dims.height, 520);
  assert.equal(dims.screenHeight, 520 - 84); // 436
  assert.equal(dims.screenWidth, Math.round(436 * (16 / 9))); // 775
  assert.equal(dims.width, 775 + 200); // 975
});

test('AspectRatio - clamps target height to minimum 360', () => {
  const dims = computeWindowDimensions(16 / 9, 200);
  assert.equal(dims.height, 360);
  assert.equal(dims.screenHeight, 360 - 84);
});

test('AspectRatio - clamps target height to maximum 800', () => {
  const dims = computeWindowDimensions(16 / 9, 1200);
  assert.equal(dims.height, 800);
  assert.equal(dims.screenHeight, 800 - 84);
});

test('AspectRatio - clamps target width to maximum 1280 for ultra-wide video', () => {
  const ultraWideRatio = 32 / 9; // very wide
  const dims = computeWindowDimensions(ultraWideRatio, 600);
  assert.equal(dims.width, 1280);
});

test('AspectRatio - clamps target width to minimum 420 for vertical 9:16 video', () => {
  const verticalRatio = 9 / 16;
  const dims = computeWindowDimensions(verticalRatio, 360);
  assert.equal(dims.width, 420);
});
