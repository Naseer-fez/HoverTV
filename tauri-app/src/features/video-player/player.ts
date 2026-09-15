import { logInfo, logWarn, logBoundaryError } from '../../core/utils/logger';
import { dispatch } from '../tv-state/store';
import { resetCorsState } from '../shader/renderer';

let videoElement: HTMLVideoElement | null = null;
let youtubeFrame: HTMLIFrameElement | null = null;
let currentSourceUrl = '';
let currentSourceType = 'html5';
let isYouTubePlaying = false;

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;

      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const shortsIdx = pathParts.indexOf('shorts');
      if (shortsIdx !== -1 && pathParts[shortsIdx + 1]) {
        return pathParts[shortsIdx + 1];
      }
      const embedIdx = pathParts.indexOf('embed');
      if (embedIdx !== -1 && pathParts[embedIdx + 1]) {
        return pathParts[embedIdx + 1];
      }
    } else if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      if (id) return id;
    }
  } catch {
    // URL parsing failed, try regex fallback
  }

  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|watch\?v=))([\w-]{11})/);
  return match ? match[1] : null;
}

function sendYouTubeCommand(func: string, args: unknown[] = []): void {
  if (!youtubeFrame?.contentWindow) return;
  logInfo('video-player', 'sendYouTubeCommand', `Sending YT command: ${func}`);
  youtubeFrame.contentWindow.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    '*'
  );
}

function playVideoSafely(el: HTMLVideoElement, caller: string): void {
  el.play().catch((err: unknown) => {
    if (err instanceof Error && err.name === 'NotAllowedError') {
      logWarn('video-player', caller, 'Unmuted autoplay blocked; falling back to muted playback');
      el.muted = true;
      el.play().catch((playErr) => {
        logBoundaryError('video-player', caller, playErr, 'Muted autoplay failed');
      });
      const restoreAudio = () => {
        if (el) {
          el.muted = false;
          logInfo('video-player', 'restoreAudio', 'Audio unmuted following user interaction');
        }
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('click', restoreAudio, { once: true });
        window.addEventListener('keydown', restoreAudio, { once: true });
      }
      return;
    }
    logBoundaryError('video-player', caller, err, 'Video playback error');
  });
}

export function initVideoPlayer(
  element: HTMLVideoElement,
  frame?: HTMLIFrameElement | null
): void {
  logInfo('video-player', 'initVideoPlayer', 'Initializing video player and embed frame');
  videoElement = element;
  youtubeFrame = frame ?? null;
  videoElement.playsInline = true;
  videoElement.autoplay = true;
  videoElement.crossOrigin = 'anonymous';

  videoElement.addEventListener('ended', () => {
    logInfo('video-player', 'onEnded', 'Video playback finished');
    dispatch({ type: 'VIDEO_ENDED' });
  });

  videoElement.addEventListener('error', () => {
    const el = videoElement;
    if (!el) return;
    if (el.getAttribute('crossorigin') !== null) {
      logWarn('video-player', 'onError', 'CORS blocked for video source; falling back to raw video element');
      el.removeAttribute('crossorigin');
      el.classList.add('cors-fallback');
      el.load();
      playVideoSafely(el, 'onErrorRetry');
      return;
    }
    const error = el.error;
    logBoundaryError('video-player', 'onError', error?.message || 'Playback error');
    dispatch({ type: 'SOURCE_LOST' });
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('message', (event) => {
      if (currentSourceType !== 'youtube') return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const state = data?.info?.playerState ?? (data?.event === 'onStateChange' ? data?.info : undefined);
        if (state === 1) {
          isYouTubePlaying = true;
        } else if (state === 2) {
          isYouTubePlaying = false;
        } else if (state === 0) {
          isYouTubePlaying = false;
          logInfo('video-player', 'onYouTubeEnded', 'YouTube video finished');
          dispatch({ type: 'VIDEO_ENDED' });
        }
      } catch {
        // Ignore non-JSON postMessage from other scripts
      }
    });
  }
}

export function getVideoElement(): HTMLVideoElement | null {
  return videoElement;
}

export function getYouTubeFrame(): HTMLIFrameElement | null {
  return youtubeFrame;
}

export function getCurrentSourceUrl(): string {
  return currentSourceUrl;
}

export function stopPlayback(): void {
  logInfo('video-player', 'stopPlayback', 'Stopping all video and embed playback');
  if (videoElement) {
    videoElement.pause();
    videoElement.removeAttribute('src');
    videoElement.classList.remove('cors-fallback');
    videoElement.load();
  }
  if (youtubeFrame) {
    sendYouTubeCommand('stopVideo');
    youtubeFrame.src = 'about:blank';
    youtubeFrame.style.display = 'none';
  }
  if (typeof document !== 'undefined') {
    document.getElementById('screen-housing')?.classList.remove('youtube-active');
  }
  isYouTubePlaying = false;
  currentSourceUrl = '';
  resetCorsState();
}

function playYouTube(videoId: string, rawUrl: string): void {
  logInfo('video-player', 'playYouTube', `Embedding YouTube video: ${videoId}`);
  if (videoElement && !videoElement.paused) {
    videoElement.pause();
    videoElement.removeAttribute('src');
    videoElement.classList.remove('cors-fallback');
  }

  currentSourceUrl = rawUrl;
  currentSourceType = 'youtube';
  isYouTubePlaying = true;
  resetCorsState();

  if (typeof document !== 'undefined') {
    document.getElementById('screen-housing')?.classList.add('youtube-active');
  }

  if (youtubeFrame) {
    youtubeFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
    youtubeFrame.style.display = 'block';
  }
}

function playHtml5(url: string, source: string): void {
  if (!videoElement) {
    logWarn('video-player', 'playHtml5', 'Video element not initialized');
    return;
  }
  logInfo('video-player', 'playHtml5', `Loading HTML5 source: ${url} (${source})`);
  if (youtubeFrame) {
    youtubeFrame.src = 'about:blank';
    youtubeFrame.style.display = 'none';
  }
  if (typeof document !== 'undefined') {
    document.getElementById('screen-housing')?.classList.remove('youtube-active');
  }

  currentSourceUrl = url;
  currentSourceType = source;
  isYouTubePlaying = false;
  videoElement.classList.remove('cors-fallback');
  resetCorsState();

  videoElement.crossOrigin = 'anonymous';
  videoElement.src = url;
  videoElement.load();
  playVideoSafely(videoElement, 'playHtml5');
}

export function playUrl(url: string, source = 'html5'): void {
  const isYouTube = source === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be');
  if (isYouTube) {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      playYouTube(videoId, url);
      return;
    }
    logWarn('video-player', 'playUrl', `Failed to parse YouTube ID from: ${url}`);
  }
  playHtml5(url, source);
}

export function syncPlaybackState(state: 'play' | 'pause'): void {
  logInfo('video-player', 'syncPlaybackState', `Syncing state to: ${state}`);
  if (currentSourceType === 'youtube') {
    isYouTubePlaying = state === 'play';
    sendYouTubeCommand(state === 'play' ? 'playVideo' : 'pauseVideo');
    return;
  }
  if (!videoElement) return;
  if (state === 'play') {
    playVideoSafely(videoElement, 'syncPlaybackState');
  } else {
    videoElement.pause();
  }
}

export function togglePlayPause(): void {
  logInfo('video-player', 'togglePlayPause', 'Toggling play/pause');
  if (currentSourceType === 'youtube') {
    if (isYouTubePlaying) {
      sendYouTubeCommand('pauseVideo');
      isYouTubePlaying = false;
    } else {
      sendYouTubeCommand('playVideo');
      isYouTubePlaying = true;
    }
    return;
  }
  if (!videoElement) return;
  if (videoElement.paused) {
    playVideoSafely(videoElement, 'togglePlayPause');
  } else {
    videoElement.pause();
  }
}

export function getCurrentSourceType(): string {
  return currentSourceType;
}

export function getIsYouTubePlaying(): boolean {
  return isYouTubePlaying;
}

export function setPlayerVolume(volume: number): void {
  const clamped = Math.max(0, Math.min(1, volume));
  logInfo('video-player', 'setPlayerVolume', `Setting player volume: ${clamped.toFixed(2)}`);
  if (videoElement) {
    videoElement.volume = clamped;
  }
  if (currentSourceType === 'youtube') {
    sendYouTubeCommand('setVolume', [Math.round(clamped * 100)]);
  }
}
