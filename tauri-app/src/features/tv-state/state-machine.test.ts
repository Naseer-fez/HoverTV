import test from 'node:test';
import assert from 'node:assert/strict';
import { TVState, transition } from './state-machine.ts';

test('TV State Machine - Power toggle from OFF to POWERING_ON', () => {
  const next = transition(TVState.OFF, { type: 'POWER_TOGGLE' });
  assert.equal(next, TVState.POWERING_ON);
});

test('TV State Machine - RECEIVE_VIDEO from OFF to POWERING_ON', () => {
  const next = transition(TVState.OFF, {
    type: 'RECEIVE_VIDEO',
    url: 'https://example.com/video.mp4',
    source: 'youtube',
  });
  assert.equal(next, TVState.POWERING_ON);
});

test('TV State Machine - ANIMATION_COMPLETE from POWERING_ON to STATIC', () => {
  const next = transition(TVState.POWERING_ON, { type: 'ANIMATION_COMPLETE' });
  assert.equal(next, TVState.STATIC);
});

test('TV State Machine - RECEIVE_VIDEO transitions to PLAYING', () => {
  const next = transition(TVState.STATIC, {
    type: 'RECEIVE_VIDEO',
    url: 'https://example.com/video.mp4',
    source: 'html5',
  });
  assert.equal(next, TVState.PLAYING);
});

test('TV State Machine - SOURCE_LOST or VIDEO_ENDED transitions back to STATIC', () => {
  const next1 = transition(TVState.PLAYING, { type: 'SOURCE_LOST' });
  assert.equal(next1, TVState.STATIC);

  const next2 = transition(TVState.PLAYING, { type: 'VIDEO_ENDED' });
  assert.equal(next2, TVState.STATIC);
});

test('TV State Machine - POWER_TOGGLE from PLAYING transitions to POWERING_OFF', () => {
  const next = transition(TVState.PLAYING, { type: 'POWER_TOGGLE' });
  assert.equal(next, TVState.POWERING_OFF);
});

test('TV State Machine - ANIMATION_COMPLETE from POWERING_OFF transitions to OFF', () => {
  const next = transition(TVState.POWERING_OFF, { type: 'ANIMATION_COMPLETE' });
  assert.equal(next, TVState.OFF);
});

test('TV State Machine - RECEIVE_VIDEO while already PLAYING keeps PLAYING (channel change)', () => {
  const next = transition(TVState.PLAYING, {
    type: 'RECEIVE_VIDEO',
    url: 'https://example.com/new-channel.mp4',
    source: 'youtube',
  });
  assert.equal(next, TVState.PLAYING);
});

test('TV State Machine - POWER_TOGGLE from STATIC transitions to POWERING_OFF', () => {
  const next = transition(TVState.STATIC, { type: 'POWER_TOGGLE' });
  assert.equal(next, TVState.POWERING_OFF);
});

test('TV State Machine - Out-of-sequence events are safely ignored (no-op)', () => {
  // SOURCE_LOST while OFF or STATIC
  assert.equal(transition(TVState.OFF, { type: 'SOURCE_LOST' }), TVState.OFF);
  assert.equal(transition(TVState.STATIC, { type: 'SOURCE_LOST' }), TVState.STATIC);

  // VIDEO_ENDED while OFF
  assert.equal(transition(TVState.OFF, { type: 'VIDEO_ENDED' }), TVState.OFF);

  // ANIMATION_COMPLETE while PLAYING or STATIC
  assert.equal(transition(TVState.PLAYING, { type: 'ANIMATION_COMPLETE' }), TVState.PLAYING);
  assert.equal(transition(TVState.STATIC, { type: 'ANIMATION_COMPLETE' }), TVState.STATIC);

  // RECEIVE_VIDEO while POWERING_OFF
  const whileOff = transition(TVState.POWERING_OFF, {
    type: 'RECEIVE_VIDEO',
    url: 'https://example.com/ignored.mp4',
    source: 'html5',
  });
  assert.equal(whileOff, TVState.POWERING_OFF);
});

