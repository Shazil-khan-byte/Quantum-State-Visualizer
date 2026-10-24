import { TestCaseVerification, QuantumStateVector } from '../types/quantum';
import { cOne, cZero, cAbsSq, formatComplex } from './complex';
import {
  GATE_X,
  GATE_H,
  GATE_Z,
  applyMatrixToState,
  calculateBlochCoordinates,
} from './matrix';
import { getMeasurementProbabilities } from './simulator';

const TOLERANCE = 1e-5;

export const UNIVERSITY_TEST_CASES: TestCaseVerification[] = [
  {
    id: 1,
    title: 'Test Case 1: Pauli-X Bit Flip',
    description: 'Start at |0⟩, apply X gate. The result must be |1⟩ with P(0) = 0 and P(1) = 1.',
    expectedOutcome: 'State: |1⟩, P(0)=0.0%, P(1)=100.0%, Bloch z = -1.0',
    runTest: () => {
      // Step 1: Start at |0⟩
      const state0: QuantumStateVector = { alpha: cOne(), beta: cZero() };
      // Step 2: Apply X
      const stateX = applyMatrixToState(GATE_X, state0);
      const coords = calculateBlochCoordinates(stateX);
      const probs = getMeasurementProbabilities(stateX);

      const passed =
        Math.abs(probs.p0 - 0) < TOLERANCE &&
        Math.abs(probs.p1 - 1) < TOLERANCE &&
        Math.abs(coords.z - (-1)) < TOLERANCE &&
        Math.abs(coords.x) < TOLERANCE &&
        Math.abs(coords.y) < TOLERANCE;

      return {
        passed,
        details: `Initial: |0⟩ → X → α=${formatComplex(stateX.alpha)}, β=${formatComplex(stateX.beta)}. P(0)=${probs.p0Percent}%, P(1)=${probs.p1Percent}%, z=${coords.z.toFixed(3)}.`,
        actualValues: {
          p0: probs.p0,
          p1: probs.p1,
          x: coords.x,
          y: coords.y,
          z: coords.z,
        },
      };
    },
  },
  {
    id: 2,
    title: 'Test Case 2: Hadamard Superposition',
    description: 'Start at |0⟩, apply H gate. The state must be (|0⟩ + |1⟩)/√2 with 50% probability for each outcome.',
    expectedOutcome: 'State: (|0⟩ + |1⟩)/√2, P(0)=50.0%, P(1)=50.0%, Bloch x = +1.0',
    runTest: () => {
      const state0: QuantumStateVector = { alpha: cOne(), beta: cZero() };
      const stateH = applyMatrixToState(GATE_H, state0);
      const coords = calculateBlochCoordinates(stateH);
      const probs = getMeasurementProbabilities(stateH);

      const passed =
        Math.abs(probs.p0 - 0.5) < TOLERANCE &&
        Math.abs(probs.p1 - 0.5) < TOLERANCE &&
        Math.abs(coords.x - 1.0) < TOLERANCE &&
        Math.abs(coords.y) < TOLERANCE &&
        Math.abs(coords.z) < TOLERANCE;

      return {
        passed,
        details: `Initial: |0⟩ → H → α=${formatComplex(stateH.alpha)}, β=${formatComplex(stateH.beta)}. P(0)=${probs.p0Percent}%, P(1)=${probs.p1Percent}%, x=${coords.x.toFixed(3)}.`,
        actualValues: {
          p0: probs.p0,
          p1: probs.p1,
          x: coords.x,
          y: coords.y,
          z: coords.z,
        },
      };
    },
  },
  {
    id: 3,
    title: 'Test Case 3: Hadamard Self-Inverse (H · H = I)',
    description: 'Start at |0⟩, apply H twice. The result returns to |0⟩, apart from negligible numerical rounding.',
    expectedOutcome: 'State: |0⟩, P(0)=100.0%, P(1)=0.0%, Bloch z = +1.0',
    runTest: () => {
      const state0: QuantumStateVector = { alpha: cOne(), beta: cZero() };
      const stateH1 = applyMatrixToState(GATE_H, state0);
      const stateH2 = applyMatrixToState(GATE_H, stateH1);
      const coords = calculateBlochCoordinates(stateH2);
      const probs = getMeasurementProbabilities(stateH2);

      const passed =
        Math.abs(probs.p0 - 1.0) < TOLERANCE &&
        Math.abs(probs.p1 - 0.0) < TOLERANCE &&
        Math.abs(coords.z - 1.0) < TOLERANCE &&
        Math.abs(coords.x) < TOLERANCE &&
        Math.abs(coords.y) < TOLERANCE;

      return {
        passed,
        details: `Initial: |0⟩ → H → H → α=${formatComplex(stateH2.alpha)}, β=${formatComplex(stateH2.beta)}. P(0)=${probs.p0Percent}%, P(1)=${probs.p1Percent}%, z=${coords.z.toFixed(3)}.`,
        actualValues: {
          p0: probs.p0,
          p1: probs.p1,
          x: coords.x,
          y: coords.y,
          z: coords.z,
        },
      };
    },
  },
  {
    id: 4,
    title: 'Test Case 4: Pauli-Z Phase Invariance on |0⟩',
    description: 'Start at |0⟩, apply Z gate. The physical state remains |0⟩ (eigenstate of Z with eigenvalue +1).',
    expectedOutcome: 'State: |0⟩, P(0)=100.0%, P(1)=0.0%, Bloch z = +1.0',
    runTest: () => {
      const state0: QuantumStateVector = { alpha: cOne(), beta: cZero() };
      const stateZ = applyMatrixToState(GATE_Z, state0);
      const coords = calculateBlochCoordinates(stateZ);
      const probs = getMeasurementProbabilities(stateZ);

      const passed =
        Math.abs(probs.p0 - 1.0) < TOLERANCE &&
        Math.abs(probs.p1 - 0.0) < TOLERANCE &&
        Math.abs(coords.z - 1.0) < TOLERANCE &&
        Math.abs(coords.x) < TOLERANCE &&
        Math.abs(coords.y) < TOLERANCE;

      return {
        passed,
        details: `Initial: |0⟩ → Z → α=${formatComplex(stateZ.alpha)}, β=${formatComplex(stateZ.beta)}. P(0)=${probs.p0Percent}%, P(1)=${probs.p1Percent}%, z=${coords.z.toFixed(3)}.`,
        actualValues: {
          p0: probs.p0,
          p1: probs.p1,
          x: coords.x,
          y: coords.y,
          z: coords.z,
        },
      };
    },
  },
  {
    id: 5,
    title: 'Test Case 5: H followed by Z (Relative Phase & Axis Inversion)',
    description: 'Start at |0⟩, apply H followed by Z. Relative phase shifts by π, vector flips from +X (|+⟩) to -X (|-⟩).',
    expectedOutcome: 'State: (|0⟩ - |1⟩)/√2 (|-⟩), P(0)=50.0%, P(1)=50.0%, Bloch x = -1.0',
    runTest: () => {
      const state0: QuantumStateVector = { alpha: cOne(), beta: cZero() };
      const stateH = applyMatrixToState(GATE_H, state0);
      const stateHZ = applyMatrixToState(GATE_Z, stateH);
      const coords = calculateBlochCoordinates(stateHZ);
      const probs = getMeasurementProbabilities(stateHZ);

      const passed =
        Math.abs(probs.p0 - 0.5) < TOLERANCE &&
        Math.abs(probs.p1 - 0.5) < TOLERANCE &&
        Math.abs(coords.x - (-1.0)) < TOLERANCE &&
        Math.abs(coords.y) < TOLERANCE &&
        Math.abs(coords.z) < TOLERANCE;

      return {
        passed,
        details: `Initial: |0⟩ → H → Z → α=${formatComplex(stateHZ.alpha)}, β=${formatComplex(stateHZ.beta)}. P(0)=${probs.p0Percent}%, P(1)=${probs.p1Percent}%, x=${coords.x.toFixed(3)}.`,
        actualValues: {
          p0: probs.p0,
          p1: probs.p1,
          x: coords.x,
          y: coords.y,
          z: coords.z,
        },
      };
    },
  },
];
