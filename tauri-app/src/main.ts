import { logInfo, logBoundaryError } from './core/utils/logger';
import { setupIpcListeners } from './core/ipc/tauri-bridge';
import { initVideoPlayer } from './features/video-player/player';
import { initRenderer } from './features/shader/renderer';
import { setupWindowDrag } from './features/ui/drag';
import { setupWindowResize } from './features/ui/resize';
import { setupKnobs } from './features/ui/knobs';
import { setupContextMenu } from './features/ui/context-menu';
import { dispatch, getState, onStateChange } from './features/tv-state/store';
import { initAnimations } from './features/tv-state/animations';
import { initAspectRatio } from './features/ui/aspect-ratio';
import { TVState } from './features/tv-state/state-machine';
import { initLocalFileListener } from './features/video-player/local-file';
import { initSeekBar } from './features/video-player/seek-bar';

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
  setupWindowResize(tvBody);
  setupKnobs(tvBody);
  setupContextMenu(tvBody);

  const powerBtn = document.getElementById('btn-power');
  powerBtn?.addEventListener('click', () => {
    logInfo('main', 'powerClick', 'Power button clicked');
    dispatch({ type: 'POWER_TOGGLE' });
  });

  updatePowerLed(getState());
  onStateChange(updatePowerLed);
}

async function bootstrap(): Promise<void> {
  logInfo('main', 'bootstrap', 'Bootstrapping HoverTV application');
  const canvas = document.getElementById('crt-canvas') as HTMLCanvasElement;
  const video = document.getElementById('video-element') as HTMLVideoElement;
  const tvBody = document.getElementById('tv-body') as HTMLElement;
  const screenHousing = document.getElementById('screen-housing') as HTMLElement;

  if (!canvas || !video || !tvBody) {
    logBoundaryError('main', 'bootstrap', 'Essential DOM elements missing');
    return;
  }

  resizeCanvasToDisplaySize(canvas);
  window.addEventListener('resize', () => resizeCanvasToDisplaySize(canvas));

  initVideoPlayer(video);
  initRenderer(canvas, video);
  initAnimations();

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
