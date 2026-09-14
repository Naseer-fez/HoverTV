import { ExtensionMessage, AppMessage } from './types/messages';
import { logInfo, logWarn, logBoundaryError } from './utils/logger';

const NATIVE_HOST_NAME = 'com.hovertv.host';
let nativePort: chrome.runtime.Port | null = null;
let pipedTabId: number | null = null;

function ensureNativePort(): chrome.runtime.Port {
  if (nativePort) return nativePort;
  logInfo('background', 'ensureNativePort', `Connecting to native host: ${NATIVE_HOST_NAME}`);
  nativePort = chrome.runtime.connectNative(NATIVE_HOST_NAME);

  nativePort.onMessage.addListener(handleNativeMessage);
  nativePort.onDisconnect.addListener(handleNativeDisconnect);
  return nativePort;
}

function handleNativeMessage(msg: AppMessage): void {
  logInfo('background', 'handleNativeMessage', `Received from host: ${JSON.stringify(msg)}`);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {
        // Tab may not have listener, acceptable in dumb pipe
      });
    }
  });
}

function handleNativeDisconnect(): void {
  const err = chrome.runtime.lastError;
  logWarn('background', 'handleNativeDisconnect', `Native port disconnected: ${err?.message || 'No error detail'}`);
  nativePort = null;
}

function sendToNativeHost(message: ExtensionMessage): boolean {
  try {
    const port = ensureNativePort();
    logInfo('background', 'sendToNativeHost', `Relaying message: ${message.type}`);
    port.postMessage(message);
    return true;
  } catch (err) {
    logBoundaryError('background', 'sendToNativeHost', err, 'Failed to post message to native host');
    return false;
  }
}

function setupTabLifecycleListeners(): void {
  logInfo('background', 'setupTabLifecycleListeners', 'Registering tab lifecycle listeners');

  chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === pipedTabId) {
      logInfo('background', 'onTabRemoved', `Piped tab ${tabId} closed, sending SOURCE_LOST`);
      pipedTabId = null;
      sendToNativeHost({ type: 'SOURCE_LOST' });
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabId === pipedTabId && (changeInfo.status === 'loading' || changeInfo.url)) {
      logInfo('background', 'onTabUpdated', `Piped tab ${tabId} navigated away, sending SOURCE_LOST`);
      pipedTabId = null;
      sendToNativeHost({ type: 'SOURCE_LOST' });
    }
  });
}

setupTabLifecycleListeners();

chrome.runtime.onMessage.addListener((request: ExtensionMessage, sender, sendResponse) => {
  logInfo('background', 'onMessage', `Received from script: ${request?.type}`);
  if (request && typeof request === 'object' && 'type' in request) {
    if (request.type === 'PLAY_URL' && sender.tab?.id) {
      pipedTabId = sender.tab.id;
      logInfo('background', 'onMessage', `Tracking active piped tab ID: ${pipedTabId}`);
    }
    const success = sendToNativeHost(request);
    sendResponse({ ok: success });
  } else {
    sendResponse({ ok: false, error: 'Invalid message structure' });
  }
  return true;
});
