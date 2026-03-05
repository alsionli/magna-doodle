export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
    this._drawNoiseBuffer = null;
    this._eraseNoiseBuffer = null;
    this._activeDrawSource = null;
    this._activeEraseSource = null;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._drawNoiseBuffer = this._createNoiseBuffer(0.08);
      this._eraseNoiseBuffer = this._createNoiseBuffer(0.15);
      this.initialized = true;
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
    if (this.muted || !this.initialized || this._activeEraseSource) return;
    this.ensureResumed();

    const source = this.ctx.createBufferSource();
    source.buffer = this._eraseNoiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.06;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();

    this._activeEraseSource = source;
    this._activeEraseGain = gain;
  }

  stopEraseSound() {
    if (!this._activeEraseSource) return;
    try {
      this._activeEraseGain.gain.exponentialRampToValueAtTime(
        0.001, this.ctx.currentTime + 0.1
      );
      const src = this._activeEraseSource;
      setTimeout(() => { try { src.stop(); } catch {} }, 120);
    } catch {}
    this._activeEraseSource = null;
    this._activeEraseGain = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopEraseSound();
    return this.muted;
  }
}
