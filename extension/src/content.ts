import { ExtensionMessage } from './types/messages';
import { logInfo, logBoundaryError } from './utils/logger';
import { extractYouTubeUrl, extractSourceFromChildren } from './extractors';

let activeVideoElement: HTMLVideoElement | null = null;
let isSelectModeActive = false;
let cleanupSelectMode: (() => void) | null = null;

interface VideoInfo {
  url: string;
  title: string;
  source: 'youtube' | 'html5';
  element: HTMLVideoElement;
  isBlobFallback?: boolean;
}

function queryShadowVideos(root: Document | ShadowRoot | Element, depth = 0): HTMLVideoElement[] {
  if (depth > 3) return [];
  const results: HTMLVideoElement[] = Array.from(root.querySelectorAll<HTMLVideoElement>('video'));

  const elements = root.querySelectorAll('*');
  elements.forEach((el) => {
    if (el.shadowRoot) {
      results.push(...queryShadowVideos(el.shadowRoot, depth + 1));
    }
  });

  return results;
}

function findVideosOnPage(): HTMLVideoElement[] {
  logInfo('content-script', 'findVideosOnPage', 'Scanning document and shadow DOMs (depth 3)');
  return queryShadowVideos(document, 0);
}


function extractVideoSource(video: HTMLVideoElement): VideoInfo | null {
  logInfo('content-script', 'extractVideoSource', 'Extracting source from element');
  const isYouTube = window.location.hostname.includes('youtube.com');
  const pageTitle = document.title || 'Untitled Video';

  if (isYouTube) {
    const ytUrl = extractYouTubeUrl();
    if (ytUrl) return { url: ytUrl, title: pageTitle, source: 'youtube', element: video };
  }

  const childSrc = extractSourceFromChildren(video);
  if (childSrc) return { url: childSrc, title: pageTitle, source: 'html5', element: video };

  const directSrc = video.currentSrc || video.src;
  if (directSrc && !directSrc.startsWith('blob:')) {
    return { url: directSrc, title: pageTitle, source: 'html5', element: video };
  }

  if (isYouTube) {
    return { url: window.location.href, title: pageTitle, source: 'youtube', element: video };
  }

  // Graceful blob / MSE fallback: forward page URL as html5 stream
  if (directSrc && directSrc.startsWith('blob:')) {
    logInfo('content-script', 'extractVideoSource', 'Blob/MSE detected, using page URL fallback');
    return { url: window.location.href, title: pageTitle, source: 'html5', element: video, isBlobFallback: true };
  }

  return null;
}

function attachSyncListeners(video: HTMLVideoElement): void {
  logInfo('content-script', 'attachSyncListeners', 'Attaching sync listeners');
  detachSyncListeners();
  activeVideoElement = video;
  activeVideoElement.addEventListener('play', onPlayEvent);
  activeVideoElement.addEventListener('pause', onPauseEvent);
}

function detachSyncListeners(): void {
  if (activeVideoElement) {
    logInfo('content-script', 'detachSyncListeners', 'Removing sync listeners');
    activeVideoElement.removeEventListener('play', onPlayEvent);
    activeVideoElement.removeEventListener('pause', onPauseEvent);
    activeVideoElement = null;
  }
}

function onPlayEvent(): void {
  logInfo('content-script', 'onPlayEvent', 'Video played in browser');
  sendMessage({ type: 'SYNC_STATE', state: 'play' });
}

function onPauseEvent(): void {
  logInfo('content-script', 'onPauseEvent', 'Video paused in browser');
  sendMessage({ type: 'SYNC_STATE', state: 'pause' });
}

function sendMessage(msg: ExtensionMessage): void {
  try {
    logInfo('content-script', 'sendMessage', `Forwarding to background: ${msg.type}`);
    chrome.runtime.sendMessage(msg).catch((err) => {
      logBoundaryError('content-script', 'sendMessage', err, 'Failed to send to background');
    });
  } catch (err) {
    logBoundaryError('content-script', 'sendMessage', err, 'Exception in sendMessage');
  }
}

export function pipeVideo(videoInfo: VideoInfo): void {
  logInfo('content-script', 'pipeVideo', `Piping video: ${videoInfo.url}`);
  attachSyncListeners(videoInfo.element);
  sendMessage({
    type: 'PLAY_URL',
    url: videoInfo.url,
    title: videoInfo.title,
    source: videoInfo.source,
  });
}

function handleAutoDetect(): { ok: boolean; isBlobFallback?: boolean } {
  logInfo('content-script', 'handleAutoDetect', 'Auto-detecting primary video');
  const videos = findVideosOnPage();
  for (const v of videos) {
    const info = extractVideoSource(v);
    if (info) {
      pipeVideo(info);
      return { ok: true, isBlobFallback: info.isBlobFallback };
    }
  }
  return { ok: false };
}

function createVideoHighlight(video: HTMLVideoElement, onSelect: () => void): () => void {
  const rect = video.getBoundingClientRect();
  const overlay = document.createElement('div');
  overlay.className = 'hovertv-select-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = `${rect.top}px`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.border = '3px solid #d4a373';
  overlay.style.backgroundColor = 'rgba(212, 163, 115, 0.25)';
  overlay.style.zIndex = '2147483647';
  overlay.style.cursor = 'crosshair';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.innerHTML = `<span style="background:#18120e;color:#d4a373;padding:4px 8px;border-radius:4px;font-family:sans-serif;font-size:12px;font-weight:bold;pointer-events:none;">📺 Pipe to HoverTV</span>`;

  overlay.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
  });

  document.body.appendChild(overlay);
  return () => overlay.remove();
}

function enableSelectMode(): void {
  if (isSelectModeActive) return;
  isSelectModeActive = true;
  logInfo('content-script', 'enableSelectMode', 'Activating click-to-select overlay');

  const videos = findVideosOnPage();
  const cleanups: Array<() => void> = [];

  videos.forEach((video) => {
    const removeOverlay = createVideoHighlight(video, () => {
      logInfo('content-script', 'selectClick', 'User selected video');
      const info = extractVideoSource(video);
      if (info) pipeVideo(info);
      disableSelectMode();
    });
    cleanups.push(removeOverlay);
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      logInfo('content-script', 'escape', 'Selection cancelled via Escape');
      disableSelectMode();
    }
  };
  window.addEventListener('keydown', onKeyDown);
  cleanups.push(() => window.removeEventListener('keydown', onKeyDown));

  function disableSelectMode(): void {
    isSelectModeActive = false;
    cleanups.forEach((cb) => cb());
    cleanupSelectMode = null;
  }
  cleanupSelectMode = disableSelectMode;
}

window.addEventListener('beforeunload', () => {
  detachSyncListeners();
  if (cleanupSelectMode) cleanupSelectMode();
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  logInfo('content-script', 'onMessage', `Received command: ${request?.action}`);
  if (request?.action === 'PIPE_CURRENT') {
    const res = handleAutoDetect();
    sendResponse(res);
  } else if (request?.action === 'START_SELECT') {
    enableSelectMode();
    sendResponse({ ok: true });
  }
  return true;
});
