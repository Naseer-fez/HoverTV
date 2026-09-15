import test from 'node:test';
import assert from 'node:assert/strict';
import { getState, getActiveVideo, dispatch, onStateChange, onPendingVideoConsumed, hasPendingVideo } from './store.ts';
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

test('TV State Store - onPendingVideoConsumed fires when pending video is consumed on power-on', async () => {
  const consumed: any[] = [];
  onPendingVideoConsumed((video) => {
    consumed.push(video);
  });

  // 1. Receive video while OFF
  dispatch({
    type: 'RECEIVE_VIDEO',
    url: 'https://example.com/queued.mp4',
    title: 'Queued Video',
    source: 'html5',
  });
  assert.equal(hasPendingVideo(), true);

  // 2. Complete power-on animation -> transitions to STATIC, queues microtask
  dispatch({ type: 'ANIMATION_COMPLETE' });

  // Wait for microtask
  await new Promise((resolve) => setTimeout(resolve, 15));

  assert.equal(consumed.length, 1);
  assert.deepEqual(consumed[0], {
    url: 'https://example.com/queued.mp4',
    title: 'Queued Video',
    source: 'html5',
  });
  assert.equal(hasPendingVideo(), false);
  assert.equal(getState(), TVState.PLAYING);

  // Clean up
  dispatch({ type: 'POWER_TOGGLE' });
  dispatch({ type: 'ANIMATION_COMPLETE' });
  assert.equal(getState(), TVState.OFF);
});

test('TV State Store - active video title and url are preserved during transient STATIC', () => {
  if (getState() !== TVState.OFF) {
    dispatch({ type: 'POWER_TOGGLE' });
    dispatch({ type: 'ANIMATION_COMPLETE' });
  }

  dispatch({
    type: 'RECEIVE_VIDEO',
    url: 'https://example.com/transient.mp4',
    title: 'Transient Title',
    source: 'local',
  });
  assert.equal(getState(), TVState.POWERING_ON);

  // Animation complete transitions POWERING_ON -> STATIC
  dispatch({ type: 'ANIMATION_COMPLETE' });
  // Synchronously right after dispatching ANIMATION_COMPLETE before microtask runs:
  // currentState is STATIC, but activeVideoUrl and title must still be preserved
  assert.equal(getActiveVideo().url, 'https://example.com/transient.mp4');
  assert.equal(getActiveVideo().title, 'Transient Title');

  // Clean up
  dispatch({ type: 'POWER_TOGGLE' });
  dispatch({ type: 'ANIMATION_COMPLETE' });
});
