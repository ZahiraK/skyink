import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

// Both are copied into /public by scripts/setup-mediapipe.mjs, so nothing loads from a third-party CDN.
const WASM_PATH = `${import.meta.env.BASE_URL}wasm`
const MODEL_PATH = `${import.meta.env.BASE_URL}models/hand_landmarker.task`

// Runs the detection loop while `active` is true.
// IMPORTANT: per-frame data is delivered through `onFrame`, never through React state.
// State updates at 30-60 fps would re-render the tree on every frame.
// status: 'idle' | 'loading' | 'ready' | 'error'
export function useHandTracking({ videoRef, active, onFrame, numHands = 1 }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  // Keep the latest callback in a ref so changing it never restarts the loop.
  const onFrameRef = useRef(onFrame)
  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    if (!active) return undefined

    let cancelled = false
    let raf = 0
    let landmarker = null
    let lastVideoTime = -1

    async function run() {
      try {
        setStatus('loading')
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
        const create = (delegate) =>
          HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate },
            runningMode: 'VIDEO',
            numHands,
          })

        try {
          landmarker = await create('GPU')
        } catch {
          landmarker = await create('CPU') // some machines have no usable WebGL
        }
        if (cancelled) {
          landmarker.close()
          return
        }

        setStatus('ready')
        const loop = () => {
          const video = videoRef.current
          // Only run inference when the camera produced a new frame.
          if (video && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime
            const now = performance.now()
            onFrameRef.current?.(landmarker.detectForVideo(video, now), now)
          }
          raf = requestAnimationFrame(loop)
        }
        loop()
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setStatus('error')
        }
      }
    }

    run()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      landmarker?.close()
      setStatus('idle')
    }
  }, [active, numHands, videoRef])

  return { status, error }
}
