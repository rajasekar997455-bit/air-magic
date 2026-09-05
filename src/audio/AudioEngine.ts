export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public isMuted: boolean = true; // Off by default as required

  constructor() {
    // Initialized lazily on first user interaction
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.4;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  toggleMute(): boolean {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.4,
        this.ctx.currentTime
      );
    }
    return this.isMuted;
  }

  playSpellSound(word: string) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    switch (word.toUpperCase()) {
      case 'HELLO':
      case 'MAGIC':
      case 'STAR':
        // Shimmering mystical arpeggio
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + i * 0.08);

          gain.gain.setValueAtTime(0, t + i * 0.08);
          gain.gain.linearRampToValueAtTime(0.2, t + i * 0.08 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 1.2);

          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + i * 0.08);
          osc.stop(t + i * 0.08 + 1.3);
        });
        break;

      case 'FIRE':
        // Flame roar with filtered noise
        this.playNoise(0.8, 400, 1200);
        break;

      case 'CHIEF':
        // Epic cinematic low sub impact + brass synth
        this.playSubImpact(120, 40, 1.5);
        break;

      case 'JARVIS':
      case 'AI':
        // High-tech sci-fi telemetry chirps
        [1200, 1600, 2400].forEach((f, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + i * 0.06);

          gain.gain.setValueAtTime(0.15, t + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);

          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t + i * 0.06);
          osc.stop(t + i * 0.06 + 0.12);
        });
        break;

      default:
        this.playSubImpact(200, 60, 0.8);
        break;
    }
  }

  playGestureSound(gesture: string) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    if (gesture === 'PINCH') {
      // Electric blip
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.13);
    } else if (gesture === 'OPEN_PALM') {
      // Whoosh
      this.playNoise(0.5, 300, 800);
    } else if (gesture === 'FIST') {
      // Inward rumble
      this.playSubImpact(60, 30, 0.6);
    }
  }

  private playSubImpact(startFreq: number, endFreq: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  private playNoise(duration: number, lowCut: number, highCut: number) {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime((lowCut + highCut) / 2, t);
    filter.Q.setValueAtTime(1.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + duration);
  }
}
