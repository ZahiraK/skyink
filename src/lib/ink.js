// Paints strokes on a 2D canvas from engine output. Plain class, no React.
export class InkPainter {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.color = '#ff6b9d'
    this.width = 8
    this.last = null
  }

  setColor(color) {
    this.color = color
  }

  // Call once per frame with the GestureEngine state.
  update(state) {
    if (!(state.pinching && state.cursor)) {
      this.last = null
      return
    }
    const { width, height } = this.canvas
    const p = { x: state.cursor.x * width, y: state.cursor.y * height }
    const from = this.last ?? p // first point draws a dot (round cap)

    this.ctx.strokeStyle = this.color
    this.ctx.lineWidth = this.width
    this.ctx.beginPath()
    this.ctx.moveTo(from.x, from.y)
    this.ctx.lineTo(p.x, p.y)
    this.ctx.stroke()
    this.last = p
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.last = null
  }

  // PNG with a solid background so it looks right outside the app.
  toDataURL(background = '#0b0d12') {
    const out = document.createElement('canvas')
    out.width = this.canvas.width
    out.height = this.canvas.height
    const ctx = out.getContext('2d')
    ctx.fillStyle = background
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(this.canvas, 0, 0)
    return out.toDataURL('image/png')
  }
}
