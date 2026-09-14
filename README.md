# 📺 HoverTV

**HoverTV** is a retro CRT desktop video companion application. It renders video playback through an authentic WebGL2 cathode-ray tube shader simulation—complete with phosphor glow, scanlines, barrel distortion curvature, chromatic aberration, analog static noise, and rotary dial controls.

Pipe YouTube or HTML5 videos directly from Chrome, Edge, or Brave into your floating desktop TV, or drag-and-drop local `.mp4` and `.webm` files directly onto the display.

---

## Architecture Overview

HoverTV strictly enforces a tripartite architectural boundary:

```
┌─────────────────────────────────┐
│ Browser Extension (MV3)         │  Dumb pipe: Detects HTML5 & YouTube videos,
│ Chrome / Edge / Brave           │  forwards URL & playback state over stdio.
└────────────────┬────────────────┘
                 │ Chrome Native Messaging (JSON over stdio)
┌────────────────▼────────────────┐
│ Tauri Rust Backend              │  OS State: Window geometry, always-on-top,
│ (tauri-app/src-tauri)           │  native file picker dialogs, stdio listener.
└────────────────┬────────────────┘
                 │ Tauri IPC Events
┌────────────────▼────────────────┐
│ WebView2 Frontend               │  Brain & Renderer: Pure TV state machine,
│ (tauri-app/src)                 │  WebGL2 CRT shader pipeline, rotary knobs.
└─────────────────────────────────┘
```

- **Browser Extension**: A lightweight Manifest V3 extension. Detects video streams, forwards URLs to the desktop host, and tracks play/pause sync.
- **Rust Backend**: Handles OS integration, window dragging, transparency, always-on-top toggling, local file validation, and Chrome Native Messaging stdio framing.
- **Frontend**: Single-page application hosting a WebGL2 rendering pipeline with custom vertex and fragment CRT shaders, rotary knob controls, and a deterministic TV state machine (`OFF` → `POWERING_ON` → `STATIC` / `PLAYING` → `POWERING_OFF`).

---

## Features

- **Authentic CRT Simulation**:
  - Configurable barrel curvature distortion.
  - Multi-phase CRT turn-on and turn-off beam animations.
  - Scanline generator with high-frequency roll.
  - Phosphor bloom & glow pass.
  - Chromatic aberration and analog static RF noise.
  - Color temperature dial: warm amber (< 50%) to cool cathode blue (> 50%).
- **Desktop Companion UI**:
  - Borderless, transparent, draggable retro wooden housing.
  - Interactive rotary knobs (drag or mouse wheel to adjust intensity & temperature).
  - Context menu for individual shader toggles, volume, always-on-top, and local file picker.
  - Dynamic aspect ratio adjustment matching source video (4:3, 16:9, ultrawide).
  - OSD seek bar for local video files.
- **Seamless Browser Integration**:
  - One-click piping from YouTube (regular videos and Shorts).
  - Generic HTML5 `<video>` tag extraction, including Shadow DOM traversal.
  - "Click-to-Select" mode for pages with multiple embedded videos.
  - Synchronized play/pause controls.

---

## Installation & Setup

### 1. Install Desktop Application
Build or install the standalone Windows installer:
- Run the installer generated from `scripts/build-release.ps1` (`.msi` or `.exe`).
- Launch **HoverTV** from the Start Menu or installation folder.

### 2. Install the Browser Extension
The extension is compatible with **Google Chrome**, **Microsoft Edge**, and **Brave**:
1. Run `scripts/package-extension.ps1` to produce `extension/hovertv-extension-v0.1.0.zip` (or use the unzipped `extension` directory).
2. Open your browser's extension management page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Toggle on **Developer mode** (top-right switch).
4. Click **Load unpacked** and select the `extension` directory (or extract the packaged zip and select that folder).

### 3. Register Native Messaging Host
Register the Native Messaging host manifest with your browser:
```powershell
# In PowerShell (run from repository root):
powershell -ExecutionPolicy Bypass -File scripts\register-nm-host.ps1
```
*Note: If you want to pin a specific Extension ID instead of the default wildcard, pass `-ExtensionId <YOUR_EXTENSION_ID>`.*

---

## Usage

1. **Browser Video Piping**:
   - Navigate to any page playing video (e.g., YouTube).
   - Click the **HoverTV Companion** icon in your browser toolbar.
   - Click **Send Video to HoverTV** (or click **Select Video Element** to choose an embedded player).
   - HoverTV turns on, plays the CRT beam animation, and renders your video with authentic CRT effects.
2. **Local Video Playback**:
   - Drag and drop any `.mp4` or `.webm` video directly onto the TV screen.
   - Or right-click the TV body and select **Open Local Video...**
3. **Controls & Tweaks**:
   - **Intensity Knob**: Rotate to adjust CRT scanline and distortion strength.
   - **Temperature Knob**: Rotate left for vintage warm amber; rotate right for cool phosphor blue.
   - **Right-Click**: Access the context menu to toggle individual CRT effects, volume, and always-on-top.

---

## Developer Guide

### Prerequisites
- Node.js 18+ and `pnpm`
- Rust toolchain (`cargo`, `rustc`)
- Portable MSVC toolchain / C++ build environment

### Running in Development
```powershell
# 1. Install dependencies
cd tauri-app && pnpm install
cd ../extension && pnpm install

# 2. Build the extension
cd ../extension && pnpm run build

# 3. Launch the desktop app in dev mode
cd ../tauri-app && pnpm tauri dev
```

### Running Automated Tests
```powershell
# Extension unit tests
cd extension && pnpm test

# Frontend unit tests
cd tauri-app && pnpm test

# Rust backend unit tests
cd tauri-app/src-tauri && cargo test
```

### Building for Release
```powershell
# Package extension into distributable .zip
powershell -File scripts\package-extension.ps1

# Build Windows desktop installer (.msi)
powershell -File scripts\build-release.ps1 -BundleType msi
```

---

## Uninstallation

To cleanly unregister Native Messaging host entries from the Windows Registry:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\unregister-nm-host.ps1
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Shaik Naseer John Ahmed.
