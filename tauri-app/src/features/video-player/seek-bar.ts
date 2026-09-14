import { logInfo } from '../../core/utils/logger';
import { togglePlayPause } from './player';
import { isLocalSource } from './local-file';

let seekBarContainer: HTMLElement | null = null;
let fillElement: HTMLElement | null = null;
let timeElement: HTMLElement | null = null;
let boundVideo: HTMLVideoElement | null = null;

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateProgress(current: number, duration: number): number {
  if (!duration || isNaN(duration) || duration <= 0) return 0;
  return Math.max(0, Math.min(1, current / duration));
}

function updateProgressDisplay(): void {
  if (!boundVideo || !fillElement || !timeElement) return;
  const progress = calculateProgress(boundVideo.currentTime, boundVideo.duration);
  fillElement.style.width = `${(progress * 100).toFixed(1)}%`;
  timeElement.textContent = `${formatTime(boundVideo.currentTime)} / ${formatTime(boundVideo.duration)}`;
}

function handleSeekEvent(e: MouseEvent, track: HTMLElement): void {
  if (!boundVideo || !boundVideo.duration) return;
  const rect = track.getBoundingClientRect();
  const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
  const ratio = clickX / rect.width;
  boundVideo.currentTime = ratio * boundVideo.duration;
  logInfo('seek-bar', 'handleSeekEvent', `Seeked to ${(ratio * 100).toFixed(1)}%`);
  updateProgressDisplay();
}

function createSeekBarDOM(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'seek-bar-container';
  container.innerHTML = `
    <div class="seek-bar-track">
      <div class="seek-bar-fill"></div>
    </div>
    <div class="seek-bar-time">00:00 / 00:00</div>
  `;
  return container;
}

export function initSeekBar(screenHousing: HTMLElement, video: HTMLVideoElement): void {
  logInfo('seek-bar', 'initSeekBar', 'Initializing on-screen controls and seek bar');
  boundVideo = video;
  seekBarContainer = createSeekBarDOM();
  screenHousing.appendChild(seekBarContainer);

  fillElement = seekBarContainer.querySelector('.seek-bar-fill');
  timeElement = seekBarContainer.querySelector('.seek-bar-time');
  const track = seekBarContainer.querySelector('.seek-bar-track') as HTMLElement;

  let isDragging = false;
  track.addEventListener('mousedown', (e) => {
    isDragging = true;
    handleSeekEvent(e, track);
  });
  window.addEventListener('mousemove', (e) => {
    if (isDragging) handleSeekEvent(e, track);
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  video.addEventListener('timeupdate', () => {
    if (!isDragging && isLocalSource()) updateProgressDisplay();
  });

  screenHousing.addEventListener('click', (e) => {
    if (isLocalSource() && !seekBarContainer?.contains(e.target as Node)) {
      logInfo('seek-bar', 'screenClick', 'Toggling local video playback on screen click');
      togglePlayPause();
    }
  });
}
