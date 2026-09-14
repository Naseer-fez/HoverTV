# UI Design Specification

## TV Body Layout
The TV is built programmatically (HTML/CSS/Canvas). Inspired by the reference image (src/image.svg and src/retrotv.png) — a late-70s/early-80s CRT TV.

```text
┌─────────────────────────────────────────────────┐
│                                                   │
│   ┌─────────────────────┐  ┌──────────────────┐  │
│   │                     │  │  (brand plate)   │  │
│   │                     │  │  (decorative,    │  │
│   │                     │  │   no text)       │  │
│   │                     │  ├──────────────────┤  │
│   │      SCREEN         │  │                  │  │
│   │   (video + CRT      │  │  ◉ Top Knob      │  │
│   │    effects area)    │  │  (CRT intensity) │  │
│   │                     │  │                  │  │
│   │   Dynamic aspect    │  ├──────────────────┤  │
│   │   ratio matching    │  │                  │  │
│   │   source video      │  │  ◉ Bottom Knob   │  │
│   │                     │  │  (color temp)    │  │
│   │                     │  │                  │  │
│   └─────────────────────┘  ├──────────────────┤  │
│                             │  ⏻ Power Button  │  │
│                             └──────────────────┘  │
│                                                   │
└─────────────────────────────────────────────────┘
```

## Visual Style
- **Body**: Brown/wood-grain tones (gradient from dark brown to lighter tan)
- **Bezel**: Thick, slightly rounded, darker than body
- **Screen**: Inset into the bezel, with subtle glass-like reflections (CSS pseudo-elements)
- **Control panel**: Right side, slightly recessed or differentiated from body
- **Knobs**: Circular, raised appearance, dark plastic look with an indicator line/dot
- **Power button**: Small, rectangular or round, with a subtle LED/indicator when on
- **Overall proportions**: approximately 4:3 body with right panel adding ~20% width

## Screen Area
- The screen dynamically adapts its aspect ratio to match the source video
- The TV body proportions adjust around the screen (the bezel and frame flex)
- Screen has a subtle rounded-corner clip (simulating CRT glass curvature)
- Behind the CRT shader, there's a slight glass reflection overlay (CSS, not WebGL)

## Interaction Zones
- **TV body (except controls)**: Drag to move the window
- **Screen area**: Click to play/pause (local files only). For browser videos, clicking does nothing.
- **Top knob**: Click and drag up/down (or scroll) to adjust CRT intensity. Value tooltip appears.
- **Bottom knob**: Click and drag up/down (or scroll) to adjust color temperature. Value tooltip appears.
- **Power button**: Click to power off (animation → exit) or power on
- **Any edge/corner**: Drag to resize (cursor changes to resize cursor)
- **Right-click anywhere**: Context menu

## Right-Click Context Menu
```text
✓ Always on top
──────────────────
  Volume          ▶ [slider 0-100%]
──────────────────
  CRT Effects     ▶ ✓ Scanlines
                    ✓ Curvature
                    ✓ Vignette
                    ✓ Chromatic Aberration
                    ✓ Glow
                    □ Noise
──────────────────
  Open File...
──────────────────
  About HoverTV
  Quit
```

## CRT Power-On Animation Sequence
1. Screen is black (TV state: OFF → POWERING_ON)
2. A bright white/blue horizontal line appears at the center of the screen (100ms)
3. The line rapidly expands vertically to fill the screen (200ms, ease-out)
4. Brief burst of static/noise (100ms)
5. Video/static appears (TV state: PLAYING or STATIC)
Total duration: ~400-500ms

## CRT Power-Off Animation Sequence
1. Video is playing (TV state: PLAYING → POWERING_OFF)
2. Screen content compresses vertically toward center (200ms, ease-in)
3. Shrinks to a horizontal line (100ms)
4. Line shrinks to a bright dot at center (100ms)
5. Dot fades out (150ms)
6. Screen is fully dark
7. App exits (TV state: OFF)
Total duration: ~550-600ms

## TV Static Animation
- Full-screen animated noise (random black/white pixels)
- Generated procedurally in the WebGL shader using a noise function
- Runs at display refresh rate
- Uses the static noise effect from the CRT shader pipeline
- No audio accompanies the static (for MVP; future: subtle static hiss)
