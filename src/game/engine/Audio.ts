// ─── Sticky Rush: Audio Engine ──────────────────────────────────────────────
// Lightweight Web Audio API synthesizer for 8-bit style sound effects.

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = false;

  init() {
    if (this.ctx) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // 30% volume
      this.masterGain.connect(this.ctx.destination);
      this.enabled = true;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol = 1, slideFreq?: number) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playJump() {
    this.playTone(150, 'square', 0.2, 0.5, 300);
  }

  playPickup() {
    this.playTone(400, 'sine', 0.1, 0.4, 600);
    setTimeout(() => this.playTone(600, 'sine', 0.2, 0.4, 800), 100);
  }

  playWin() {
    this.playTone(300, 'square', 0.15, 0.5, 400);
    setTimeout(() => this.playTone(400, 'square', 0.15, 0.5, 500), 150);
    setTimeout(() => this.playTone(500, 'square', 0.3, 0.5, 600), 300);
  }

  playDeath() {
    this.playTone(200, 'sawtooth', 0.4, 0.6, 50);
  }

  playClick() {
    this.playTone(600, 'square', 0.05, 0.2, 100);
  }
}

export const sfx = new AudioEngine();
