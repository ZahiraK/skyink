import { HAND_CONNECTIONS } from './landmarks.js'

// Landmarks arrive un-mirrored, so x is flipped here to match the mirrored video.
const px = (p, w) => (1 - p.x) * w
const py = (p, h) => p.y * h

export function drawHand(ctx, lm, w, h) {
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.75)'
  ctx.beginPath()
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.moveTo(px(lm[a], w), py(lm[a], h))
    ctx.lineTo(px(lm[b], w), py(lm[b], h))
  }
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  for (const p of lm) {
    ctx.beginPath()
    ctx.arc(px(p, w), py(p, h), 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

// cursor is already mirrored and smoothed by the GestureEngine.
export function drawCursor(ctx, cursor, pinching, color, w, h) {
  const x = cursor.x * w
  const y = cursor.y * h
  ctx.beginPath()
  ctx.arc(x, y, pinching ? 10 : 16, 0, Math.PI * 2)
  if (pinching) {
    ctx.fillStyle = color
    ctx.fill()
  } else {
    ctx.lineWidth = 3
    ctx.strokeStyle = color
    ctx.stroke()
  }
}
