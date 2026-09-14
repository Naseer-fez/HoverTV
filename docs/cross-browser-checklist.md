# 🌐 HoverTV Cross-Browser Verification Checklist

This document provides the testing and verification checklist across all supported Chromium-based browsers: **Google Chrome**, **Microsoft Edge**, and **Brave**.

---

## 1. Environment & Registration Prerequisite Check

Before testing, verify that the Native Messaging host is registered in the Windows Registry for the target browser:

| Browser | Expected Registry Key (HKCU) | Status |
| :--- | :--- | :--- |
| **Google Chrome** | `HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.hovertv.host` | `[ ] Verified` |
| **Microsoft Edge** | `HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.hovertv.host` | `[ ] Verified` |
| **Brave** | `HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.hovertv.host` | `[ ] Verified` |

### Quick Registry Verification Command:
```powershell
Get-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.hovertv.host" -ErrorAction SilentlyContinue
Get-ItemProperty -Path "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.hovertv.host" -ErrorAction SilentlyContinue
Get-ItemProperty -Path "HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.hovertv.host" -ErrorAction SilentlyContinue
```

---

## 2. Browser Verification Matrix

Execute this checklist against each browser:

### A. Extension Loading & Lifecycle
- [ ] **Unpacked Extension Load**:
  - Extension loads into browser with zero manifest errors or warnings.
  - Extension icon appears in browser extensions toolbar.
- [ ] **Popup UI**:
  - Clicking toolbar icon opens 240px retro-styled popup.
  - Displays "📺 HoverTV Companion", "Send Video to HoverTV" button, and "Select Video Element" button.
- [ ] **Native Messaging Port Lifecycle**:
  - Opening the popup or piping a video triggers native host process connection without error dialog.
  - Closing the browser gracefully disconnects the native port.

### B. YouTube Video Extraction
- [ ] **Standard Video (`/watch?v=...`)**:
  - Navigate to standard YouTube video.
  - Click popup -> "Send Video to HoverTV".
  - HoverTV powers on, CRT animation triggers, and video begins playback.
- [ ] **YouTube Shorts (`/shorts/...`)**:
  - Navigate to a YouTube Shorts video.
  - Click "Send Video to HoverTV".
  - Video URL is normalized to `/watch?v=...` and plays on HoverTV.
- [ ] **Playlist URLs (`/watch?v=...&list=...`)**:
  - Current video ID is accurately isolated and played without loop/playlist confusion.

### C. Generic HTML5 Video Extraction
- [ ] **Direct `<video src="...">` Extraction**:
  - Test on video-hosting page with standard HTML5 video tag.
  - Video pipes accurately with correct title.
- [ ] **Nested `<video><source src="...">` Extraction**:
  - Prefers `.mp4` or `.webm` source element over unknown MIME types.
- [ ] **Shadow DOM Traversal (Depth 1-3)**:
  - Custom web components containing nested shadow root video elements are discovered.
- [ ] **MSE / Blob Stream Fallback**:
  - Pages utilizing MediaSource Extensions (MSE) with `blob:` URLs gracefully fall back to piping the host page URL.

### D. Multi-Video Pages ("Click-to-Select" Mode)
- [ ] **Activation**:
  - Click "Select Video Element" in the extension popup.
  - Amber highlight overlays appear on all detected video elements on page.
- [ ] **Selection**:
  - Clicking any highlighted video pipes that specific video to HoverTV.
  - Overlays immediately disappear.
- [ ] **Cancellation via Escape**:
  - Pressing `Escape` cancels selection mode and clears overlays without errors.

### E. Play / Pause State Synchronization
- [ ] **Browser Play -> Desktop Play**:
  - Pausing video in browser sends `SYNC_STATE: pause` to HoverTV.
  - Resuming video in browser sends `SYNC_STATE: play` to HoverTV.
- [ ] **Tab Lifecycle Handling**:
  - Closing the active piped tab sends `SOURCE_LOST` -> HoverTV returns to static.
  - Navigating the active piped tab away to another URL sends `SOURCE_LOST` -> HoverTV returns to static.

---

## 3. Browser-Specific Nuances & Known Caveats

### Google Chrome
- Strict Manifest V3 service worker lifecycle:
  - If service worker suspends after 30 seconds of inactivity, subsequent popup actions automatically re-awaken it and establish a fresh Native Messaging port.

### Microsoft Edge
- Native Messaging host key is stored under `HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\`.
- Ensure Edge Developer Tools for Extensions is enabled if inspecting background service workers.

### Brave Browser
- **Brave Shields**: Aggressive tracker blocking in Brave may occasionally intercept third-party video element hooks or autoplay permissions.
- Ensure Shields are set to standard mode if a specific video host player fails to start playback.
- Native Messaging registry key is stored under `HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\`.
