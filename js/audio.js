export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
    this._drawNoiseBuffer = null;
    this._eraseNoiseBuffer = null;
    this._eraseStepBuffer = null;
    this._eraseEndBuffer = null;
    this._eraseActive = false;
    this._erasePulseTimer = null;
    this._eraseCurrentIntensity = 0.5;
    this._eraseCurrentPan = 0;
    this._eraseLastMotionAt = 0;
    this._samplesPromise = null;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._drawNoiseBuffer = this._createNoiseBuffer(0.08);
      this._eraseNoiseBuffer = this._createNoiseBuffer(0.1);
      this.initialized = true;
      this._samplesPromise = this._loadEraseSamples();
    } catch {
      console.warn('Web Audio API not available');
    }
  }

  ensureResumed() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createNoiseBuffer(duration) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  async _loadEraseSamples() {
    try {
      const load = async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Unable to load ${url}`);
        return this.ctx.decodeAudioData(await response.arrayBuffer());
      };
      [this._eraseStepBuffer, this._eraseEndBuffer] = await Promise.all([
        load('./assets/magna-slider-scrape.wav'),
        load('./assets/magna-slider-end.wav'),
      ]);
    } catch {
      // The procedural fallbacks below keep the slider audible offline.
      console.warn('Slider audio samples unavailable; using synthesized fallback');
    }
  }

  _connectWithPan(input, gain, pan) {
    input.connect(gain);
    if (typeof this.ctx.createStereoPanner === 'function') {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-0.7, Math.min(0.7, pan));
      gain.connect(panner);
      panner.connect(this.ctx.destination);
      return;
    }
    gain.connect(this.ctx.destination);
  }

  playDrawSound() {
    if (this.muted || !this.initialized) return;
    this.ensureResumed();

    const source = this.ctx.createBufferSource();
    source.buffer = this._drawNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  playStampSound() {
    if (this.muted || !this.initialized) return;
    this.ensureResumed();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  startEraseSound() {
    if (this.muted || !this.initialized) return;
    this.ensureResumed();
    this._eraseActive = true;
  }

  _playEraseLayer() {
    if (!this._eraseActive || this.muted || !this._eraseStepBuffer) return;
    if (performance.now() - this._eraseLastMotionAt > 130) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this._eraseStepBuffer;
    source.playbackRate.value = 0.98 + this._eraseCurrentIntensity * 0.03;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.105 + this._eraseCurrentIntensity * 0.025;
    this._connectWithPan(source, gain, this._eraseCurrentPan);
    source.start();
  }

  playEraseStep(intensity = 0.5, pan = 0) {
    if (this.muted || !this.initialized) return;
    this.ensureResumed();
    this._eraseCurrentIntensity = Math.max(0.2, Math.min(1, intensity));
    this._eraseCurrentPan = Math.max(-0.7, Math.min(0.7, pan));
    this._eraseLastMotionAt = performance.now();

    if (!this._eraseStepBuffer) {
      this._samplesPromise?.then(() => {
        if (this._eraseActive && !this._erasePulseTimer) this.playEraseStep(intensity, pan);
      });
      return;
    }

    if (!this._erasePulseTimer) {
      this._playEraseLayer();
      this._erasePulseTimer = setInterval(() => this._playEraseLayer(), 65);
    }
  }

  playEraseEnd(pan = 0.7) {
    if (this.muted || !this.initialized) return;
    this.ensureResumed();

    const t = this.ctx.currentTime;
    if (this._eraseEndBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this._eraseEndBuffer;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.42;
      this._connectWithPan(source, gain, pan);
      source.start(t);
      return;
    }

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, t);
    osc.frequency.exponentialRampToValueAtTime(112, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.055, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    this._connectWithPan(osc, gain, pan);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  stopEraseSound() {
    this._eraseActive = false;
    if (this._erasePulseTimer) clearInterval(this._erasePulseTimer);
    this._erasePulseTimer = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopEraseSound();
    return this.muted;
  }
}
