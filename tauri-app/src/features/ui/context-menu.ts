import { logInfo } from '../../core/utils/logger';
import {
  invokeToggleAlwaysOnTop,
  invokeGetAlwaysOnTop,
  syncVolumeToBackend,
  invokePowerOff,
  invokeOpenFileDialog,
} from '../../core/ipc/tauri-bridge';
import {
  CRTEffectKey,
  isEffectEnabled,
  setEffectEnabled,
} from '../shader/uniforms';

let menuEl: HTMLElement | null = null;

function hideMenu(): void {
  if (menuEl) {
    menuEl.style.display = 'none';
  }
}

function renderMenuItems(): string {
  const effects: Array<{ key: CRTEffectKey; label: string }> = [
    { key: 'scanlines', label: 'Scanlines' },
    { key: 'curvature', label: 'Screen Curvature' },
    { key: 'vignette', label: 'Vignette' },
    { key: 'chromatic', label: 'Chromatic Aberration' },
    { key: 'glow', label: 'Phosphor Glow' },
    { key: 'noise', label: 'Analog Noise' },
  ];

  const effectsHtml = effects
    .map(
      (e) => `
      <label class="menu-item sub-item">
        <input type="checkbox" data-effect="${e.key}" ${isEffectEnabled(e.key) ? 'checked' : ''} />
        <span>${e.label}</span>
      </label>`
    )
    .join('');

  return `
    <div class="menu-header">📺 HoverTV Menu</div>
    <label class="menu-item" id="menu-always-on-top">
      <input type="checkbox" id="chk-always-on-top" checked />
      <span>Always On Top</span>
    </label>
    <div class="menu-separator"></div>
    <div class="menu-section-label">CRT Effects</div>
    ${effectsHtml}
    <div class="menu-separator"></div>
    <div class="menu-item slider-item">
      <span>Volume</span>
      <input type="range" id="volume-slider" min="0" max="1" step="0.05" value="0.8" />
    </div>
    <div class="menu-separator"></div>
    <div class="menu-item" id="menu-open-file">
      <span>📂 Open Local Video...</span>
    </div>
    <div class="menu-separator"></div>
    <div class="menu-item danger-item" id="menu-quit">
      <span>Power Off & Quit</span>
    </div>
  `;
}

function bindMenuEvents(container: HTMLElement): void {
  const chkAlwaysOnTop = container.querySelector<HTMLInputElement>('#chk-always-on-top');
  chkAlwaysOnTop?.addEventListener('change', async () => {
    const isTop = await invokeToggleAlwaysOnTop();
    chkAlwaysOnTop.checked = isTop;
    logInfo('ui', 'contextMenu', `Toggled always on top: ${isTop}`);
  });

  const effectInputs = container.querySelectorAll<HTMLInputElement>('input[data-effect]');
  effectInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const effect = input.dataset.effect as CRTEffectKey;
      setEffectEnabled(effect, input.checked);
    });
  });

  const volSlider = container.querySelector<HTMLInputElement>('#volume-slider');
  volSlider?.addEventListener('input', () => {
    const val = parseFloat(volSlider.value);
    syncVolumeToBackend(val);
  });

  const openFileBtn = container.querySelector<HTMLElement>('#menu-open-file');
  openFileBtn?.addEventListener('click', async () => {
    logInfo('ui', 'contextMenu', 'User clicked Open File');
    hideMenu();
    await invokeOpenFileDialog();
  });

  const quitBtn = container.querySelector<HTMLElement>('#menu-quit');
  quitBtn?.addEventListener('click', () => {
    logInfo('ui', 'contextMenu', 'User initiated quit');
    invokePowerOff();
  });
}

export function setupContextMenu(tvBody: HTMLElement): void {
  logInfo('ui', 'setupContextMenu', 'Configuring context menu');
  menuEl = document.getElementById('context-menu');
  if (!menuEl) return;

  tvBody.addEventListener('contextmenu', async (e: MouseEvent) => {
    e.preventDefault();
    if (!menuEl) return;

    menuEl.innerHTML = renderMenuItems();
    bindMenuEvents(menuEl);

    const isTop = await invokeGetAlwaysOnTop();
    const chk = menuEl.querySelector<HTMLInputElement>('#chk-always-on-top');
    if (chk) chk.checked = isTop;

    menuEl.style.display = 'block';
    menuEl.style.left = `${Math.min(e.clientX, window.innerWidth - 220)}px`;
    menuEl.style.top = `${Math.min(e.clientY, window.innerHeight - 280)}px`;
  });

  window.addEventListener('click', (e) => {
    if (menuEl && !menuEl.contains(e.target as Node)) {
      hideMenu();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideMenu();
  });
}
