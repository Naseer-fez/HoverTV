# Technical Architecture

## System Architecture Overview

HoverTV has three components:
1. **Browser Extension** (TypeScript, Manifest V3) — runs in any Chromium browser
2. **Tauri Desktop Application** (Rust backend + TypeScript/WebGL frontend) — the TV window
3. **Native Messaging Host** — the bridge between extension and app

```text
┌─────────────────────────────────────────────────────────────┐
│                    Chromium Browser                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Extension    │    │  Content     │    │  Service     │  │
│  │  Popup (UI)   │──▶│  Script      │──▶│  Worker      │  │
│  └──────────────┘    │  (per tab)   │    │  (background)│  │
│                       └──────────────┘    └──────┬───────┘  │
└──────────────────────────────────────────────────┼──────────┘
                                                    │ Native Messaging
                                                    │ (stdio JSON)
┌───────────────────────────────────────────────────┼──────────┐
│                     Tauri App                      │          │
│  ┌──────────────────────────────────────────────┐ │          │
│  │              Rust Backend                     │◀┘         │
│  │  - Native Messaging Host                     │           │
│  │  - Window management (frameless, transparent) │           │
│  │  - Always-on-top control                     │           │
│  │  - File dialog / drag-drop handler           │           │
│  │  - IPC to frontend via Tauri commands        │           │
│  └──────────────────┬───────────────────────────┘           │
│                      │ Tauri IPC                             │
│  ┌──────────────────▼───────────────────────────┐           │
│  │           WebView2 Frontend                   │           │
│  │  ┌────────────────────────────────────────┐  │           │
│  │  │         HTML/CSS TV Body               │  │           │
│  │  │  - Programmatic TV frame               │  │           │
│  │  │  - Knobs (CRT intensity, color temp)   │  │           │
│  │  │  - Power button                        │  │           │
│  │  │  - Right-click context menu            │  │           │
│  │  └────────────────────────────────────────┘  │           │
│  │  ┌────────────────────────────────────────┐  │           │
│  │  │      WebGL CRT Renderer                │  │           │
│  │  │  - Video texture input                 │  │           │
│  │  │  - Fragment shader pipeline:           │  │           │
│  │  │    • Barrel distortion (curvature)     │  │           │
│  │  │    • Scanlines                         │  │           │
│  │  │    • Vignette                          │  │           │
│  │  │    • Chromatic aberration              │  │           │
│  │  │    • Glow/bloom                        │  │           │
│  │  │    • Color temperature shift           │  │           │
│  │  │    • Noise/static                      │  │           │
│  │  │  - Parameterized by knob values        │  │           │
│  │  └────────────────────────────────────────┘  │           │
│  │  ┌────────────────────────────────────────┐  │           │
│  │  │      HTML5 Video Player                │  │           │
│  │  │  - Plays extracted URLs                │  │           │
│  │  │  - Plays local files                   │  │           │
│  │  │  - Independent audio with volume       │  │           │
│  │  └────────────────────────────────────────┘  │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Browser Extension Architecture
- Manifest V3 with service worker
- Permissions needed: `activeTab`, `nativeMessaging`, `scripting`
- Content script injection on demand (not persistent)
- Popup UI: minimal HTML with status display and "Select Video" button
- Click-to-select mode: inject a selection overlay that highlights video elements on hover, user clicks to select
- YouTube-specific URL extraction: extract video ID, query YouTube's internal API for stream URLs (similar to yt-dlp)
- Generic HTML5 extraction: read `video.src` or `video.currentSrc` from the DOM
- Native Messaging: send JSON messages to the Tauri app via stdio pipe
- Play/pause sync: content script monitors video events (play, pause) and forwards via Native Messaging

## Native Messaging Protocol
Messages are JSON objects over stdio. Define the protocol:

```typescript
// Extension → App
type ExtensionMessage = 
  | { type: 'PLAY_URL'; url: string; title?: string; source: 'youtube' | 'html5' | 'local' }
  | { type: 'SYNC_STATE'; state: 'play' | 'pause' }
  | { type: 'SOURCE_LOST' }

// App → Extension  
type AppMessage =
  | { type: 'READY' }
  | { type: 'STATUS'; status: 'playing' | 'paused' | 'static' | 'off' }
```

## Tauri Application Architecture
- Rust backend handles:
  - Native Messaging host (reads stdin, writes stdout per Chrome NM protocol)
  - Window creation and management (frameless, transparent, always-on-top)
  - File system access for local video files
  - Drag-and-drop handling
  - IPC bridge between NM messages and the WebView2 frontend
- Frontend handles:
  - TV body rendering (HTML/CSS)
  - WebGL CRT shader pipeline
  - Video playback (HTML5 `<video>`)
  - User interaction (knobs, power button, right-click menu, drag-to-move, edge-resize)
  - CRT power on/off animations
  - TV static animation

## Window Management Details
- Tauri window config: `decorations=false`, `transparent=true`, `always_on_top=true`
- Custom drag: `mousedown` on TV body → invoke Tauri's `start_dragging`
- Custom resize: `mousedown` on edges/corners → invoke Tauri's `start_resize_dragging` with appropriate direction
- Aspect ratio lock: enforce via resize event handler
- Click-through: transparent areas should not receive mouse events
- Hit testing: the WebView2 area defines the hit-test region based on the TV body shape

## WebGL CRT Shader Pipeline
Single-pass fragment shader approach:
1. Render video frame to a texture via `<video>` → canvas → WebGL texture
2. Draw a full-screen quad with the video texture
3. Fragment shader applies all effects in sequence:
   - Input uniforms: `u_intensity` (0.0-1.0, from top knob), `u_temperature` (0.0-1.0, from bottom knob), `u_time` (for animation), `u_resolution`, per-effect toggle booleans
   - Barrel distortion (curvature)
   - Scanline overlay (time-animated for subtle movement)
   - Vignette (darken edges)
   - Chromatic aberration (RGB channel offset)
   - Glow/bloom (bright area bleed)
   - Color temperature matrix multiply
   - Noise/grain (procedural, time-based)
4. Output to screen

## State Machine
The TV has the following states:
```text
OFF → (power on) → POWERING_ON → (animation complete) → STATIC → (receive video) → PLAYING
PLAYING → (video ends/source lost) → STATIC
PLAYING → (power off) → POWERING_OFF → (animation complete) → OFF → (exit app)
STATIC → (receive video) → PLAYING
STATIC → (power off) → POWERING_OFF → (animation complete) → OFF → (exit app)
PLAYING → (receive new video) → PLAYING (replace source)
PLAYING → (local file dropped) → PLAYING (replace source)
STATIC → (local file dropped) → PLAYING
```

## Technology Stack Summary
| Component | Technology |
|---|---|
| Browser Extension | TypeScript, Manifest V3, Chrome APIs |
| Extension Popup | HTML/CSS |
| Native Messaging | Chrome NM API (stdio JSON) |
| Desktop App Backend | Rust, Tauri v2 |
| Desktop App Frontend | TypeScript, HTML/CSS, WebGL |
| Video Player | HTML5 `<video>` element |
| CRT Effects | WebGL 2.0 fragment shaders |
| Window Management | Tauri window API (Rust) |
| Build System | Cargo (Rust) + npm/pnpm (TypeScript) |
| Installer | Tauri bundler (.msi for Windows) |
