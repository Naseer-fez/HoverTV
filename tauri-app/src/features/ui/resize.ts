import { getCurrentWindow } from '@tauri-apps/api/window';
import { logInfo, logBoundaryError } from '../../core/utils/logger';

type ResizeDirection =
  | 'East'
  | 'North'
  | 'NorthEast'
  | 'NorthWest'
  | 'South'
  | 'SouthEast'
  | 'SouthWest'
  | 'West';

export function setupWindowResize(container: HTMLElement): void {
  logInfo('ui', 'setupWindowResize', 'Configuring window resize handles');

  const handles = container.querySelectorAll<HTMLElement>('.resize-handle');
  handles.forEach((handle) => {
    handle.addEventListener('mousedown', async (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const direction = handle.dataset.direction as ResizeDirection;
      if (!direction) return;

      try {
        logInfo('ui', 'startResize', `Starting resize dragging: ${direction}`);
        await getCurrentWindow().startResizeDragging(direction);
      } catch (err) {
        logBoundaryError('ui', 'setupWindowResize', err, `Failed resize direction: ${direction}`);
      }
    });
  });
}
