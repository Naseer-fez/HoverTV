# MVP Definition

## What's IN the MVP

### Browser Extension
- Manifest V3 extension for Chromium browsers
- Extension popup with status display and "Select Video" button
- Click-to-select mode for choosing a video on the page
- YouTube-specific URL extraction
- Generic HTML5 video URL extraction
- Native Messaging to Tauri app
- Play/pause sync while source tab is open
- Auto-launch Tauri app if not running

### Tauri Desktop App
- Frameless transparent window
- Programmatic TV body (HTML/CSS) inspired by reference design
- Two functional knobs: CRT intensity + color temperature
- One power button with on/off animation
- WebGL CRT shader pipeline with: scanlines, curvature, vignette, chromatic aberration, glow, color temperature, noise
- CRT power-on animation (bright line → expand → video)
- CRT power-off animation (shrink → line → dot → off)
- TV static/snow animation for no-signal state
- Always-on-top (toggleable)
- Drag to move, edge/corner resize with aspect ratio lock
- Right-click context menu (always-on-top, volume, CRT effects toggles, open file, quit)
- Local file playback via drag-and-drop and file picker
- Full playback controls for local files (click screen play/pause, seek on hover)
- Independent audio with volume control via context menu
- Dynamic screen aspect ratio matching source video

### Installation
- Tauri .msi installer (registers Native Messaging host)
- Extension .zip for sideloading in developer mode
- README with installation instructions

## What's NOT in the MVP
- DRM content support
- Tab capture fallback
- Multiple TV instances
- Visual knob rotation animation
- Sound effects (power on/off sounds, static hiss)
- State persistence (position, size, settings)
- Auto-update mechanism
- Edge snap behavior
- System tray icon
- Firefox/Safari support
- Multiple TV skins
- Keyboard shortcuts
- Channel switching animation
- Brand text on TV

## Definition of Done (MVP)
The MVP is complete when:
1. A user can install the Tauri app and sideload the extension in Chrome, Edge, or Brave
2. Clicking the extension icon on a YouTube page → selecting a video → video appears in the floating TV with CRT effects within 3 seconds
3. The TV window is frameless, transparent, always-on-top, movable, and resizable
4. CRT power-on animation plays when the TV first receives a video
5. CRT power-off animation plays when the user clicks the power button, followed by app exit
6. Both knobs adjust CRT parameters (intensity and color temperature) with value indicators
7. All CRT effects can be individually toggled via right-click menu
8. Dragging a local .mp4 or .webm file onto the TV plays it with full controls
9. When the source browser tab is closed, the TV continues playing independently
10. When the video source is lost, the TV shows animated static
11. Unit tests pass for URL extraction, Native Messaging protocol, and shader parameters
12. The app runs on Windows 11 with acceptable performance
