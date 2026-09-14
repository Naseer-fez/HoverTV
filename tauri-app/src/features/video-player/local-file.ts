import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { convertFileSrc } from '@tauri-apps/api/core';
import { logInfo, logBoundaryError } from '../../core/utils/logger';
import { dispatch } from '../tv-state/store';
import { playUrl, getCurrentSourceUrl } from './player';

interface LocalFilePayload {
  path: string;
  title: string;
}

let activeIsLocal = false;

export function isLocalSource(): boolean {
  return activeIsLocal || getCurrentSourceUrl().startsWith('asset://') || getCurrentSourceUrl().includes('localhost');
}

export function handleLocalFileLoaded(payload: LocalFilePayload): void {
  try {
    logInfo('local-file', 'handleLocalFileLoaded', `Converting local path: ${payload.path}`);
    const assetUrl = convertFileSrc(payload.path);
    activeIsLocal = true;

    dispatch({
      type: 'RECEIVE_VIDEO',
      url: assetUrl,
      title: payload.title,
      source: 'local',
    });

    playUrl(assetUrl, 'local');
    logInfo('local-file', 'handleLocalFileLoaded', `Playing local asset: ${assetUrl}`);
  } catch (err) {
    logBoundaryError('local-file', 'handleLocalFileLoaded', err, 'Failed loading local file');
  }
}

export async function initLocalFileListener(): Promise<UnlistenFn> {
  logInfo('local-file', 'initLocalFileListener', 'Subscribing to local-file-opened events');
  return await listen<LocalFilePayload>('local-file-opened', (event) => {
    handleLocalFileLoaded(event.payload);
  });
}
