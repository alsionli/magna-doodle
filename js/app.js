import { AudioEngine } from './audio.js';
import { DrawingCanvas } from './canvas.js';
import { EraseSlider } from './slider.js';
import { ToolManager } from './tools.js';

/* ── Bootstrap ────────────────────────────────────── */

const audio = new AudioEngine();
const canvasEl = document.getElementById('drawCanvas');
const drawingCanvas = new DrawingCanvas(canvasEl, audio);
const tools = new ToolManager(drawingCanvas);

const slider = new EraseSlider(
  document.getElementById('sliderTrack'),
  document.getElementById('sliderHandle'),
  document.getElementById('sliderFill'),
  drawingCanvas,
  audio
);

/* ── Canvas pointer events ────────────────────────── */

canvasEl.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  audio.init();
  const point = drawingCanvas.getPoint(e);

  if (tools.isStampTool()) {
    drawingCanvas.placeStamp(point);
  } else {
    drawingCanvas.startStroke(point);
  }
});

canvasEl.addEventListener('pointermove', (e) => {
  e.preventDefault();
  if (!drawingCanvas.isDrawing) return;
  const point = drawingCanvas.getPoint(e);
  drawingCanvas.continueStroke(point);
});

canvasEl.addEventListener('pointerup', ()   => drawingCanvas.endStroke());
canvasEl.addEventListener('pointerleave', () => drawingCanvas.endStroke());
canvasEl.addEventListener('pointercancel', () => drawingCanvas.endStroke());

/* Prevent default touch behaviors on canvas */
canvasEl.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
canvasEl.addEventListener('touchmove',  (e) => e.preventDefault(), { passive: false });

/* ── Resize handling ──────────────────────────────── */

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    drawingCanvas.resize();
    slider.updateHandleWidth();
  }, 100);
});

/* Initial sizing pass once layout is stable */
requestAnimationFrame(() => {
  drawingCanvas.resize();
  slider.updateHandleWidth();
});
