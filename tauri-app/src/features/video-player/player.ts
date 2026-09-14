import { logInfo, logWarn, logBoundaryError } from '../../core/utils/logger';
import { dispatch } from '../tv-state/store';

let videoElement: HTMLVideoElement | null = null;
let currentSourceUrl = '';

export function initVideoPlayer(element: HTMLVideoElement): void {
  logInfo('video-player', 'initVideoPlayer', 'Initializing HTML5 video player');
  videoElement = element;
  videoElement.crossOrigin = 'anonymous';
  videoElement.playsInline = true;
  videoElement.autoplay = true;

  videoElement.addEventListener('ended', () => {
    logInfo('video-player', 'onEnded', 'Video playback finished');
    dispatch({ type: 'VIDEO_ENDED' });
  });

  videoElement.addEventListener('error', () => {
    const error = videoElement?.error;
    logBoundaryError('video-player', 'onError', error?.message || 'Playback error');
    dispatch({ type: 'SOURCE_LOST' });
  });
}

export function getVideoElement(): HTMLVideoElement | null {
  return videoElement;
}

export function getCurrentSourceUrl(): string {
  return currentSourceUrl;
}

export function playUrl(url: string, source = 'html5'): void {
  if (!videoElement) {
    logWarn('video-player', 'playUrl', 'Video player not initialized');
    return;
  }
  logInfo('video-player', 'playUrl', `Loading source: ${url} (${source})`);
  if (videoElement.src && !videoElement.paused) {
    videoElement.pause();
  }
  currentSourceUrl = url;
  videoElement.src = url;
  videoElement.load();
  videoElement.play().catch((err) => {
    logBoundaryError('video-player', 'playUrl', err, 'Autoplay blocked or load failed');
  });
}

export function syncPlaybackState(state: 'play' | 'pause'): void {
  if (!videoElement) return;
  logInfo('video-player', 'syncPlaybackState', `Syncing state to: ${state}`);
  if (state === 'play') {
    videoElement.play().catch((err) => {
      logBoundaryError('video-player', 'syncPlaybackState', err, 'Failed to resume');
    });
  } else {
    videoElement.pause();
  }
}

export function togglePlayPause(): void {
  if (!videoElement) return;
  if (videoElement.paused) {
    videoElement.play().catch((err) => {
      logBoundaryError('video-player', 'togglePlayPause', err);
    });
  } else {
    videoElement.pause();
  }
}

export function setPlayerVolume(volume: number): void {
  if (!videoElement) return;
  const clamped = Math.max(0, Math.min(1, volume));
  logInfo('video-player', 'setPlayerVolume', `Setting player volume: ${clamped.toFixed(2)}`);
  videoElement.volume = clamped;
}
