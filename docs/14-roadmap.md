# Development Roadmap

## Phase 0: Technical Investigation (1-2 days)
- Research YouTube URL extraction in browser extension context
- Research Tauri v2 frameless transparent window capabilities
- Research WebGL CRT shaders (find reference implementations)
- Research Native Messaging setup and protocol
- Research DASH stream handling in HTML5 video
- Document findings and update risk register

## Phase 1: Vertical Slice — End-to-End Proof of Concept (3-5 days)
Goal: Prove the entire pipeline works, even if ugly.
- Minimal browser extension that extracts a YouTube video URL
- Native Messaging connection to Tauri app
- Tauri app with a basic window that plays the received video
- No CRT effects, no TV frame, no transparency
- Just: browser → extension → NM → Tauri → video plays

**Acceptance**: A YouTube video selected in Chrome plays in a Tauri window.

## Phase 2: Floating TV Window (2-3 days)
Goal: Make the window behave like a TV.
- Frameless transparent window
- Drag to move, resize with aspect ratio lock
- Always-on-top
- Basic TV body frame (HTML/CSS, rough design)
- No CRT effects yet

**Acceptance**: Video plays in a frameless, movable, resizable, always-on-top window with a basic TV frame.

## Phase 3: WebGL CRT Effects (3-4 days)
Goal: Add the retro TV visual magic.
- WebGL pipeline: video → texture → shader → screen
- Implement CRT fragment shader (scanlines, curvature, vignette, chromatic aberration, glow, color temperature, noise)
- Wire up the two knobs (intensity, color temperature)
- Add right-click menu with effect toggles

**Acceptance**: Video renders with adjustable CRT effects. Knobs work. Effects are individually toggleable.

## Phase 4: CRT Animations & Static (2-3 days)
Goal: Add the power on/off animations and static screen.
- Power-on animation (line → expand → video)
- Power-off animation (shrink → line → dot → off)
- TV static/snow shader for no-signal state
- State machine implementation (OFF, POWERING_ON, STATIC, PLAYING, POWERING_OFF)
- Power button wired to animation → exit

**Acceptance**: Power button triggers off animation then exits. New video triggers on animation. Lost signal shows static.

## Phase 5: TV Body Polish (2-3 days)
Goal: Make the TV look like a real retro TV.
- Detailed TV body design (wood grain, bezel, control panel)
- Knob styling (plastic look, indicator dots)
- Power button styling
- Glass reflection overlay on screen
- Dynamic screen aspect ratio

**Acceptance**: TV looks convincingly retro and matches the spirit of the reference design.

## Phase 6: Local File Support (1-2 days)
Goal: Play local video files.
- Drag-and-drop handler
- File picker (right-click → Open File)
- Full playback controls for local files (click-to-play/pause, seek bar)
- Format validation (MP4, WebM)

**Acceptance**: Dragging an MP4 onto the TV plays it with controls.

## Phase 7: Generic HTML5 Video Support (1-2 days)
Goal: Support non-YouTube HTML5 videos.
- Generic video element extraction in content script
- Handle various src formats (direct URL, source elements)
- Handle blob: URLs gracefully (report "cannot capture")

**Acceptance**: Extension works on standard HTML5 video pages.

## Phase 8: Browser Sync & Edge Cases (1-2 days)
Goal: Sync play/pause and handle all edge cases.
- Play/pause event monitoring in content script
- Forward sync events via Native Messaging
- Handle tab close (TV continues independently)
- Handle video end (show static)
- Handle multiple videos on page (click-to-select)

**Acceptance**: Pausing in browser pauses in TV (while tab open). Closing tab doesn't crash TV.

## Phase 9: Packaging & Distribution (1-2 days)
Goal: Create installable packages.
- Tauri .msi bundle with Native Messaging host registration
- Extension .zip package
- README with installation guide
- MIT license file
- GitHub Release

**Acceptance**: A new user can install from GitHub Release and use HoverTV.

## Phase 10: Testing & Stabilization (2-3 days)
Goal: Unit tests and bug fixes.
- Unit tests for URL extraction
- Unit tests for NM protocol
- Unit tests for shader params
- Manual testing across Chrome, Edge, Brave
- Performance profiling
- Bug fixes

**Acceptance**: All tests pass. No known critical bugs.

## Total Estimated MVP Duration: 18-30 days

## Future Roadmap (Post-MVP)
| Priority | Feature |
|---|---|
| P1 | Tab capture fallback for DRM content |
| P1 | Keyboard shortcuts (show/hide TV, volume up/down) |
| P1 | Visual knob rotation animation |
| P2 | State persistence (position, size, settings) |
| P2 | Sound effects (power on/off, static hiss) |
| P2 | System tray icon |
| P2 | Channel switching animation between video sources |
| P2 | Auto-mute browser tab option in extension |
| P3 | Multiple TV instances |
| P3 | Multiple TV skins |
| P3 | Firefox extension port |
| P3 | DXGI Desktop Duplication for DRM capture |
| P3 | Video playlist / queue |
