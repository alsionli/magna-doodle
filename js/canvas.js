import { drawStamp } from './stamps.js';

export class DrawingCanvas {
  constructor(canvasEl, audio) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.audio = audio;

    this.isDrawing = false;
    this.lastPoint = null;

    this.color = '#384259';
    this.brushSize = 3;
    this.tool = 'pen';

    this._drawSoundTimer = 0;
    this._dpr = window.devicePixelRatio || 1;

    this.resize();
  }

  /* ── sizing ─────────────────────────────────────── */

  resize() {
    const wrapper = this.canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this._dpr = dpr;

    const oldW = this.canvas.width;
    const oldH = this.canvas.height;
    let oldData = null;
    if (oldW && oldH) {
      oldData = this.ctx.getImageData(0, 0, oldW, oldH);
    }

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (oldData) {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.putImageData(oldData, 0, 0);
      this.ctx.restore();
    }

    this.width = rect.width;
    this.height = rect.height;
  }

  /* ── coordinate helpers ─────────────────────────── */

  getPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure !== undefined ? e.pressure : 0.5
    };
  }

  /* ── drawing lifecycle ──────────────────────────── */

  startStroke(point) {
    if (this.tool !== 'pen') return;
    this.isDrawing = true;
    this.lastPoint = point;
    this._drawDot(point);
    this.audio.init();
  }

  continueStroke(point) {
    if (!this.isDrawing || this.tool !== 'pen') return;
    this._drawMagneticLine(this.lastPoint, point);
    this.lastPoint = point;

    const now = performance.now();
    if (now - this._drawSoundTimer > 60) {
      this.audio.playDrawSound();
      this._drawSoundTimer = now;
    }
  }

  endStroke() {
    this.isDrawing = false;
    this.lastPoint = null;
  }

  /* ── magnetic particle rendering ────────────────── */

  _drawDot(p) {
    const ctx = this.ctx;
    const size = this.brushSize * (0.7 + (p.pressure || 0.5) * 0.6);
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = size * 0.15;
    for (let i = 0; i < 8; i++) {
      const ox = (Math.random() - 0.5) * size * 0.8;
      const oy = (Math.random() - 0.5) * size * 0.8;
      const r = size * 0.08 + Math.random() * size * 0.22;
      ctx.globalAlpha = 0.3 + Math.random() * 0.55;
      ctx.beginPath();
      ctx.arc(p.x + ox, p.y + oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (Math.random() > 0.4) {
      const cr = size * 0.25 + Math.random() * size * 0.15;
      ctx.globalAlpha = 0.35 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.arc(p.x + (Math.random() - 0.5) * size * 0.3, p.y + (Math.random() - 0.5) * size * 0.3, cr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawMagneticLine(from, to) {
    const ctx = this.ctx;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.floor(dist / 1.5));

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.brushSize * 0.15;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const y = from.y + dy * t;
      const pressure = (from.pressure || 0.5) + ((to.pressure || 0.5) - (from.pressure || 0.5)) * t;
      const size = this.brushSize * (0.7 + pressure * 0.6);

      for (let j = 0; j < 7; j++) {
        const ox = (Math.random() - 0.5) * size * 0.85;
        const oy = (Math.random() - 0.5) * size * 0.85;
        const r = size * 0.06 + Math.random() * size * 0.2;
        ctx.globalAlpha = 0.25 + Math.random() * 0.55;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (Math.random() > 0.5) {
        const cr = size * 0.2 + Math.random() * size * 0.18;
        ctx.globalAlpha = 0.3 + Math.random() * 0.35;
        ctx.beginPath();
        ctx.arc(x + (Math.random() - 0.5) * size * 0.4, y + (Math.random() - 0.5) * size * 0.4, cr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ── stamps ─────────────────────────────────────── */

  placeStamp(point) {
    drawStamp(this.ctx, this.tool, point.x, point.y, this.color, this.brushSize);
    this.audio.playStampSound();
  }

  /* ── erase ──────────────────────────────────────── */

  eraseToPosition(xRatio) {
    const clearX = xRatio * this.width;
    const dpr = this._dpr;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, clearX * dpr, this.canvas.height);
    this.ctx.restore();
  }

  clearAll() {
    const dpr = this._dpr;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  /* ── setters ────────────────────────────────────── */

  setColor(c)     { this.color = c; }
  setBrushSize(s) { this.brushSize = Number(s); }
  setTool(t)      { this.tool = t; this.endStroke(); }
}
