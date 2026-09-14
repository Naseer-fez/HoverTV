# Video Pipeline Architecture

Describe the complete video data flow:

## Browser → TV Pipeline (YouTube)
```text
1. User selects YouTube video via click-to-select
2. Content script detects youtube.com domain
3. YouTube-specific extractor runs:
   a. Parse video ID from URL
   b. Access ytInitialPlayerResponse or player API
   c. Parse streamingData.adaptiveFormats
   d. Select video stream matching current quality
   e. Select audio stream (separate in DASH)
   f. Handle signature cipher if present
4. Send video URL + audio URL to service worker
5. Service worker sends via Native Messaging to Tauri
6. Tauri frontend receives URL via IPC
7. HTML5 <video> element loads the URL
8. WebGL pipeline captures video frames as texture
9. CRT shader processes and renders to canvas
```

## Browser → TV Pipeline (HTML5 Generic)
```text
1. User selects video element via click-to-select
2. Content script reads video.currentSrc
3. If not blob: URL, send directly to Tauri
4. If blob: URL, check <source> children for actual URL
5. If no extractable URL, report "cannot capture"
6. Tauri loads URL in <video> element
7. Same WebGL pipeline as above
```

## Local File Pipeline
```text
1. User drags file onto TV window (or uses file picker)
2. Tauri Rust backend receives the file path
3. Rust validates the file exists and checks extension (.mp4, .webm)
4. File path is sent to frontend via Tauri IPC
5. Frontend loads file via file:// URL in <video> element
6. Same WebGL pipeline as above
```

## Video Frame Capture for WebGL
```text
Every animation frame:
1. Check if video.readyState >= HAVE_CURRENT_DATA
2. Upload current video frame to WebGL texture (texImage2D with video element)
3. Bind the texture to the shader program
4. Draw quad with CRT fragment shader
5. Shader applies all enabled effects based on uniform values
```

## Error Handling
- Video URL fails to load → show TV static + error in console
- YouTube extraction fails → show "Cannot capture this video" in extension popup
- Network error during playback → show TV static
- Unsupported format → show error message on TV screen
- CORS issues → document known limitations
