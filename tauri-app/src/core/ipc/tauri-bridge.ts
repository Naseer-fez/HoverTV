import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { ExtensionMessage } from '../../types/messages';
import { logInfo, logBoundaryError } from '../utils/logger';
import { dispatch } from '../../features/tv-state/store';
import { playUrl, syncPlaybackState, setPlayerVolume } from '../../features/video-player/player';

export async function setupIpcListeners(): Promise<UnlistenFn> {
  logInfo('ipc', 'setupIpcListeners', 'Subscribing to native messaging events');
  return await listen<ExtensionMessage>('nm-message', (event) => {
    handleExtensionMessage(event.payload);
  });
}

function handleExtensionMessage(msg: ExtensionMessage): void {
  try {
    logInfo('ipc', 'handleExtensionMessage', `Handling IPC message: ${msg.type}`);
    switch (msg.type) {
      case 'PLAY_URL':
        import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
          const win = getCurrentWindow();
          win.unminimize().catch(() => {});
          win.show().catch(() => {});
          win.setFocus().catch(() => {});
        });
        dispatch({ type: 'RECEIVE_VIDEO', url: msg.url, title: msg.title, source: msg.source });
        playUrl(msg.url, msg.source);
        break;
      case 'SYNC_STATE':
        syncPlaybackState(msg.state);
        break;
      case 'SOURCE_LOST':
        dispatch({ type: 'SOURCE_LOST' });
        break;
    }
  } catch (err) {
    logBoundaryError('ipc', 'handleExtensionMessage', err, 'Failed processing NM message');
  }
}

export async function invokeToggleAlwaysOnTop(): Promise<boolean> {
  logInfo('ipc', 'invokeToggleAlwaysOnTop', 'Requesting always-on-top toggle from Rust');
  try {
    return await invoke<boolean>('toggle_always_on_top');
  } catch (err) {
    logBoundaryError('ipc', 'invokeToggleAlwaysOnTop', err);
    return true;
  }
}

export async function invokeGetAlwaysOnTop(): Promise<boolean> {
  try {
    return await invoke<boolean>('get_always_on_top');
  } catch (err) {
    logBoundaryError('ipc', 'invokeGetAlwaysOnTop', err);
    return true;
  }
}

export async function syncVolumeToBackend(volume: number): Promise<void> {
  setPlayerVolume(volume);
  try {
    await invoke('set_volume', { level: volume });
  } catch (err) {
    logBoundaryError('ipc', 'syncVolumeToBackend', err);
  }
}

export async function invokeCloseWindow(): Promise<void> {
  logInfo('ipc', 'invokeCloseWindow', 'Requesting window close from Rust');
  try {
    await invoke('close_tv_window');
  } catch (err) {
    logBoundaryError('ipc', 'invokeCloseWindow', err);
  }
}

export async function invokePowerOff(): Promise<void> {
  logInfo('ipc', 'invokePowerOff', 'Powering off and exiting application');
  try {
    await invoke('set_power_state', { powerOn: false });
    await invoke('exit_app');
  } catch (err) {
    logBoundaryError('ipc', 'invokePowerOff', err);
    try {
      await invoke('close_tv_window');
    } catch {
      // Fallback
    }
  }
}

export async function invokeOpenFileDialog(): Promise<string | null> {
  logInfo('ipc', 'invokeOpenFileDialog', 'Opening native file dialog from backend');
  try {
    return await invoke<string | null>('open_file_dialog');
  } catch (err) {
    logBoundaryError('ipc', 'invokeOpenFileDialog', err, 'Failed to open file dialog');
    return null;
  }
}
