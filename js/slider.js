export class EraseSlider {
  constructor(track, handle, fill, drawingCanvas, audio) {
    this.track = track;
    this.handle = handle;
    this.fill = fill;
    this.canvas = drawingCanvas;
    this.audio = audio;

    this.isDragging = false;
    this.ratio = 0;
    this._handleWidth = 80;
    this._soundDistance = 0;
    this._lastMoveTime = 0;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    this.handle.addEventListener('pointerdown', this._onPointerDown);
    this.track.addEventListener('pointerdown', this._onTrackClick.bind(this));
  }

  _getTrackBounds() {
    return this.track.getBoundingClientRect();
  }

  _onTrackClick(e) {
    if (e.target === this.handle || this.handle.contains(e.target)) return;
    const bounds = this._getTrackBounds();
    const x = e.clientX - bounds.left;
    const newRatio = Math.max(0, Math.min(1, x / bounds.width));
    if (newRatio > this.ratio) {
      this.ratio = newRatio;
      this._updatePosition();
      this.canvas.eraseToPosition(this.ratio);
      this.audio.init();
      this.audio.playEraseStep(0.7, this._panForRatio(this.ratio));
    }
  }

  _onPointerDown(e) {
    e.preventDefault();
    this.isDragging = true;
    this.handle.setPointerCapture(e.pointerId);
    this.handle.classList.remove('resetting');
    this._startX = e.clientX;
    this._startRatio = this.ratio;
    this._soundDistance = 0;
    this._lastMoveTime = performance.now();

    this.audio.init();
    this.audio.startEraseSound();

    document.addEventListener('pointermove', this._onPointerMove);
    document.addEventListener('pointerup', this._onPointerUp);
  }

  _onPointerMove(e) {
    if (!this.isDragging) return;
    const bounds = this._getTrackBounds();
    const maxTravel = bounds.width - this._handleWidth;
    const dx = e.clientX - this._startX;
    const newRatio = Math.max(0, Math.min(1,
      this._startRatio + dx / maxTravel
    ));

    if (newRatio >= this.ratio) {
      const now = performance.now();
      const moved = (newRatio - this.ratio) * maxTravel;
      const elapsed = Math.max(1, now - this._lastMoveTime);
      this._soundDistance += moved;

      this.ratio = newRatio;
      this._updatePosition();
      this.canvas.eraseToPosition(this.ratio);

      if (this._soundDistance >= 16) {
        const speed = Math.max(0.25, Math.min(1, (moved / elapsed) / 0.6));
        this.audio.playEraseStep(speed, this._panForRatio(this.ratio));
        this._soundDistance = 0;
      }
      this._lastMoveTime = now;
    }
  }

  _onPointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.audio.stopEraseSound();

    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);

    if (this.ratio > 0.92) {
      this.ratio = 1;
      this._updatePosition();
      this.canvas.clearAll();
      this.audio.playEraseEnd(0.7);

      setTimeout(() => {
        this.handle.classList.add('resetting');
        this.ratio = 0;
        this._updatePosition();
        setTimeout(() => this.handle.classList.remove('resetting'), 520);
      }, 100);
    }
  }

  _panForRatio(ratio) {
    return ratio * 1.4 - 0.7;
  }

  _updatePosition() {
    const bounds = this._getTrackBounds();
    const maxTravel = bounds.width - this._handleWidth;
    const left = this.ratio * maxTravel;
    this.handle.style.left = left + 'px';
    this.fill.style.width = (left + this._handleWidth / 2) + 'px';
  }

  updateHandleWidth() {
    this._handleWidth = this.handle.offsetWidth || 56;
  }
}
