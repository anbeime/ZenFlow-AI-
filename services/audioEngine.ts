import { AudioParams } from '../types';

export class ZenAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Oscillators
  private oscLeft: OscillatorNode | null = null;
  private oscRight: OscillatorNode | null = null;
  private oscDrone: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private isPlaying: boolean = false;

  constructor() {}

  async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  start(params: AudioParams) {
    if (!this.ctx || !this.masterGain) return;
    if (this.isPlaying) this.stop();

    const t = this.ctx.currentTime;

    // Binaural Beats Setup
    // Left Ear
    this.oscLeft = this.ctx.createOscillator();
    this.oscLeft.type = 'sine';
    this.oscLeft.frequency.setValueAtTime(params.baseFreq, t);
    const panLeft = this.ctx.createStereoPanner();
    panLeft.pan.value = -1;
    
    // Right Ear
    this.oscRight = this.ctx.createOscillator();
    this.oscRight.type = 'sine';
    this.oscRight.frequency.setValueAtTime(params.baseFreq + params.beatFreq, t); // The diff creates the beat
    const panRight = this.ctx.createStereoPanner();
    panRight.pan.value = 1;

    // Drone (Background texture)
    this.oscDrone = this.ctx.createOscillator();
    this.oscDrone.type = 'triangle';
    this.oscDrone.frequency.setValueAtTime(params.baseFreq / 2, t); // Octave down
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.1 * params.harmonicity;

    // LFO for pulsing texture (breathing)
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.value = params.bpm / 60; 
    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.value = 0.1;
    this.lfo.connect(this.lfoGain.gain);

    // Connections
    this.oscLeft.connect(panLeft).connect(this.masterGain);
    this.oscRight.connect(panRight).connect(this.masterGain);
    this.oscDrone.connect(droneGain).connect(this.masterGain);

    // Start
    this.oscLeft.start(t);
    this.oscRight.start(t);
    this.oscDrone.start(t);
    this.lfo.start(t);

    // Fade in
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(0, t);
    this.masterGain.gain.linearRampToValueAtTime(params.volume, t + 2);

    this.isPlaying = true;
  }

  update(params: AudioParams) {
    if (!this.ctx || !this.isPlaying) return;
    const t = this.ctx.currentTime;
    const rampTime = 0.5; // Smooth transition

    if (this.oscLeft) {
      this.oscLeft.frequency.linearRampToValueAtTime(params.baseFreq, t + rampTime);
    }
    if (this.oscRight) {
      this.oscRight.frequency.linearRampToValueAtTime(params.baseFreq + params.beatFreq, t + rampTime);
    }
    if (this.oscDrone) {
        this.oscDrone.frequency.linearRampToValueAtTime(params.baseFreq / 2, t + rampTime);
    }
    if (this.lfo) {
        this.lfo.frequency.linearRampToValueAtTime(params.bpm / 60, t + rampTime);
    }
    if (this.masterGain) {
        this.masterGain.gain.linearRampToValueAtTime(params.volume, t + rampTime);
    }
  }

  stop() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Fade out
    this.masterGain.gain.linearRampToValueAtTime(0, t + 1);

    setTimeout(() => {
        this.oscLeft?.stop();
        this.oscRight?.stop();
        this.oscDrone?.stop();
        this.lfo?.stop();
        this.isPlaying = false;
    }, 1000);
  }
}

export const audioEngine = new ZenAudioEngine();
