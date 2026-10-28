import { LM, dist, handScale } from './landmarks.js'

// Thumb tip to index tip distance, as a fraction of hand size.
export const pinchRatio = (lm) => dist(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]) / handScale(lm)

// A finger counts as extended when its tip is farther from the wrist than its middle joint.
const extended = (lm, tip, pip) =>
  dist(lm[LM.WRIST], lm[tip]) > dist(lm[LM.WRIST], lm[pip]) * 1.08

export function fingerStates(lm) {
  return {
    index: extended(lm, LM.INDEX_TIP, LM.INDEX_PIP),
    middle: extended(lm, LM.MIDDLE_TIP, LM.MIDDLE_PIP),
    ring: extended(lm, LM.RING_TIP, LM.RING_PIP),
    pinky: extended(lm, LM.PINKY_TIP, LM.PINKY_PIP),
  }
}

// Static pose classifier for the HUD and for mode switching (e.g. open palm = erase).
export function classifyPose(lm) {
  const f = fingerStates(lm)
  const count = Number(f.index) + Number(f.middle) + Number(f.ring) + Number(f.pinky)
  if (count === 4) return 'open'
  if (count === 0) return 'fist'
  if (f.index && count === 1) return 'point'
  return 'other'
}

// Pinch with hysteresis: it starts below `on` and only ends above `off` (off > on),
// so a value hovering near one threshold can't flicker the state.
// `holdFrames` requires the new state to persist for N frames before it flips.
export class PinchDetector {
  constructor({ on = 0.3, off = 0.45, holdFrames = 2 } = {}) {
    this.on = on
    this.off = off
    this.holdFrames = holdFrames
    this.reset()
  }

  reset() {
    this.pinching = false
    this.streak = 0
  }

  update(lm) {
    const ratio = pinchRatio(lm)
    const wantsFlip = this.pinching ? ratio > this.off : ratio < this.on
    this.streak = wantsFlip ? this.streak + 1 : 0
    if (this.streak >= this.holdFrames) {
      this.pinching = !this.pinching
      this.streak = 0
    }
    return this.pinching
  }
}
