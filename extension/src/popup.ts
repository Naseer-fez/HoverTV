import { logInfo, logBoundaryError } from './utils/logger';

function updateStatus(text: string, isError = false): void {
  const el = document.getElementById('status');
  if (el) {
    el.textContent = text;
    el.style.color = isError ? '#ff4d4f' : '#389e0d';
  }
}

async function sendActionToActiveTab(action: string): Promise<void> {
  logInfo('popup', 'sendActionToActiveTab', `Action: ${action}`);
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;
    if (!tabId) {
      updateStatus('No active browser tab found', true);
      return;
    }

    // Ensure content script is injected across all frames
    try {
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ['dist/content.js'],
      });
    } catch {
      // Content script may already be injected, continue
    }

    const response = await chrome.tabs.sendMessage(tabId, { action });
    if (response?.ok) {
      if (response.isBlobFallback) {
        updateStatus('Piped page URL (MSE/blob stream detected)');
      } else {
        updateStatus('Video dispatched to HoverTV!');
      }
    } else {
      updateStatus('No video detected on page', true);
    }
  } catch (err) {
    logBoundaryError('popup', 'sendActionToActiveTab', err, 'Failed to message tab');
    updateStatus('Could not communicate with tab', true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  logInfo('popup', 'init', 'Popup loaded');
  const pipeBtn = document.getElementById('btn-pipe');
  const selectBtn = document.getElementById('btn-select');

  pipeBtn?.addEventListener('click', () => {
    sendActionToActiveTab('PIPE_CURRENT');
  });

  selectBtn?.addEventListener('click', () => {
    sendActionToActiveTab('START_SELECT');
    window.close();
  });
});
