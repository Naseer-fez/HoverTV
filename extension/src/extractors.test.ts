import test from 'node:test';
import assert from 'node:assert/strict';
import { extractYouTubeUrl, extractSourceFromChildren } from './extractors.ts';

test('extractYouTubeUrl - extracts from standard watch url with single parameter', () => {
  const loc = { pathname: '/watch', search: '?v=dQw4w9WgXcQ' };
  const result = extractYouTubeUrl(loc);
  assert.equal(result, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('extractYouTubeUrl - extracts from watch url with multiple query parameters', () => {
  const loc = { pathname: '/watch', search: '?feature=shared&v=abc12345678&t=120s' };
  const result = extractYouTubeUrl(loc);
  assert.equal(result, 'https://www.youtube.com/watch?v=abc12345678');
});

test('extractYouTubeUrl - extracts from YouTube Shorts path', () => {
  const loc = { pathname: '/shorts/ShortId999', search: '' };
  const result = extractYouTubeUrl(loc);
  assert.equal(result, 'https://www.youtube.com/watch?v=ShortId999');
});

test('extractYouTubeUrl - returns null when video ID is missing', () => {
  const loc = { pathname: '/watch', search: '?list=PL12345' };
  const result = extractYouTubeUrl(loc);
  assert.equal(result, null);
});

test('extractYouTubeUrl - returns null for arbitrary pages', () => {
  const loc = { pathname: '/channel/UClgRkhTL3_hImCAmdLfDE4g', search: '' };
  const result = extractYouTubeUrl(loc);
  assert.equal(result, null);
});

test('extractSourceFromChildren - prefers mp4 or webm child source', () => {
  const mockVideo = {
    querySelectorAll: (_sel: string) => [
      { src: 'blob:https://example.com/stream', type: 'video/mp4' },
      { src: 'https://example.com/video.mp4', type: 'video/mp4' },
      { src: 'https://example.com/video.webm', type: 'video/webm' },
    ],
  };
  const result = extractSourceFromChildren(mockVideo);
  assert.equal(result, 'https://example.com/video.mp4');
});

test('extractSourceFromChildren - falls back to any non-blob source', () => {
  const mockVideo = {
    querySelectorAll: (_sel: string) => [
      { src: 'blob:https://example.com/stream-blob', type: 'video/mp4' },
      { src: 'https://example.com/stream.m3u8', type: 'application/x-mpegURL' },
    ],
  };
  const result = extractSourceFromChildren(mockVideo);
  assert.equal(result, 'https://example.com/stream.m3u8');
});

test('extractSourceFromChildren - returns null if all sources are blob URLs', () => {
  const mockVideo = {
    querySelectorAll: (_sel: string) => [
      { src: 'blob:https://example.com/blob-1', type: 'video/mp4' },
      { src: 'blob:https://example.com/blob-2', type: 'video/webm' },
    ],
  };
  const result = extractSourceFromChildren(mockVideo);
  assert.equal(result, null);
});

test('extractSourceFromChildren - returns null when no child sources exist', () => {
  const mockVideo = {
    querySelectorAll: (_sel: string) => [],
  };
  const result = extractSourceFromChildren(mockVideo);
  assert.equal(result, null);
});
