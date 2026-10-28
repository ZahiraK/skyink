import { LM } from './landmarks.js'
import { PointFilter } from './smoothing.js'
import { PinchDetector, classifyPose } from './gestures.js'

// Pure, framework-free core. Raw landmarks in, one interpreted frame state out.
// It never touches React, the DOM or the canvas, so it is easy to unit test and to reuse.
//
// Coordinates in the output are normalized (0..1) and MIRRORED horizontally,
// so moving your hand to the right moves the cursor to the right, like a mirror.
export class GestureEngine {
  constructor() {
    this.cursorFilter = new PointFilter()
    this.pinch = new PinchDetector()
    this.wasPinching = false
  }

  // lm: array of 21 {x, y, z}, or null when no hand is visible. tMs: timestamp in ms.
  update(lm, tMs) {
    if (!lm) {
      const pinchEnd = this.wasPinching
      this.cursorFilter.reset()
      this.pinch.reset()
      this.wasPinching = false
      return { present: false, cursor: null, pinching: false, pinchStart: false, pinchEnd, pose: 'none' }
    }

    // The midpoint of thumb and index tips is steadier than the index tip alone,
    // because the index tip travels toward the thumb while you pinch.
    const a = lm[LM.THUMB_TIP]
    const b = lm[LM.INDEX_TIP]
    const raw = { x: 1 - (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const cursor = this.cursorFilter.filter(raw, tMs)

    const pinching = this.pinch.update(lm)
    const state = {
      present: true,
      cursor,
      pinching,
      pinchStart: pinching && !this.wasPinching,
      pinchEnd: !pinching && this.wasPinching,
      pose: pinching ? 'pinch' : classifyPose(lm),
    }
    this.wasPinching = pinching
    return state
  }
}
