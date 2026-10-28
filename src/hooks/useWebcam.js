import { useCallback, useEffect, useRef, useState } from 'react'

// Owns the camera stream. status: 'idle' | 'requesting' | 'live' | 'denied' | 'error'
// start() must be called from a user gesture (a button click) so the browser prompts cleanly.
export function useWebcam() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle')

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      return
    }
    setStatus('requesting')
    try {
      // 640x480 is plenty for hand tracking and keeps the frame rate high.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      await video.play()
      setStatus('live')
    } catch (err) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError'
      setStatus(denied ? 'denied' : 'error')
    }
  }, [])

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), [])

  return { videoRef, status, start, stop }
}
