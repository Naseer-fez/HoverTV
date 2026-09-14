import test from 'node:test';
import assert from 'node:assert/strict';
import { ExtensionMessage, AppMessage } from './types/messages.ts';

test('NM Protocol - PLAY_URL message JSON serialization matches schema', () => {
  const msg: ExtensionMessage = {
    type: 'PLAY_URL',
    url: 'https://www.youtube.com/watch?v=12345',
    title: 'Test Stream',
    source: 'youtube',
  };
  const jsonStr = JSON.stringify(msg);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.type, 'PLAY_URL');
  assert.equal(parsed.url, 'https://www.youtube.com/watch?v=12345');
  assert.equal(parsed.title, 'Test Stream');
  assert.equal(parsed.source, 'youtube');
});

test('NM Protocol - SYNC_STATE message JSON serialization matches schema', () => {
  const playMsg: ExtensionMessage = { type: 'SYNC_STATE', state: 'play' };
  const pauseMsg: ExtensionMessage = { type: 'SYNC_STATE', state: 'pause' };

  assert.equal(JSON.parse(JSON.stringify(playMsg)).state, 'play');
  assert.equal(JSON.parse(JSON.stringify(pauseMsg)).state, 'pause');
});

test('NM Protocol - SOURCE_LOST message serialization matches schema', () => {
  const msg: ExtensionMessage = { type: 'SOURCE_LOST' };
  const parsed = JSON.parse(JSON.stringify(msg));

  assert.equal(parsed.type, 'SOURCE_LOST');
  assert.equal(Object.keys(parsed).length, 1);
});

test('NM Protocol - AppMessage READY and STATUS deserialize properly', () => {
  const ready: AppMessage = { type: 'READY' };
  const status: AppMessage = { type: 'STATUS', status: 'playing' };

  const parsedReady = JSON.parse(JSON.stringify(ready));
  assert.equal(parsedReady.type, 'READY');

  const parsedStatus = JSON.parse(JSON.stringify(status));
  assert.equal(parsedStatus.type, 'STATUS');
  assert.equal(parsedStatus.status, 'playing');
});
