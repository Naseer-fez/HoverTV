# Functional and Non-Functional Requirements

## Functional Requirements

### Browser Extension
- **FR-EXT-001**: Chromium Manifest V3 extension compatible with Chrome, Edge, Brave, and other Chromium browsers
- **FR-EXT-002**: Extension popup always shows current status: "No video detected", "Video found — click to send", or "Video cannot be captured"
- **FR-EXT-003**: After clicking "Send to TV" in popup, page enters click-to-select mode — user clicks directly on the video element they want
- **FR-EXT-004**: Extension extracts video source URL from the selected video element
- **FR-EXT-005**: For YouTube, use YouTube-specific API patterns to extract direct video stream URL (DASH/HLS manifest)
- **FR-EXT-006**: For standard HTML5 video, extract the video element's `src` or `currentSrc` attribute
- **FR-EXT-007**: Send extracted video URL to Tauri app via Chrome Native Messaging API
- **FR-EXT-008**: If Tauri app is not running, Native Messaging auto-launches it
- **FR-EXT-009**: While the source tab is open, monitor video play/pause events and forward them to the Tauri app (sync when possible)
- **FR-EXT-010**: If the source tab navigates away or closes, stop sending events (TV continues independently)
- **FR-EXT-011**: Match source video quality — extract the same quality level the user has selected
- **FR-EXT-012**: Extension popup is minimal: HoverTV icon, status text, "Select Video" button. No retro styling.

### Tauri Desktop Application
- **FR-APP-001**: Frameless, transparent window — no title bar, no Windows chrome. The TV body IS the window shape.
- **FR-APP-002**: Click-through on transparent areas around the TV shape
- **FR-APP-003**: Drag to move by grabbing the TV body (any non-control area)
- **FR-APP-004**: Resize by dragging any edge or corner. Aspect ratio locked.
- **FR-APP-005**: Always-on-top by default. Toggleable via right-click menu.
- **FR-APP-006**: Appears in Windows taskbar. Close = exit the application entirely.
- **FR-APP-007**: Multi-monitor aware with per-monitor DPI scaling support
- **FR-APP-008**: No edge snap behavior. Free positioning.
- **FR-APP-009**: No state persistence — default position, size, and settings on every launch
- **FR-APP-010**: Right-click context menu with: Always-on-top toggle, Volume slider, CRT Effects submenu (individual effect toggles), About, Quit
- **FR-APP-011**: Accept video URL via Native Messaging from browser extension
- **FR-APP-012**: Accept local video files via drag-and-drop (from File Explorer onto TV window)
- **FR-APP-013**: Accept local video files via file picker (accessible from right-click menu "Open File...")
- **FR-APP-014**: Supported local formats: MP4 (H.264, H.265/HEVC), WebM (VP8, VP9)
- **FR-APP-015**: Windows 11 only

### Video Playback
- **FR-VID-001**: Play video from extracted URL in WebView2 HTML5 video player
- **FR-VID-002**: Play local video files in the same player
- **FR-VID-003**: Independent audio — TV has its own volume, browser audio unaffected
- **FR-VID-004**: Volume controlled via right-click context menu slider only
- **FR-VID-005**: For browser videos: sync play/pause with browser while source tab is open. Play independently when tab is gone.
- **FR-VID-006**: For local files: full playback controls — click screen to play/pause, seek bar (hidden, shown on hover), volume
- **FR-VID-007**: Single TV instance — sending a new video replaces the current one
- **FR-VID-008**: When video source is lost (tab closes, video ends, connection drops): show animated TV static/snow
- **FR-VID-009**: Screen aspect ratio dynamically matches source video aspect. TV body adapts around the screen.
- **FR-VID-010**: Match source video quality (no artificial resolution cap)

### TV Visual Design
- **FR-TV-001**: TV body built programmatically in HTML/CSS/Canvas/WebGL. Reference SVG (`src/image.svg`) is inspiration only.
- **FR-TV-002**: Visual style: vintage CRT television — brown/wood-grain body, thick bezel, rounded screen, right-side control panel
- **FR-TV-003**: No brand text on TV body (brand plate area is decorative)
- **FR-TV-004**: Minimal physical controls: 2 rotary knobs + 1 power button
- **FR-TV-005**: Top knob = CRT effect intensity (0-100%). Static visual, shows value indicator on interaction.
- **FR-TV-006**: Bottom knob = CRT color temperature (warm amber ↔ cool blue). Static visual, shows value indicator.
- **FR-TV-007**: Power button = toggle TV on/off (with CRT power animation). Off = close/exit the app.
- **FR-TV-008**: Knob interaction: click and drag (or scroll while hovering) to adjust value. Knobs don't visually rotate.

### CRT Effects
- **FR-CRT-001**: Rendered via WebGL fragment shaders. Video is a texture on a quad.
- **FR-CRT-002**: All effects individually toggleable via right-click CRT Effects submenu
- **FR-CRT-003**: Master intensity controlled by top knob (0% = clean video, 100% = full retro)
- **FR-CRT-004**: Color temperature controlled by bottom knob
- **FR-CRT-005**: Effects include: scanlines, barrel distortion/curvature, vignette, chromatic aberration, glow/bloom, noise/static
- **FR-CRT-006**: Animated TV static/snow for "no signal" state
- **FR-CRT-007**: CRT power-on animation: bright horizontal line → screen expands → video appears (P0, must-have for MVP)
- **FR-CRT-008**: CRT power-off animation: video shrinks to horizontal line → dot → off (P0, must-have for MVP)

## Non-Functional Requirements

- **NFR-001**: Performance — Optimize for minimal CPU/GPU usage. Should be lighter than a browser tab playing the same video.
- **NFR-002**: Privacy — Zero data collection, no analytics, no telemetry. No network calls except to fetch the video stream.
- **NFR-003**: Security — Extension requests only the minimum permissions needed. No browsing history, no cookies beyond video URL extraction.
- **NFR-004**: Distribution — GitHub Releases with two downloads: Tauri `.msi` installer + extension `.zip`
- **NFR-005**: Updates — No automatic update mechanism. Users manually download new releases.
- **NFR-006**: License — MIT
- **NFR-007**: Testing — Unit tests for core logic: URL extraction, Native Messaging protocol, CRT shader parameters
- **NFR-008**: Accessibility — Not a primary concern for MVP (the retro TV metaphor inherently limits accessibility)
- **NFR-009**: Startup time — TV window should appear within 2 seconds of receiving a video URL
- **NFR-010**: Memory — Target < 100MB RAM during video playback
