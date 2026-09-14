# User Flows

### Flow 1: Send Browser Video to TV (Primary)
1. User opens Chrome/Edge/Brave and navigates to YouTube
2. User plays a video
3. User clicks the HoverTV extension icon in the browser toolbar
4. Extension popup appears showing: "Video found — click to send to TV"
5. User clicks "Select Video" button in the popup
6. Popup closes. Page enters selection mode with a visual indicator (e.g., hover highlight on video elements)
7. User clicks on the video element they want to send
8. Extension extracts the video URL (YouTube-specific extraction for youtube.com, generic DOM extraction for other sites)
9. Extension sends the URL to the Tauri app via Native Messaging
10. If Tauri app is not running, Native Messaging auto-launches it
11. Tauri app receives the URL and starts playing the video
12. CRT power-on animation plays (bright line → expand → video appears)
13. TV window appears on desktop, frameless, always-on-top, showing the video with CRT effects
14. User can move, resize, and continue using other applications

### Flow 2: Replace Current Video
1. TV is already playing a video
2. User clicks extension icon on a different browser tab/video
3. Follows steps 4-11 from Flow 1
4. Current video is replaced. Brief static/channel-change transition (optional, not MVP).

### Flow 3: Local File Playback (Drag and Drop)
1. TV is open (either playing a video or showing static)
2. User drags a video file (.mp4 or .webm) from File Explorer onto the TV window
3. TV starts playing the local file
4. Full playback controls available: click screen to play/pause, seek bar on hover, volume via right-click

### Flow 4: Local File Playback (File Picker)
1. User right-clicks the TV body
2. Selects "Open File..." from context menu
3. Standard Windows file picker dialog opens
4. User selects a video file
5. TV starts playing the file

### Flow 5: Adjust CRT Effects
1. User clicks and drags (or scrolls while hovering) the top knob on the TV
2. CRT intensity changes smoothly from 0% (clean) to 100% (full retro)
3. Value indicator appears briefly showing the current percentage
4. User adjusts bottom knob similarly for color temperature

### Flow 6: Video Source Lost
1. User closes the browser tab that was the video source (or video ends, or connection drops)
2. Extension detects the tab/video is gone and stops sending sync events
3. For non-DRM videos (URL extracted): TV continues playing independently
4. If the video stream itself ends or fails: TV transitions to animated TV static/snow
5. TV remains open and visible, showing static, waiting for a new video

### Flow 7: Close TV
1. Option A: User clicks the power button on the TV → CRT power-off animation plays → app exits
2. Option B: User right-clicks TV → clicks "Quit" → app exits immediately

### Flow 8: No Video Found
1. User clicks extension icon on a page with no video
2. Popup shows "No video detected"
3. User can navigate to a page with video and try again

### Flow 9: Toggle Always-on-Top
1. User right-clicks TV body
2. Clicks "Always on top" toggle in the context menu
3. TV either stays above all windows or becomes a normal window
