# HoverTV: Product Vision

## Executive Summary
HoverTV is a Windows 11 utility that lets users take a video playing in their Chromium browser (Chrome, Edge, Brave, etc.) and display it inside a small, movable, floating retro CRT television window on their desktop. The TV can also play local video files. It's a non-commercial, MIT-licensed, GitHub-distributed tool for a small audience of tech-savvy users.

## Problem Statement
Users who want to watch video content (tutorials, streams, music videos, conference calls) while working in other applications have limited options:
- **Picture-in-Picture** is basic, non-customizable, and lacks personality.
- **Browser-based solutions** are tied to browser windows.
- **Existing floating video players** require re-authentication or separate logins.

HoverTV solves this by providing a delightful, retro-themed floating video companion that leverages the user's existing browser session.

## Product Vision
The TV should feel like a physical CRT television placed on the user's desktop. It's not a video player with a TV skin — it's a TV that happens to receive its signal from the browser. The experience should be:
- **Nostalgic and satisfying** (CRT power-on animation, scanlines, curvature, warm color tones)
- **Lightweight and unobtrusive** (floats above other windows, small footprint)
- **Simple** (one-click from browser to TV)
- **Independent** (plays without needing the browser tab open, for non-DRM content)

## Target Users
- Developers and knowledge workers who watch tutorials/documentation videos while coding
- Users who watch streams/music while working
- Tech-savvy users who appreciate retro aesthetics
- People in video calls who want to watch content on the side
- Small audience, GitHub-distributed, developer mode extension sideloading is acceptable

## Core Use Cases
1. **Ambient Companion**: User watches a YouTube tutorial in a corner TV while coding. Sessions 5-60 min.
2. **Extended Viewing**: User watches a full stream or long video while multitasking. Sessions can be hours.
3. **Local File Viewing**: User drags a downloaded video onto the TV to watch locally.
4. **Quick Glance**: User sends a short video to the TV during a Zoom meeting.

## Product Philosophy
- **Function first → Visual fidelity second → Polish third**
- **Optimize for the desired product experience, not implementation convenience**
- **The TV body and controls are built programmatically** (HTML/CSS/Canvas/WebGL), not from a static image
- **The reference SVG at `src/image.svg` is visual inspiration only**, not the exact design

## Key Design Decisions

The following requirements and decisions guide the architecture and feature set of HoverTV.

### Status Legend
- ✅ **DECIDED** — confirmed by stakeholder
- 🔮 **FUTURE** — deferred to post-MVP
- ⚠️ **RISK** — identified technical risk

### Decided Requirements Summary

| # | Area | Decision | Status |
|---|---|---|---|
| 1 | Use Case | Dual-purpose: ambient companion + extended viewing | ✅ |
| 2 | Audience | Small audience, GitHub-distributed, non-commercial, MIT license | ✅ |
| 3 | Control Model | Themed controls affecting TV only (not browser). Top knob = CRT intensity, Bottom knob = CRT color temperature | ✅ |
| 4 | Playback Model | Hybrid: Independent playback for non-DRM (URL extraction), tab-mirrored for DRM (future). Sync play/pause with browser when tab open, independent when tab gone | ✅ |
| 5 | Browser Support | Any Chromium browser (Chrome, Edge, Brave, etc.) | ✅ |
| 6 | TV Construction | Built programmatically in code (HTML/CSS/Canvas/WebGL), SVG as reference only | ✅ |
| 7 | Video Sources (MVP) | YouTube + standard HTML5 video + local files (MP4 H.264/H.265, WebM VP8/VP9) | ✅ |
| 8 | Window Size | No fixed limits, aspect-ratio locked, freely scalable | ✅ |
| 9 | Invocation | Extension button → popup → click-to-select video on page | ✅ |
| 10 | Instances | Single TV instance, video replaced on re-invocation | ✅ |
| 11 | Always-on-top | Always-on-top by default, toggleable via right-click menu | ✅ |
| 12 | Audio | TV has independent audio. Browser audio unaffected. Volume via right-click menu only | ✅ |
| 13 | Power Animation | CRT power-on/off animation is P0 (must-have for MVP) | ✅ |
| 14 | Window Frame | Frameless/transparent — TV body IS the window, no title bar | ✅ |
| 15 | Taskbar | Taskbar only, close = exit, no system tray | ✅ |
| 16 | CRT Effects | Configurable via knobs: intensity (top) and color temperature (bottom). All effects individually toggleable via right-click settings | ✅ |
| 17 | Settings | Right-click context menu | ✅ |
| 18 | Signal Loss | Show animated TV static/snow. TV stays open | ✅ |
| 19 | State Persistence | None — fresh start every launch | ✅ |
| 20 | Framework | Tauri (Rust backend + WebView2 frontend) | ✅ |
| 21 | Video Transport | URL extraction + Native Messaging for MVP | ✅ |
| 22 | Extension | Manifest V3, always-visible popup with status | ✅ |
| 23 | Video Quality | Match source quality (no cap) | ✅ |
| 24 | Language | TypeScript for both extension and Tauri frontend | ✅ |
| 25 | Multi-Monitor | Fully multi-monitor aware with per-monitor DPI | ✅ |
| 26 | Performance | No hard limits, optimize for minimal resource use | ✅ |
| 27 | Windows Version | Windows 11 only | ✅ |
| 28 | Local Files | Drag-and-drop + file picker. Full playback controls (play/pause click screen, seek) | ✅ |
| 29 | Privacy | Zero data collection, no analytics, no telemetry | ✅ |
| 30 | Distribution | GitHub Releases: Tauri .msi installer + extension .zip | ✅ |
| 31 | Updates | No update mechanism — manual download | ✅ |
| 32 | Snap | No edge snap, free positioning | ✅ |
| 33 | Close | Power button (with animation) + right-click Quit | ✅ |
| 34 | Knobs | Static (no visual rotation), show value indicator on interaction | ✅ |
| 35 | Controls | Minimal: 2 knobs + 1 power button only | ✅ |
| 36 | Resize | Drag any edge or corner, locked aspect ratio | ✅ |
| 37 | Screen Aspect | Dynamic — matches source video aspect ratio. TV body adapts | ✅ |
| 38 | Brand | No brand text on TV body | ✅ |
| 39 | App Launch | Extension auto-launches Tauri app via Native Messaging | ✅ |
| 40 | No-video UX | Extension popup always shows status ("No video", "Video found", "Cannot capture") | ✅ |
| 41 | YouTube Extraction | YouTube-specific API patterns (similar to yt-dlp approach) | ✅ |
| 42 | CRT Rendering | WebGL shaders (video as texture, fragment shader for effects) | ✅ |
| 43 | Dev Approach | Vertical slice first — prove end-to-end pipeline before polish | ✅ |
| 44 | Extension Popup | Minimal/clean — no retro styling, just status + button | ✅ |
| 45 | Testing | Unit tests for core logic only (URL extraction, messaging, shader params) | ✅ |
| 46 | Name | HoverTV | ✅ |

### DRM Content (BLOCKED for MVP) ⚠️
- DRM-protected content (Netflix, Disney+, etc.) is explicitly **out of scope for MVP**.
- Browser DRM (Widevine/PlayReady) prevents URL extraction and screen capture for protected content.
- **Future approach (🔮)**: DXGI Desktop Duplication API (native Windows capture) as a v2 feature.
- **For MVP**: the app cleanly reports "this content cannot be captured" rather than showing black or crashing.
