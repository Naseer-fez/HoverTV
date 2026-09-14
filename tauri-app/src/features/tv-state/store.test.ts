import test from 'node:test';
import assert from 'node:assert/strict';
import { getState, getActiveVideo, dispatch, onStateChange } from './store.ts';
import { TVState } from './state-machine.ts';

test('TV State Store - Initial state is OFF', () => {
  assert.equal(getState(), TVState.OFF);
  assert.equal(getActiveVideo().url, null);
});

test('TV State Store - Lifecycle from OFF -> POWERING_ON -> PLAYING', async () => {
  const transitions: TVState[] = [];
  const unsubscribe = onStateChange((state) => {
    transitions.push(state);
  });

  // 1. Receive video while OFF
  dispatch({
    type: 'RECEIVE_VIDEO',
    url: 'https://example.com/stream.mp4',
    title: 'Test Stream',
    source: 'youtube',
  });
  assert.equal(getState(), TVState.POWERING_ON);
  assert.equal(getActiveVideo().url, 'https://example.com/stream.mp4');

  // 2. Complete power-on animation
  dispatch({ type: 'ANIMATION_COMPLETE' });

  // Wait for microtask dispatch of queued video
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Should transition POWERING_ON -> STATIC -> PLAYING
  assert.equal(getState(), TVState.PLAYING);
  assert.equal(getActiveVideo().url, 'https://example.com/stream.mp4');

  // 3. Toggle power while playing -> POWERING_OFF
  dispatch({ type: 'POWER_TOGGLE' });
  assert.equal(getState(), TVState.POWERING_OFF);

  // 4. Complete power-off animation -> OFF
  dispatch({ type: 'ANIMATION_COMPLETE' });
  assert.equal(getState(), TVState.OFF);
  assert.equal(getActiveVideo().url, null);

  unsubscribe();
});
