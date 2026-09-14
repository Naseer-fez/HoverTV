import { getCurrentWindow } from '@tauri-apps/api/window';
import { logInfo, logBoundaryError } from '../../core/utils/logger';

export function setupWindowDrag(tvBody: HTMLElement): void {
  logInfo('ui', 'setupWindowDrag', 'Configuring window drag handler');

  tvBody.addEventListener('mousedown', async (e: MouseEvent) => {
    // Only primary mouse button and not inside controls or context menu
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('#tv-controls') || target.closest('#context-menu') || target.closest('.resize-handle')) {
      return;
    }

    try {
      logInfo('ui', 'onMouseDown', 'Initiating Tauri window drag');
      await getCurrentWindow().startDragging();
    } catch (err) {
      logBoundaryError('ui', 'setupWindowDrag', err, 'Failed to start window drag');
    }
  });
}
