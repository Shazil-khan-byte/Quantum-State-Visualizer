/**
 * Core quantum computing types for the Quantum State Visualizer
 */

export interface Complex {
  re: number;
  im: number;
}

export type Matrix2x2 = [
  [Complex, Complex],
  [Complex, Complex]
];

export interface QuantumStateVector {
  alpha: Complex; // amplitude for |0⟩
  beta: Complex;  // amplitude for |1⟩
}

export interface BlochCoordinates {
  x: number; // 2 * Re(alpha* * beta)
  y: number; // 2 * Im(alpha* * beta)
  z: number; // |alpha|^2 - |beta|^2
  theta: number; // Polar angle [0, PI]
  phi: number;   // Azimuthal angle [0, 2*PI)
}

export interface GateDefinition {
  id: string;
  name: string;
  symbol: string;
  category: 'pauli' | 'hadamard' | 'phase' | 'rotation' | 'measurement';
  description: string;
  matrix: Matrix2x2 | ((param?: number) => Matrix2x2);
  hasParameter?: boolean;
  paramName?: string;
  defaultParam?: number;
  paramMin?: number;
  paramMax?: number;
  paramStep?: number;
  color: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  gateName: string;
  gateSymbol: string;
  parameter?: number;
  previousState: QuantumStateVector;
  nextState: QuantumStateVector;
  blochCoords: BlochCoordinates;
  description: string;
}

export interface LabStep {
  instruction: string;
  explanation: string;
  expectedCondition?: (state: QuantumStateVector, coords: BlochCoordinates) => boolean;
  actionHint?: string;
}

export interface LabExperiment {
  id: string;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  learningGoal: string;
  initialState: '0' | '1' | '+' | '-' | 'i' | '-i';
  steps: LabStep[];
}

export interface TestCaseVerification {
  id: number;
  title: string;
  description: string;
  expectedOutcome: string;
  runTest: () => {
    passed: boolean;
    details: string;
    actualValues: {
      p0: number;
      p1: number;
      x: number;
      y: number;
      z: number;
    };
  };
}
