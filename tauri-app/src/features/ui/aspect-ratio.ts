import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { logInfo, logBoundaryError } from '../../core/utils/logger';
import { onStateChange } from '../tv-state/store';
import { TVState } from '../tv-state/state-machine';

export const DEFAULT_ASPECT_RATIO = 4 / 3;
export const BASE_WINDOW_WIDTH = 680;
export const BASE_WINDOW_HEIGHT = 520;
export const HORIZONTAL_OVERHEAD = 200;
export const VERTICAL_OVERHEAD = 84;

export function computeWindowDimensions(
  ratio: number,
  currentHeight: number
): { width: number; height: number; screenWidth: number; screenHeight: number } {
  const targetHeight = Math.max(360, Math.min(800, currentHeight));
  const screenHeight = targetHeight - VERTICAL_OVERHEAD;
  const screenWidth = Math.round(screenHeight * ratio);
  const targetWidth = Math.max(420, Math.min(1280, screenWidth + HORIZONTAL_OVERHEAD));
  return { width: targetWidth, height: targetHeight, screenWidth, screenHeight };
}

async function applyAspectRatio(ratio: number, housing: HTMLElement): Promise<void> {
  logInfo('aspect-ratio', 'applyAspectRatio', `Adapting screen ratio: ${ratio.toFixed(3)}`);
  housing.style.aspectRatio = `${ratio.toFixed(4)}`;

  try {
    const currentSize = await getCurrentWindow().innerSize();
    const dims = computeWindowDimensions(ratio, currentSize.height);

    logInfo('aspect-ratio', 'applyAspectRatio', `Resizing window to ${dims.width}x${dims.height}`);
    await getCurrentWindow().setSize(new LogicalSize(dims.width, dims.height));
  } catch (err) {
    logBoundaryError('aspect-ratio', 'applyAspectRatio', err, 'Failed resizing window');
  }
}

export function initAspectRatio(video: HTMLVideoElement, housing: HTMLElement): void {
  logInfo('aspect-ratio', 'initAspectRatio', 'Initializing dynamic aspect ratio watcher');

  video.addEventListener('loadedmetadata', () => {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      const ratio = video.videoWidth / video.videoHeight;
      applyAspectRatio(ratio, housing);
    }
  });

  onStateChange((state) => {
    if (state === TVState.STATIC || state === TVState.OFF) {
      logInfo('aspect-ratio', 'onStateChange', 'Resetting to default 4:3 ratio');
      housing.style.aspectRatio = `${DEFAULT_ASPECT_RATIO}`;
      getCurrentWindow().setSize(new LogicalSize(BASE_WINDOW_WIDTH, BASE_WINDOW_HEIGHT)).catch(() => {});
    }
  });
}
