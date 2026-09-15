import { logInfo } from '../../core/utils/logger';

export function setupWindowDrag(_tvBody: HTMLElement): void {
  logInfo('ui', 'setupWindowDrag', 'Configuring window drag handler (using native data-tauri-drag-region)');
  // Programmatic startDragging() is removed in favor of data-tauri-drag-region
  // attribute in index.html to prevent WebView2 event conflicts on Windows.
}
