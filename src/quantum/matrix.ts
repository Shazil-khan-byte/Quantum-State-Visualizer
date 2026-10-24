import { Complex, Matrix2x2, QuantumStateVector, BlochCoordinates, GateDefinition } from '../types/quantum';
import {
  complex,
  cZero,
  cOne,
  cI,
  cAdd,
  cMul,
  cConj,
  cAbsSq,
  cScale,
} from './complex';

const SQRT1_2 = Math.SQRT1_2; // 1 / sqrt(2) ≈ 0.70710678...

/**
 * Standard Quantum Gates (2x2 Unitary Matrices)
 */

export const GATE_I: Matrix2x2 = [
  [cOne(), cZero()],
  [cZero(), cOne()],
];

export const GATE_X: Matrix2x2 = [
  [cZero(), cOne()],
  [cOne(), cZero()],
];

export const GATE_Y: Matrix2x2 = [
  [cZero(), complex(0, -1)],
  [complex(0, 1), cZero()],
];

export const GATE_Z: Matrix2x2 = [
  [cOne(), cZero()],
  [cZero(), complex(-1, 0)],
];

export const GATE_H: Matrix2x2 = [
  [complex(SQRT1_2, 0), complex(SQRT1_2, 0)],
  [complex(SQRT1_2, 0), complex(-SQRT1_2, 0)],
];

export const GATE_S: Matrix2x2 = [
  [cOne(), cZero()],
  [cZero(), cI()],
];

export const GATE_S_DAGGER: Matrix2x2 = [
  [cOne(), cZero()],
  [cZero(), complex(0, -1)],
];

export const GATE_T: Matrix2x2 = [
  [cOne(), cZero()],
  [cZero(), complex(SQRT1_2, SQRT1_2)], // e^(i*pi/4)
];

export const GATE_T_DAGGER: Matrix2x2 = [
  [cOne(), cZero()],
  [cZero(), complex(SQRT1_2, -SQRT1_2)], // e^(-i*pi/4)
];

export function createRxGate(theta: number): Matrix2x2 {
  const half = theta / 2;
  const cos = Math.cos(half);
  const sin = Math.sin(half);
  return [
    [complex(cos, 0), complex(0, -sin)],
    [complex(0, -sin), complex(cos, 0)],
  ];
}

export function createRyGate(theta: number): Matrix2x2 {
  const half = theta / 2;
  const cos = Math.cos(half);
  const sin = Math.sin(half);
  return [
    [complex(cos, 0), complex(-sin, 0)],
    [complex(sin, 0), complex(cos, 0)],
  ];
}

export function createRzGate(theta: number): Matrix2x2 {
  const half = theta / 2;
  return [
    [complex(Math.cos(-half), Math.sin(-half)), cZero()],
    [cZero(), complex(Math.cos(half), Math.sin(half))],
  ];
}

export function createPhaseGate(lambda: number): Matrix2x2 {
  return [
    [cOne(), cZero()],
    [cZero(), complex(Math.cos(lambda), Math.sin(lambda))],
  ];
}

/**
 * Multiply 2x2 matrix with 2x1 state vector:
 * |ψ_new⟩ = U |ψ⟩
 */
export function applyMatrixToState(
  matrix: Matrix2x2,
  state: QuantumStateVector
): QuantumStateVector {
  const [[m00, m01], [m10, m11]] = matrix;

  const alphaNew = cAdd(cMul(m00, state.alpha), cMul(m01, state.beta));
  const betaNew = cAdd(cMul(m10, state.alpha), cMul(m11, state.beta));

  return normalizeState({ alpha: alphaNew, beta: betaNew });
}

/**
 * Normalizes a state vector such that |alpha|^2 + |beta|^2 = 1
 */
export function normalizeState(state: QuantumStateVector): QuantumStateVector {
  const normSq = cAbsSq(state.alpha) + cAbsSq(state.beta);
  if (normSq === 0) {
    return { alpha: cOne(), beta: cZero() };
  }
  const norm = Math.sqrt(normSq);
  return {
    alpha: cScale(state.alpha, 1 / norm),
    beta: cScale(state.beta, 1 / norm),
  };
}

/**
 * Calculates Bloch Sphere coordinates (x, y, z, theta, phi) from state vector
 * Coordinates formula for pure state:
 * x = 2 * Re(alpha* * beta)
 * y = 2 * Im(alpha* * beta)
 * z = |alpha|^2 - |beta|^2
 */
export function calculateBlochCoordinates(state: QuantumStateVector): BlochCoordinates {
  const { alpha, beta } = state;
  const alphaConj = cConj(alpha);
  const alphaConjBeta = cMul(alphaConj, beta);

  let x = 2 * alphaConjBeta.re;
  let y = 2 * alphaConjBeta.im;
  let z = cAbsSq(alpha) - cAbsSq(beta);

  // Clean numerical floating precision
  if (Math.abs(x) < 1e-12) x = 0;
  if (Math.abs(y) < 1e-12) y = 0;
  if (Math.abs(z) < 1e-12) z = 0;

  // Clamp to unit sphere
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r > 0 && Math.abs(r - 1) > 1e-6) {
    x /= r;
    y /= r;
    z /= r;
  }

  const clampedZ = Math.max(-1, Math.min(1, z));
  const theta = Math.acos(clampedZ);
  let phi = Math.atan2(y, x);
  if (phi < 0) {
    phi += 2 * Math.PI;
  }

  return { x, y, z, theta, phi };
}

/**
 * Create state vector from Bloch Sphere spherical angles theta, phi
 * |ψ⟩ = cos(θ/2) |0⟩ + e^(iφ) sin(θ/2) |1⟩
 */
export function stateFromBlochAngles(theta: number, phi: number): QuantumStateVector {
  const half = theta / 2;
  const cos = Math.cos(half);
  const sin = Math.sin(half);
  const alpha = complex(cos, 0);
  const beta = complex(sin * Math.cos(phi), sin * Math.sin(phi));
  return normalizeState({ alpha, beta });
}

/**
 * Predefined standard quantum gate registry with metadata
 */
export const AVAILABLE_GATES: GateDefinition[] = [
  {
    id: 'h',
    name: 'Hadamard',
    symbol: 'H',
    category: 'hadamard',
    description: 'Creates equal superposition. Rotates by π around (X+Z)/√2 axis.',
    matrix: GATE_H,
    color: '#06b6d4', // Cyan
  },
  {
    id: 'x',
    name: 'Pauli-X (NOT)',
    symbol: 'X',
    category: 'pauli',
    description: 'Bit-flip gate. Swaps |0⟩ and |1⟩. 180° rotation around X-axis.',
    matrix: GATE_X,
    color: '#f43f5e', // Rose
  },
  {
    id: 'y',
    name: 'Pauli-Y',
    symbol: 'Y',
    category: 'pauli',
    description: 'Bit and phase flip. 180° rotation around Y-axis.',
    matrix: GATE_Y,
    color: '#10b981', // Emerald
  },
  {
    id: 'z',
    name: 'Pauli-Z (Phase)',
    symbol: 'Z',
    category: 'pauli',
    description: 'Phase-flip gate. Maps |1⟩ to -|1⟩. 180° rotation around Z-axis.',
    matrix: GATE_Z,
    color: '#8b5cf6', // Violet
  },
  {
    id: 's',
    name: 'Phase (S / √Z)',
    symbol: 'S',
    category: 'phase',
    description: 'Quarter turn phase shift (π/2). Multiplies |1⟩ by i.',
    matrix: GATE_S,
    color: '#38bdf8', // Light Blue
  },
  {
    id: 's_dag',
    name: 'S-Dagger (S†)',
    symbol: 'S†',
    category: 'phase',
    description: 'Inverse quarter turn phase shift (-π/2). Multiplies |1⟩ by -i.',
    matrix: GATE_S_DAGGER,
    color: '#38bdf8',
  },
  {
    id: 't',
    name: 'T Gate (π/8)',
    symbol: 'T',
    category: 'phase',
    description: 'Eighth turn phase shift (π/4). Essential for universal fault-tolerant computation.',
    matrix: GATE_T,
    color: '#ec4899', // Pink
  },
  {
    id: 't_dag',
    name: 'T-Dagger (T†)',
    symbol: 'T†',
    category: 'phase',
    description: 'Inverse eighth turn phase shift (-π/4).',
    matrix: GATE_T_DAGGER,
    color: '#ec4899',
  },
  {
    id: 'rx',
    name: 'Rotation-X',
    symbol: 'Rx',
    category: 'rotation',
    description: 'Continuous rotation around X-axis by angle θ.',
    matrix: (param: number = Math.PI / 2) => createRxGate(param),
    hasParameter: true,
    paramName: 'θ (angle)',
    defaultParam: Math.PI / 2,
    paramMin: -Math.PI,
    paramMax: Math.PI,
    paramStep: Math.PI / 12,
    color: '#fb923c', // Orange
  },
  {
    id: 'ry',
    name: 'Rotation-Y',
    symbol: 'Ry',
    category: 'rotation',
    description: 'Continuous rotation around Y-axis by angle θ.',
    matrix: (param: number = Math.PI / 2) => createRyGate(param),
    hasParameter: true,
    paramName: 'θ (angle)',
    defaultParam: Math.PI / 2,
    paramMin: -Math.PI,
    paramMax: Math.PI,
    paramStep: Math.PI / 12,
    color: '#34d399', // Mint
  },
  {
    id: 'rz',
    name: 'Rotation-Z',
    symbol: 'Rz',
    category: 'rotation',
    description: 'Continuous rotation around Z-axis by angle θ.',
    matrix: (param: number = Math.PI / 2) => createRzGate(param),
    hasParameter: true,
    paramName: 'θ (angle)',
    defaultParam: Math.PI / 2,
    paramMin: -Math.PI,
    paramMax: Math.PI,
    paramStep: Math.PI / 12,
    color: '#c084fc', // Purple
  },
];
