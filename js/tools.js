import { getStampNames } from './stamps.js';

export class ToolManager {
  constructor(drawingCanvas) {
    this.canvas = drawingCanvas;
    this.currentTool = 'pen';
    this.currentColor = '#384259';
    this.currentSize = 3;

    this._toolBtns = document.querySelectorAll('.tool-btn');
    this._colorBtns = document.querySelectorAll('.color-btn');
    this._sizeKnob = document.getElementById('sizeKnob');
    this._customColorInput = document.getElementById('customColor');
    this._stampCursor = document.getElementById('stampCursor');

    this._sizePresets = [3, 7, 12];
    this._sizeIndex = 0;

    this._stampNames = getStampNames();
    this._bindToolButtons();
    this._bindColorButtons();
    this._bindSizeButton();
  }

  _bindToolButtons() {
    this._toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this._toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
        this.canvas.setTool(this.currentTool);
        this._updateCanvasCursor();
      });
    });
  }

  _bindColorButtons() {
    this._colorBtns.forEach(btn => {
      if (btn.classList.contains('color-custom-label')) return;
      btn.addEventListener('click', () => {
        this._colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentColor = btn.dataset.color;
        this.canvas.setColor(this.currentColor);
      });
    });

    this._customColorInput.addEventListener('input', (e) => {
      this.currentColor = e.target.value;
      this.canvas.setColor(this.currentColor);
      this._colorBtns.forEach(b => b.classList.remove('active'));
      this._customColorInput.closest('.color-custom-label').classList.add('active');
    });
  }

  _bindSizeButton() {
    this._sizeKnob.addEventListener('click', () => {
      this._sizeIndex = (this._sizeIndex + 1) % this._sizePresets.length;
      this._sizeKnob.dataset.pos = this._sizeIndex;
      this.currentSize = this._sizePresets[this._sizeIndex];
      this.canvas.setBrushSize(this.currentSize);
    });
  }

  _updateCanvasCursor() {
    const canvasEl = this.canvas.canvas;
    if (this.currentTool === 'pen') {
      canvasEl.style.cursor = 'crosshair';
    } else {
      canvasEl.style.cursor = 'pointer';
    }
  }

  isStampTool() {
    return this._stampNames.includes(this.currentTool);
  }
}
