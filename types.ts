export enum SessionMode {
  YOGA = 'YOGA',
  ANXIETY = 'ANXIETY',
  FOCUS = 'FOCUS',
  SLEEP = 'SLEEP'
}

export interface AudioParams {
  baseFreq: number;       // Base frequency in Hz (e.g., 432Hz)
  beatFreq: number;       // Binaural beat difference (e.g., 4Hz for Theta)
  bpm: number;            // Rhythm BPM for breathing/movement
  volume: number;         // 0-1
  harmonicity: number;    // Texture complexity
}

export interface SessionData {
  title: string;
  description: string;
  moodColor: string;      // Hex code
  instruction: string;    // Current guidance
  audio: AudioParams;
}

export interface MotionStats {
  score: number;          // 0-100 movement intensity
  isActive: boolean;
}
