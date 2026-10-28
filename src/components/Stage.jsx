import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebcam } from '../hooks/useWebcam'
import { useHandTracking } from '../hooks/useHandTracking'
import { GestureEngine } from '../lib/gestureEngine'
import { InkPainter } from '../lib/ink'
import { drawHand, drawCursor } from '../lib/render'
import { COLORS } from '../lib/colors'
import Toolbar from './Toolbar'

// Fixed internal resolution (4:3, same as the camera). CSS scales it to fit the screen.
const W = 1280
const H = 960

const MESSAGES = {
  idle: 'Press "Start camera", then pinch your thumb and index finger to draw.',
  requesting: 'Waiting for camera permission...',
  denied: 'Camera access was blocked. Allow it in your browser settings and try again.',
  error: 'Could not start the camera on this device or browser.',
}

export default function Stage() {
  const { videoRef, status: camera, start, stop } = useWebcam()
  const overlayRef = useRef(null)
  const inkRef = useRef(null)
  const hudRef = useRef(null)
  const engineRef = useRef(new GestureEngine())
  const painterRef = useRef(null)
  const colorRef = useRef(COLORS[0])
  const [color, setColor] = useState(COLORS[0])

  useEffect(() => {
    painterRef.current = new InkPainter(inkRef.current)
  }, [])

  // Runs every frame. It writes straight to canvases and the HUD node, never to React state.
  const onFrame = useCallback((result, now) => {
    const ctx = overlayRef.current.getContext('2d')
    ctx.clearRect(0, 0, W, H)

    const lm = result.landmarks?.[0] ?? null
    const state = engineRef.current.update(lm, now)

    if (lm) drawHand(ctx, lm, W, H)
    if (state.cursor) drawCursor(ctx, state.cursor, state.pinching, colorRef.current, W, H)
    painterRef.current.update(state)
    if (hudRef.current) hudRef.current.textContent = state.pose
  }, [])

  const tracking = useHandTracking({ videoRef, active: camera === 'live', onFrame })

  const changeColor = (c) => {
    colorRef.current = c
    painterRef.current.setColor(c)
    setColor(c)
  }

  const save = () => {
    const a = document.createElement('a')
    a.href = painterRef.current.toDataURL()
    a.download = `skyink-${Date.now()}.png`
    a.click()
  }

  const live = camera === 'live'
  const note = live
    ? tracking.status === 'loading'
      ? 'Loading hand model...'
      : tracking.status === 'error'
        ? 'Could not load the hand-tracking model. Run "npm run setup" and reload.'
        : null
    : MESSAGES[camera]

  return (
    <section className="stage-wrap">
      <div className="stage" style={{ aspectRatio: `${W} / ${H}` }}>
        <video ref={videoRef} className="video" playsInline muted />
        <canvas ref={inkRef} width={W} height={H} className="layer" />
        <canvas ref={overlayRef} width={W} height={H} className="layer" />
        <div className="hud">
          <span>pose</span> <strong ref={hudRef}>none</strong>
        </div>
        {note && <p className="note">{note}</p>}
      </div>
      <Toolbar
        color={color}
        onColor={changeColor}
        onClear={() => painterRef.current.clear()}
        onSave={save}
        cameraOn={live}
        onToggleCamera={live ? stop : start}
      />
    </section>
  )
}
