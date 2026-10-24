import { QuantumStateVector, BlochCoordinates } from '../types/quantum';
import { complex, cOne, cZero, cAbsSq } from './complex';
import { calculateBlochCoordinates } from './matrix';

const SQRT1_2 = Math.SQRT1_2;

export const STANDARD_BASIS_STATES: Record<string, {
  name: string;
  symbol: string;
  latex: string;
  state: QuantumStateVector;
  description: string;
}> = {
  '0': {
    name: 'Ground State |0⟩',
    symbol: '|0⟩',
    latex: '|0\\rangle',
    state: { alpha: cOne(), beta: cZero() },
    description: 'Computational basis state |0⟩. Located at the North Pole (z = +1).',
  },
  '1': {
    name: 'Excited State |1⟩',
    symbol: '|1⟩',
    latex: '|1\\rangle',
    state: { alpha: cZero(), beta: cOne() },
    description: 'Computational basis state |1⟩. Located at the South Pole (z = -1).',
  },
  '+': {
    name: 'Plus State |+⟩',
    symbol: '|+⟩',
    latex: '|+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}',
    state: { alpha: complex(SQRT1_2, 0), beta: complex(SQRT1_2, 0) },
    description: 'Equal superposition state with zero relative phase. Located on the +X axis.',
  },
  '-': {
    name: 'Minus State |-⟩',
    symbol: '|-⟩',
    latex: '|-\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}}',
    state: { alpha: complex(SQRT1_2, 0), beta: complex(-SQRT1_2, 0) },
    description: 'Equal superposition state with π relative phase. Located on the -X axis.',
  },
  'i': {
    name: 'Positive Imaginary |+i⟩',
    symbol: '|i⟩',
    latex: '|+i\\rangle = \\frac{|0\\rangle + i|1\\rangle}{\\sqrt{2}}',
    state: { alpha: complex(SQRT1_2, 0), beta: complex(0, SQRT1_2) },
    description: 'Superposition with +π/2 relative phase. Located on the +Y axis.',
  },
  '-i': {
    name: 'Negative Imaginary |-i⟩',
    symbol: '|-i⟩',
    latex: '|-i\\rangle = \\frac{|0\\rangle - i|1\\rangle}{\\sqrt{2}}',
    state: { alpha: complex(SQRT1_2, 0), beta: complex(0, -SQRT1_2) },
    description: 'Superposition with -π/2 (or 3π/2) relative phase. Located on the -Y axis.',
  },
};

/**
 * Computes exact theoretical measurement probabilities
 * P(0) = |alpha|^2, P(1) = |beta|^2
 * Guarantees sum equals 1.0 and neither is < 0 or > 1.
 */
export function getMeasurementProbabilities(state: QuantumStateVector): {
  p0: number;
  p1: number;
  p0Percent: string;
  p1Percent: string;
} {
  let p0 = cAbsSq(state.alpha);
  let p1 = cAbsSq(state.beta);

  const total = p0 + p1;
  if (total > 0) {
    p0 = p0 / total;
    p1 = p1 / total;
  } else {
    p0 = 1;
    p1 = 0;
  }

  // Numerical clamp
  p0 = Math.max(0, Math.min(1, p0));
  p1 = Math.max(0, Math.min(1, p1));

  // Ensure they add up exactly to 1.0
  p1 = 1 - p0;

  return {
    p0,
    p1,
    p0Percent: (p0 * 100).toFixed(1),
    p1Percent: (p1 * 100).toFixed(1),
  };
}

/**
 * Simulates a single quantum measurement projection (wavefunction collapse)
 * Projects the qubit irreversibly into either |0⟩ or |1⟩ according to Born's rule.
 */
export function measureQubit(state: QuantumStateVector): {
  outcome: '0' | '1';
  collapsedState: QuantumStateVector;
  blochCoords: BlochCoordinates;
} {
  const { p0 } = getMeasurementProbabilities(state);
  const randomVal = Math.random();
  const outcome: '0' | '1' = randomVal < p0 ? '0' : '1';

  const collapsedState: QuantumStateVector = outcome === '0'
    ? { alpha: cOne(), beta: cZero() }
    : { alpha: cZero(), beta: cOne() };

  const blochCoords = calculateBlochCoordinates(collapsedState);

  return {
    outcome,
    collapsedState,
    blochCoords,
  };
}

/**
 * Simulates batch sampling (shots) over the current state
 * Returns counts, empirical percentages, and theoretical expectations
 */
export function sampleMeasurementShots(
  state: QuantumStateVector,
  shotCount: number = 1000
): {
  shotCount: number;
  count0: number;
  count1: number;
  empiricalP0: number;
  empiricalP1: number;
  theoreticalP0: number;
  theoreticalP1: number;
} {
  const { p0, p1 } = getMeasurementProbabilities(state);
  let count0 = 0;

  for (let i = 0; i < shotCount; i++) {
    if (Math.random() < p0) {
      count0++;
    }
  }

  const count1 = shotCount - count0;
  return {
    shotCount,
    count0,
    count1,
    empiricalP0: count0 / shotCount,
    empiricalP1: count1 / shotCount,
    theoreticalP0: p0,
    theoreticalP1: p1,
  };
}

/**
 * Procedural Web Audio synthesizer for tactile academic UI feedback
 */
class QuantumAudioService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Sound when a quantum gate is applied
   */
  public playGateSound(frequency: number = 440) {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Audio playback fails gracefully if blocked by browser policy
    }
  }

  /**
   * Sound when state collapses during quantum measurement
   */
  public playMeasurementCollapse(outcome: '0' | '1') {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = outcome === '0' ? 'triangle' : 'square';
      const startFreq = outcome === '0' ? 523.25 : 329.63; // C5 or E4
      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(startFreq * (outcome === '0' ? 1.2 : 0.8), this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Audio fails gracefully
    }
  }
}

export const quantumAudio = new QuantumAudioService();
