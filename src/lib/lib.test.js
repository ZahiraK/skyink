import test from 'node:test'
import assert from 'node:assert/strict'
import { LM } from './landmarks.js'
import { OneEuroFilter } from './smoothing.js'
import { PinchDetector, classifyPose } from './gestures.js'
import { GestureEngine } from './gestureEngine.js'

// Builds a 21-point hand. Wrist at (0.5, 0.9), middle knuckle 0.2 above it (hand scale = 0.2).
// Each finger is either extended (tip far from wrist) or curled (tip near the knuckle).
function makeHand({ index = true, middle = true, ring = true, pinky = true, pinchGap = 0.3 } = {}) {
  const lm = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.9, z: 0 }))
  lm[LM.WRIST] = { x: 0.5, y: 0.9, z: 0 }
  lm[LM.MIDDLE_MCP] = { x: 0.5, y: 0.7, z: 0 }
  const setFinger = (pip, tip, x, open) => {
    lm[pip] = { x, y: 0.62, z: 0 }
    lm[tip] = { x, y: open ? 0.4 : 0.66, z: 0 }
  }
  setFinger(LM.INDEX_PIP, LM.INDEX_TIP, 0.44, index)
  setFinger(LM.MIDDLE_PIP, LM.MIDDLE_TIP, 0.5, middle)
  setFinger(LM.RING_PIP, LM.RING_TIP, 0.56, ring)
  setFinger(LM.PINKY_PIP, LM.PINKY_TIP, 0.62, pinky)
  // Thumb tip sits `pinchGap` (in hand-scale units) away from the index tip.
  const it = lm[LM.INDEX_TIP]
  lm[LM.THUMB_TIP] = { x: it.x + pinchGap * 0.2, y: it.y, z: 0 }
  return lm
}

test('one euro filter smooths jitter but follows real movement', () => {
  const f = new OneEuroFilter()
  let out = 0
  for (let i = 0; i < 60; i++) out = f.filter(0.5 + (i % 2 ? 0.004 : -0.004), i * 16)
  assert.ok(Math.abs(out - 0.5) < 0.003, `jitter should be damped, got ${out}`)

  const g = new OneEuroFilter()
  let last = 0
  for (let i = 0; i < 30; i++) last = g.filter(i * 0.03, i * 16)
  assert.ok(last > 0.8 * 29 * 0.03 - 0.1, `should track a fast move, got ${last}`)
})

test('pose classifier', () => {
  assert.equal(classifyPose(makeHand()), 'open')
  assert.equal(classifyPose(makeHand({ index: false, middle: false, ring: false, pinky: false })), 'fist')
  assert.equal(classifyPose(makeHand({ middle: false, ring: false, pinky: false })), 'point')
})

test('pinch detector uses hysteresis and a hold period', () => {
  const d = new PinchDetector({ on: 0.3, off: 0.45, holdFrames: 2 })
  assert.equal(d.update(makeHand({ pinchGap: 0.2 })), false) // 1st frame below threshold: not yet
  assert.equal(d.update(makeHand({ pinchGap: 0.2 })), true) // held 2 frames: pinching
  assert.equal(d.update(makeHand({ pinchGap: 0.38 })), true) // between on and off: stays pinched
  assert.equal(d.update(makeHand({ pinchGap: 0.6 })), true) // 1st frame above off: not yet
  assert.equal(d.update(makeHand({ pinchGap: 0.6 })), false) // held: released
})

test('engine mirrors x, reports pinch start and end, and handles lost hands', () => {
  const e = new GestureEngine()
  const open = makeHand({ pinchGap: 1 })
  const s0 = e.update(open, 0)
  assert.equal(s0.present, true)
  assert.ok(s0.cursor.x > 0.4 && s0.cursor.x < 0.6) // 1 - ~0.44..0.5 is near the middle

  e.update(makeHand({ pinchGap: 0.1 }), 16)
  const start = e.update(makeHand({ pinchGap: 0.1 }), 32)
  assert.equal(start.pinchStart, true)
  assert.equal(start.pose, 'pinch')

  const lost = e.update(null, 48)
  assert.equal(lost.present, false)
  assert.equal(lost.pinchEnd, true) // losing the hand must lift the pen
})
