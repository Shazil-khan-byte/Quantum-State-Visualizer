import { LabExperiment } from '../types/quantum';
import { cAbsSq } from './complex';

export const GUIDED_EXPERIMENTS: LabExperiment[] = [
  {
    id: 'exp-1',
    title: 'Lab 1: Quantum Bit-Flip (Pauli-X)',
    subtitle: 'Classical vs Quantum NOT operation',
    difficulty: 'Beginner',
    description: 'Investigate how the Pauli-X gate acts as the quantum equivalent of the classical NOT gate, rotating the state vector by 180° around the X-axis.',
    learningGoal: 'Verify that X|0⟩ = |1⟩, X|1⟩ = |0⟩, and X · X = I (the gate is unitary and self-inverse).',
    initialState: '0',
    steps: [
      {
        instruction: 'Initialize qubit in the ground state |0⟩.',
        explanation: 'The state vector points directly to the North Pole (z = +1.0). The probability of measuring 0 is 100%.',
        expectedCondition: (_s, coords) => coords.z > 0.99,
        actionHint: 'Click |0⟩ in the Initial State panel.',
      },
      {
        instruction: 'Apply the Pauli-X gate.',
        explanation: 'The Pauli-X operator swaps the amplitudes α and β. The Bloch vector rotates to the South Pole (z = -1.0), representing state |1⟩ with 100% P(1).',
        expectedCondition: (_s, coords) => coords.z < -0.99,
        actionHint: 'Click the X gate button.',
      },
      {
        instruction: 'Apply the Pauli-X gate again.',
        explanation: 'Because X² = I, applying X a second time flips the bit back to |0⟩ at the North Pole.',
        expectedCondition: (_s, coords) => coords.z > 0.99,
        actionHint: 'Click the X gate button once more.',
      },
    ],
  },
  {
    id: 'exp-2',
    title: 'Lab 2: Creating Superposition (Hadamard Gate)',
    subtitle: 'From definite state to equal superposition',
    difficulty: 'Beginner',
    description: 'Discover how the Hadamard (H) gate transforms a deterministic basis state into an equal superposition of |0⟩ and |1⟩ with 50% measurement likelihood.',
    learningGoal: 'Understand the state |+⟩ = (|0⟩ + |1⟩)/√2 and how it maps to the +X axis on the Bloch sphere equator.',
    initialState: '0',
    steps: [
      {
        instruction: 'Ensure the qubit is at |0⟩.',
        explanation: 'Starting with a definite computational basis state before creating coherence.',
        expectedCondition: (_s, coords) => coords.z > 0.99,
        actionHint: 'Select |0⟩.',
      },
      {
        instruction: 'Apply the Hadamard (H) gate.',
        explanation: 'The state becomes |+⟩ = (|0⟩ + |1⟩)/√2. The Bloch vector rotates 90° down onto the equator pointing along +X (x = +1.0). Note that P(0) = 50% and P(1) = 50%.',
        expectedCondition: (_s, coords) => Math.abs(coords.x - 1.0) < 0.05 && Math.abs(coords.z) < 0.05,
        actionHint: 'Click the H gate button.',
      },
      {
        instruction: 'Trigger a Quantum Measurement.',
        explanation: 'A measurement irreversibly collapses the superposition into either |0⟩ or |1⟩ with equal 50% likelihood according to Born\'s rule.',
        expectedCondition: (_s, coords) => Math.abs(coords.z) > 0.95,
        actionHint: 'Click "Measure Qubit" in the right panel.',
      },
    ],
  },
  {
    id: 'exp-3',
    title: 'Lab 3: Quantum Interference (H · H = I)',
    subtitle: 'Constructive and destructive probability interference',
    difficulty: 'Intermediate',
    description: 'Demonstrate wave-like quantum interference: two consecutive Hadamard gates cancel each other out completely without measuring in between.',
    learningGoal: 'Appreciate that quantum amplitudes interfere constructively for |0⟩ and destructively for |1⟩.',
    initialState: '0',
    steps: [
      {
        instruction: 'Initialize state |0⟩.',
        explanation: 'We begin with zero phase and zero amplitude on |1⟩.',
        expectedCondition: (_s, coords) => coords.z > 0.99,
        actionHint: 'Click |0⟩.',
      },
      {
        instruction: 'Apply the first H gate.',
        explanation: 'The state is now in superposition |+⟩ = (|0⟩ + |1⟩)/√2 on the equator.',
        expectedCondition: (_s, coords) => Math.abs(coords.x - 1.0) < 0.05,
        actionHint: 'Click H.',
      },
      {
        instruction: 'Apply the second H gate without measuring.',
        explanation: 'Notice how the state returns deterministically to |0⟩! Unlike classical probability where two coin flips stay random, quantum amplitudes can interfere and return to certainty.',
        expectedCondition: (_s, coords) => coords.z > 0.99,
        actionHint: 'Click H again.',
      },
    ],
  },
  {
    id: 'exp-4',
    title: 'Lab 4: Phase Flip vs Bit Flip (Pauli-Z)',
    subtitle: 'Relative phase and equatorial orientation',
    difficulty: 'Intermediate',
    description: 'Explore the subtle difference between bit flips (X) and phase flips (Z). Notice how Z has no observable effect on |0⟩, but flips the phase on |+⟩ to |–⟩.',
    learningGoal: 'Distinguish between global phase and relative phase on the Bloch Sphere.',
    initialState: '0',
    steps: [
      {
        instruction: 'Apply Z on state |0⟩.',
        explanation: 'Z|0⟩ = +1|0⟩. The vector remains at the North Pole! P(0) stays 100% because |0⟩ is an eigenstate of Z with eigenvalue +1.',
        expectedCondition: (_s, coords) => coords.z > 0.99,
        actionHint: 'Click Z gate on state |0⟩.',
      },
      {
        instruction: 'Apply H to move to the superposition state |+⟩.',
        explanation: 'Vector now points to (+1, 0, 0) along the +X axis.',
        expectedCondition: (_s, coords) => Math.abs(coords.x - 1.0) < 0.05,
        actionHint: 'Click H gate.',
      },
      {
        instruction: 'Now apply the Z gate on |+⟩.',
        explanation: 'Z transforms |+⟩ = (|0⟩ + |1⟩)/√2 into |–⟩ = (|0⟩ - |1⟩)/√2! The relative phase shifted by π, and the Bloch vector flipped 180° along the equator to -X (x = -1.0).',
        expectedCondition: (_s, coords) => Math.abs(coords.x - (-1.0)) < 0.05,
        actionHint: 'Click Z gate.',
      },
    ],
  },
  {
    id: 'exp-5',
    title: 'Lab 5: Journey Around the Complex Equator',
    subtitle: 'Complex amplitudes and the Y / S gates',
    difficulty: 'Advanced',
    description: 'Travel along the equator of the Bloch sphere to see how imaginary numbers in amplitudes manifest as directions along the Y-axis.',
    learningGoal: 'Connect complex amplitudes e^(iφ) with azimuthal angle φ on the Bloch sphere.',
    initialState: '0',
    steps: [
      {
        instruction: 'Start at |0⟩ and apply H to reach |+⟩.',
        explanation: 'State |+⟩ has zero relative phase (φ = 0, points along +X).',
        expectedCondition: (_s, coords) => Math.abs(coords.x - 1.0) < 0.05,
        actionHint: 'Click |0⟩ then H.',
      },
      {
        instruction: 'Apply the S gate (π/2 phase rotation).',
        explanation: 'The S gate multiplies |1⟩ by i. The state becomes |+i⟩ = (|0⟩ + i|1⟩)/√2. The vector rotates 90° along the equator to +Y (y = +1.0)!',
        expectedCondition: (_s, coords) => Math.abs(coords.y - 1.0) < 0.05,
        actionHint: 'Click S gate.',
      },
      {
        instruction: 'Apply the S gate again.',
        explanation: 'Since S² = Z, applying S again adds another π/2 phase (total π phase), moving the vector to |–⟩ on the -X axis (x = -1.0).',
        expectedCondition: (_s, coords) => Math.abs(coords.x - (-1.0)) < 0.05,
        actionHint: 'Click S gate.',
      },
    ],
  },
];
