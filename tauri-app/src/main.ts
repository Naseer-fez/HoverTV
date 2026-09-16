import { logInfo, logBoundaryError } from './core/utils/logger';
import { setupIpcListeners } from './core/ipc/tauri-bridge';
import { initVideoPlayer, stopPlayback, playUrl } from './features/video-player/player';
import { initRenderer } from './features/shader/renderer';
import { setupWindowDrag } from './features/ui/drag';
import { setupWindowResize } from './features/ui/resize';
import { setupKnobs } from './features/ui/knobs';
import { setupContextMenu } from './features/ui/context-menu';
import { dispatch, getState, onStateChange, onPendingVideoConsumed } from './features/tv-state/store';
import { initAnimations } from './features/tv-state/animations';
import { initAspectRatio } from './features/ui/aspect-ratio';
import { TVState } from './features/tv-state/state-machine';
import { initLocalFileListener } from './features/video-player/local-file';
import { initSeekBar } from './features/video-player/seek-bar';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): void {
  const width = canvas.clientWidth * window.devicePixelRatio;
  const height = canvas.clientHeight * window.devicePixelRatio;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    logInfo('main', 'resizeCanvas', `Viewport resized: ${Math.round(width)}x${Math.round(height)}`);
  }
}

function updatePowerLed(state: TVState): void {
  const led = document.querySelector('.power-led');
  if (!led) return;
  const isPowered = state === TVState.PLAYING || state === TVState.STATIC || state === TVState.POWERING_ON;
  led.classList.toggle('on', isPowered);
  led.classList.toggle('off', !isPowered);
  logInfo('main', 'updatePowerLed', `Power LED state: ${isPowered ? 'ON' : 'OFF'}`);
}

function initUIInteractions(tvBody: HTMLElement): void {
  setupWindowDrag(tvBody);
  setupWindowResize();
  setupKnobs(tvBody);
  setupContextMenu(tvBody);

  let clickCount = 0;
  let clickTimer: ReturnType<typeof setTimeout> | null = null;

  const powerBtn = document.getElementById('btn-power');
  powerBtn?.addEventListener('click', async () => {
    clickCount++;
    if (clickTimer) clearTimeout(clickTimer);
    
    clickTimer = setTimeout(async () => {
      logInfo('main', 'powerClick', `Power button clicked ${clickCount} times`);
      if (clickCount === 1) {
        dispatch({ type: 'POWER_TOGGLE' });
      } else if (clickCount === 2) {
        getCurrentWindow().minimize();
      } else if (clickCount >= 3) {
        invoke('exit_app');
      }
      clickCount = 0;
    }, 400);
  });

  updatePowerLed(getState());
  onStateChange((state) => {
    updatePowerLed(state);
    if (state === TVState.OFF || state === TVState.POWERING_OFF) {
      stopPlayback();
    }
  });

  onPendingVideoConsumed((video) => {
    logInfo('main', 'onPendingVideoConsumed', `Playing consumed pending video: ${video.url} (${video.source})`);
    playUrl(video.url, video.source);
  });
}

async function bootstrap(): Promise<void> {
  logInfo('main', 'bootstrap', 'Bootstrapping HoverTV application');
  const canvas = document.getElementById('crt-canvas') as HTMLCanvasElement;
  const video = document.getElementById('video-element') as HTMLVideoElement;
  const youtubeFrame = document.getElementById('youtube-frame') as HTMLIFrameElement | null;
  const tvBody = document.getElementById('tv-body') as HTMLElement;
  const screenHousing = document.getElementById('screen-housing') as HTMLElement;

  if (!canvas || !video || !tvBody) {
    logBoundaryError('main', 'bootstrap', 'Essential DOM elements missing');
    return;
  }

  resizeCanvasToDisplaySize(canvas);
  window.addEventListener('resize', () => resizeCanvasToDisplaySize(canvas));

  initVideoPlayer(video, youtubeFrame);
  await initRenderer(canvas, video);
  initAnimations();
  dispatch({ type: 'POWER_TOGGLE' });

  if (screenHousing) {
    initAspectRatio(video, screenHousing);
    initSeekBar(screenHousing, video);
  }

  initUIInteractions(tvBody);

  try {
    await setupIpcListeners();
    await initLocalFileListener();
    logInfo('main', 'bootstrap', 'HoverTV initialization complete');
  } catch (err) {
    logBoundaryError('main', 'bootstrap', err, 'Failed to establish IPC');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bootstrap();
});
