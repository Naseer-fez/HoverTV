import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractYouTubeVideoId,
  initVideoPlayer,
  playUrl,
  togglePlayPause,
  stopPlayback,
  getIsYouTubePlaying,
} from './player.ts';
import { resetCorsState, isCorsBlocked } from '../shader/renderer.ts';

test('Player - extractYouTubeVideoId parses standard watch URL', () => {
  const id = extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(id, 'dQw4w9WgXcQ');
});

test('Player - extractYouTubeVideoId parses watch URL with extra parameters', () => {
  const id = extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&feature=emb_title');
  assert.equal(id, 'dQw4w9WgXcQ');
});

test('Player - extractYouTubeVideoId parses YouTube Shorts URL', () => {
  const id = extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ');
  assert.equal(id, 'dQw4w9WgXcQ');
});

test('Player - extractYouTubeVideoId parses youtu.be short URL', () => {
  const id = extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ');
  assert.equal(id, 'dQw4w9WgXcQ');
});

test('Player - extractYouTubeVideoId parses YouTube embed URL', () => {
  const id = extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ');
  assert.equal(id, 'dQw4w9WgXcQ');
});

test('Player - extractYouTubeVideoId returns null for non-YouTube URLs', () => {
  assert.equal(extractYouTubeVideoId('https://example.com/video.mp4'), null);
  assert.equal(extractYouTubeVideoId('file:///C:/videos/test.mp4'), null);
  assert.equal(extractYouTubeVideoId(''), null);
});

function createMockVideoElement() {
  const attributes = new Map<string, string>();
  const classListSet = new Set<string>();
  const listeners = new Map<string, Array<() => void>>();

  const el = {
    playsInline: false,
    autoplay: false,
    crossOrigin: null as string | null,
    src: '',
    paused: true,
    volume: 1,
    muted: false,
    classList: {
      add: (cls: string) => classListSet.add(cls),
      remove: (cls: string) => classListSet.delete(cls),
      contains: (cls: string) => classListSet.has(cls),
    },
    getAttribute: (name: string) => (name === 'crossorigin' ? el.crossOrigin : attributes.get(name) ?? null),
    setAttribute: (name: string, val: string) => {
      attributes.set(name, val);
      if (name === 'crossorigin') el.crossOrigin = val;
    },
    removeAttribute: (name: string) => {
      attributes.delete(name);
      if (name === 'crossorigin') el.crossOrigin = null;
    },
    addEventListener: (event: string, fn: () => void) => {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event)!.push(fn);
    },
    removeEventListener: () => {},
    trigger: (event: string) => {
      listeners.get(event)?.forEach((fn) => fn());
    },
    loadCalls: 0,
    playCalls: 0,
    pauseCalls: 0,
    load: () => { el.loadCalls++; },
    pause: () => { el.paused = true; el.pauseCalls++; },
    play: async () => { el.paused = false; el.playCalls++; },
  };

  return el;
}

function createMockIFrameElement() {
  const sentMessages: Array<{ event: string; func: string; args: unknown[] }> = [];
  const frame = {
    src: '',
    style: { display: 'none' },
    contentWindow: {
      postMessage: (msg: string) => {
        sentMessages.push(JSON.parse(msg));
      },
    },
    sentMessages,
  };
  return frame;
}

test('Player - initVideoPlayer sets crossOrigin to anonymous unconditionally', () => {
  const mockVideo = createMockVideoElement();
  const mockFrame = createMockIFrameElement();

  initVideoPlayer(mockVideo as unknown as HTMLVideoElement, mockFrame as unknown as HTMLIFrameElement);

  assert.equal(mockVideo.crossOrigin, 'anonymous');
  assert.equal(mockVideo.playsInline, true);
  assert.equal(mockVideo.autoplay, true);
});

test('Player - CORS error handler removes crossorigin and applies cors-fallback class', () => {
  const mockVideo = createMockVideoElement();
  const mockFrame = createMockIFrameElement();

  initVideoPlayer(mockVideo as unknown as HTMLVideoElement, mockFrame as unknown as HTMLIFrameElement);
  assert.equal(mockVideo.crossOrigin, 'anonymous');

  // Trigger error event
  mockVideo.trigger('error');

  assert.equal(mockVideo.crossOrigin, null);
  assert.equal(mockVideo.classList.contains('cors-fallback'), true);
  assert.equal(mockVideo.loadCalls > 0, true);
});

test('Player - YouTube bi-directional togglePlayPause toggles between pauseVideo and playVideo', () => {
  const mockVideo = createMockVideoElement();
  const mockFrame = createMockIFrameElement();

  initVideoPlayer(mockVideo as unknown as HTMLVideoElement, mockFrame as unknown as HTMLIFrameElement);

  playUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube');
  assert.equal(getIsYouTubePlaying(), true);
  assert.equal(mockFrame.style.display, 'block');

  // First toggle should pause
  togglePlayPause();
  assert.equal(getIsYouTubePlaying(), false);
  assert.equal(mockFrame.sentMessages.length, 1);
  assert.equal(mockFrame.sentMessages[0].func, 'pauseVideo');

  // Second toggle should resume
  togglePlayPause();
  assert.equal(getIsYouTubePlaying(), true);
  assert.equal(mockFrame.sentMessages.length, 2);
  assert.equal(mockFrame.sentMessages[1].func, 'playVideo');

  stopPlayback();
  assert.equal(getIsYouTubePlaying(), false);
  assert.equal(mockFrame.style.display, 'none');
});

test('Player - stopPlayback cleanly removes cors-fallback and resets CORS state', () => {
  const mockVideo = createMockVideoElement();
  const mockFrame = createMockIFrameElement();

  initVideoPlayer(mockVideo as unknown as HTMLVideoElement, mockFrame as unknown as HTMLIFrameElement);
  mockVideo.classList.add('cors-fallback');

  stopPlayback();
  assert.equal(mockVideo.classList.contains('cors-fallback'), false);
  assert.equal(isCorsBlocked(), false);
});

test('Renderer - resetCorsState and isCorsBlocked manage CORS state cleanly', () => {
  resetCorsState();
  assert.equal(isCorsBlocked(), false);
});
