// One Euro Filter: a low-pass filter whose cutoff rises with speed.
// Slow movement is heavily smoothed (no jitter); fast movement stays responsive (no lag).
// Paper: https://gery.casiez.net/1euro/

const alpha = (dt, cutoff) => {
  const r = 2 * Math.PI * cutoff * dt
  return r / (r + 1)
}

export class OneEuroFilter {
  // Defaults are tuned for coordinates normalized to 0..1 (speeds around 0.1 to 2 per second).
  constructor({ minCutoff = 1.5, beta = 6, dCutoff = 1 } = {}) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
    this.reset()
  }

  reset() {
    this.x = null
    this.dx = 0
    this.t = null
  }

  // value: number, tMs: timestamp in milliseconds
  filter(value, tMs) {
    if (this.x === null) {
      this.x = value
      this.t = tMs
      return value
    }
    const dt = Math.max((tMs - this.t) / 1000, 1e-3)
    this.t = tMs

    const rawDx = (value - this.x) / dt
    this.dx += alpha(dt, this.dCutoff) * (rawDx - this.dx)

    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx)
    this.x += alpha(dt, cutoff) * (value - this.x)
    return this.x
  }
}

export class PointFilter {
  constructor(options) {
    this.fx = new OneEuroFilter(options)
    this.fy = new OneEuroFilter(options)
  }

  reset() {
    this.fx.reset()
    this.fy.reset()
  }

  filter(p, tMs) {
    return { x: this.fx.filter(p.x, tMs), y: this.fy.filter(p.y, tMs) }
  }
}
