/**
 * Procedural Web Audio synthesizer for Playdead INSIDE-style industrial stealth atmosphere.
 * Zero external asset dependencies; works instantly on user interaction.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  
  // Continuous drone oscillators
  private ambientDrone1: OscillatorNode | null = null;
  private ambientDrone2: OscillatorNode | null = null;
  private ambientNoiseNode: AudioNode | null = null;
  private tensionGain: GainNode | null = null;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.startAmbientSoundscape();
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed or blocked:', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  private startAmbientSoundscape() {
    if (!this.ctx || !this.ambientGain) return;

    // Sub-bass drone (48Hz low industrial hum)
    this.ambientDrone1 = this.ctx.createOscillator();
    this.ambientDrone1.type = 'sawtooth';
    this.ambientDrone1.frequency.setValueAtTime(48, this.ctx.currentTime);

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(110, this.ctx.currentTime);

    const droneGain1 = this.ctx.createGain();
    droneGain1.gain.setValueAtTime(0.25, this.ctx.currentTime);

    this.ambientDrone1.connect(filter1);
    filter1.connect(droneGain1);
    droneGain1.connect(this.ambientGain);
    this.ambientDrone1.start();

    // Secondary dissonant drone (72Hz hollow iron resonance)
    this.ambientDrone2 = this.ctx.createOscillator();
    this.ambientDrone2.type = 'sine';
    this.ambientDrone2.frequency.setValueAtTime(72, this.ctx.currentTime);

    const droneGain2 = this.ctx.createGain();
    droneGain2.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.ambientDrone2.connect(droneGain2);
    droneGain2.connect(this.ambientGain);
    this.ambientDrone2.start();

    // Wind / industrial air noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(3, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ambientGain);
    whiteNoise.start();
    this.ambientNoiseNode = whiteNoise;

    // Tension drone when chased
    const tensionOsc = this.ctx.createOscillator();
    tensionOsc.type = 'sawtooth';
    tensionOsc.frequency.setValueAtTime(95, this.ctx.currentTime);

    const tensionFilter = this.ctx.createBiquadFilter();
    tensionFilter.type = 'lowpass';
    tensionFilter.frequency.setValueAtTime(240, this.ctx.currentTime);

    this.tensionGain = this.ctx.createGain();
    this.tensionGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    tensionOsc.connect(tensionFilter);
    tensionFilter.connect(this.tensionGain);
    if (this.masterGain) {
      this.tensionGain.connect(this.masterGain);
    }
    tensionOsc.start();
  }

  // Update dynamic tension based on dog awareness/proximity
  public setTension(level: number) {
    if (!this.ctx || !this.tensionGain || this.isMuted) return;
    const clamped = Math.max(0, Math.min(1, level));
    this.tensionGain.gain.setTargetAtTime(clamped * 0.35, this.ctx.currentTime, 0.2);
  }

  // Boy footsteps: subtle, physical, grounded
  public playFootstep(isCrouching: boolean, surface: 'metal' | 'concrete' | 'water' = 'concrete') {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    if (surface === 'water') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
    } else if (surface === 'metal') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(180, now);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
    }

    const volume = isCrouching ? 0.04 : 0.16;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isCrouching ? 0.05 : 0.09));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Jump takeoff
  public playJump() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Landing impact
  public playLand(hard: boolean = false) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hard ? 120 : 80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + (hard ? 0.18 : 0.09));

    gain.gain.setValueAtTime(hard ? 0.35 : 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (hard ? 0.2 : 0.1));

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Heavy object drag / push
  public playCrateDrag() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Steam valve turning & pressure hiss
  public playValveTurn() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Metallic squeak
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(480, now + 0.08);
    osc.frequency.linearRampToValueAtTime(260, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  // Continuous steam jet burst
  public playSteamBurst(duration: number = 0.5) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  // Steam whistle distraction
  public playSteamWhistle() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Dual-tone harmonic pipe whistle
    [587.33, 783.99].forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.03, now + 0.4);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.62);
    });
  }

  // Mechanical Dog: Alerted growl / optic eye lock-on
  public playDogAlert() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // High mechanical click + optic whine
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);

    // Deep pneumatic intake snarl
    const snarlOsc = this.ctx.createOscillator();
    const snarlGain = this.ctx.createGain();
    snarlOsc.type = 'sawtooth';
    snarlOsc.frequency.setValueAtTime(85, now + 0.04);
    snarlOsc.frequency.exponentialRampToValueAtTime(50, now + 0.28);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(260, now);
    filter.Q.setValueAtTime(2, now);

    snarlGain.gain.setValueAtTime(0.24, now + 0.04);
    snarlGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    snarlOsc.connect(filter);
    filter.connect(snarlGain);
    snarlGain.connect(this.sfxGain);
    snarlOsc.start(now + 0.04);
    snarlOsc.stop(now + 0.32);
  }

  // Mechanical Dog: Terrifying pursuit bark / mechanical horn howl
  public playDogBark() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Brass resonator metallic bark
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.24);

    // Hydraulic valve snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(90, now);
    snapGain.gain.setValueAtTime(0.25, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    snapOsc.connect(snapGain);
    snapGain.connect(this.sfxGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.09);
  }

  // Dog pounce & player caught (INSIDE's instant dark cinematic sting)
  public playCaptureSting() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Heavy low frequency boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.5);

    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.65);

    // Dissonant iron screech
    const screechOsc = this.ctx.createOscillator();
    const screechGain = this.ctx.createGain();
    screechOsc.type = 'sawtooth';
    screechOsc.frequency.setValueAtTime(180, now);
    screechOsc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    screechGain.gain.setValueAtTime(0.3, now);
    screechGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    screechOsc.connect(screechGain);
    screechGain.connect(this.sfxGain);
    screechOsc.start(now);
    screechOsc.stop(now + 0.42);
  }

  // Checkpoint reached or puzzle cleared
  public playCheckpointChord() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Deep melancholic harmonic triad
    [130.81, 164.81, 196.00].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.01, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.06 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 1.3);
    });
  }
}

export const soundEngine = new SoundEngine();
