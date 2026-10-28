# SkyInk

Draw in the air. SkyInk turns your webcam into a drawing surface using hand tracking: pinch your thumb and index finger to paint, release to lift the pen.

Everything runs in the browser with [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker). No video is uploaded anywhere.

## Live demo

**Try it here: [fancy-elf-3b03ee.netlify.app](https://fancy-elf-3b03ee.netlify.app/)**

Allow camera access, hold your hand up in good light, and pinch to draw. It works on desktop and on phones with a front camera.

<!-- After you record a GIF, save it as docs/demo.gif and uncomment the next line:
![SkyInk demo](docs/demo.gif)
-->

## Built with

React 19, Vite, MediaPipe Tasks Vision (hand landmarks), Canvas 2D, deployed on Netlify.

## Privacy

The camera feed is processed locally in your browser by a model that is served with the site. No video, image, or hand data is sent to any server.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 (localhost is allowed to use the camera)
```

`npm run dev` and `npm run build` first run `npm run setup`, which copies the MediaPipe WASM runtime into `public/wasm` and downloads the hand model (a few MB) into `public/models`. Both are gitignored.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests for the gesture logic (Node's built-in runner) |
| `npm run lint` | Lint with Oxlint |
| `npm run setup` | Re-run the MediaPipe asset setup |

## How to use it

1. Press **Start camera** and allow access.
2. Hold your hand up in good light, palm facing the camera.
3. Pinch thumb and index finger to draw. Release to lift.
4. Pick colors with the mouse, **Clear** to reset, **Save PNG** to export.

## Architecture

```
src/
  lib/                      Pure JS, no React, no DOM. Unit tested.
    landmarks.js            Landmark indices, skeleton bones, distance helpers
    smoothing.js            One Euro Filter (removes jitter, keeps responsiveness)
    gestures.js             Pinch detector (hysteresis + hold), pose classifier
    gestureEngine.js        landmarks in -> { cursor, pinching, pinchStart, pinchEnd, pose } out
    ink.js                  InkPainter: draws strokes on a canvas
    render.js               Draws the hand skeleton and cursor overlay
  hooks/
    useWebcam.js            Camera stream and permission status
    useHandTracking.js      Loads the model, runs the requestAnimationFrame loop
  components/
    Stage.jsx               Wires camera, tracking, engine, painter and canvases together
    Toolbar.jsx             Colors, clear, save, camera toggle
scripts/
  setup-mediapipe.mjs       Copies WASM and downloads the model
```

### Data flow

```
webcam -> <video> -> HandLandmarker.detectForVideo()   (useHandTracking, rAF loop)
                          |
                          v  21 landmarks per hand
                     GestureEngine.update()            (mirror + smooth + gestures)
                          |
          +---------------+----------------+
          v                                v
     InkPainter.update()           drawHand / drawCursor
     (ink canvas)                  (overlay canvas)
```

### Design rules

- **No per-frame React state.** Detection runs at 30 to 60 fps. Frame data flows through a callback straight to canvases and refs. React state is only used for rare events (camera status, selected color).
- **The engine is framework-free.** All gesture logic lives in `src/lib`, so it can be tested without a browser and reused later (for example in a game mode).
- **Mirrored coordinates.** The video is flipped with CSS and the engine flips `x` (`1 - x`), so moving your right hand moves the cursor right.
- **Thresholds are relative to hand size**, so gestures work at any distance from the camera.
- **Hysteresis + hold frames** on pinch prevent flicker near the threshold.
- **Self-hosted model and WASM** so the app does not depend on a CDN at runtime.

## Deploy to Netlify

The live demo above is deployed this way, and it redeploys on every push to `main`.

1. Push this repo to GitHub.
2. In Netlify: **Add new site -> Import an existing project -> GitHub**, pick the repo.
3. Build settings are read from `netlify.toml` (`npm run build`, publish `dist`). The build downloads the model; it fails loudly if that download fails.
4. Camera access needs HTTPS, which Netlify provides by default.

## Roadmap

- [ ] Open palm = eraser
- [ ] Swipe to clear
- [ ] Pick colors with gestures (hover a swatch and pinch)
- [ ] Two-hand gestures: zoom and rotate the canvas
- [ ] Brush size from pinch pressure
- [ ] Game mode: strokes become physics objects
- [ ] Mouse and touch fallback when the camera is denied
- [ ] Share link / export as GIF

## Tips

- Face a light source. Dim rooms and busy backgrounds reduce accuracy.
- Keep your whole hand in frame.
- If the cursor feels too floaty or too jumpy, tune `minCutoff` and `beta` in `src/lib/smoothing.js`.

## License

MIT