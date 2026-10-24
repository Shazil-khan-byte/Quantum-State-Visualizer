import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { LeftControlPanel } from './components/panels/LeftControlPanel';
import { BlochSphere } from './components/bloch/BlochSphere';
import { RightStatePanel } from './components/panels/RightStatePanel';
import { BottomPanel } from './components/panels/BottomPanel';
import {
  QuantumStateVector,
  BlochCoordinates,
  GateDefinition,
  HistoryRecord,
} from './types/quantum';
import {
  calculateBlochCoordinates,
  applyMatrixToState,
} from './quantum/matrix';
import {
  STANDARD_BASIS_STATES,
  quantumAudio,
} from './quantum/simulator';
import { cOne, cZero } from './quantum/complex';

export default function App() {
  // Current Qubit State: Initialized to |0⟩
  const [currentState, setCurrentState] = useState<QuantumStateVector>({
    alpha: cOne(),
    beta: cZero(),
  });

  // Active gate indicator for animation feedback
  const [activeGateId, setActiveGateId] = useState<string | null>(null);

  // History log for operations and undo
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Compute Bloch Sphere Coordinates derived strictly from state
  const blochCoords = useMemo<BlochCoordinates>(() => {
    return calculateBlochCoordinates(currentState);
  }, [currentState]);

  // Handle Initial State Selection
  const handleSelectInitialState = useCallback(
    (stateKey: string, customState?: QuantumStateVector) => {
      let newState: QuantumStateVector;
      let label = stateKey;

      if (customState) {
        newState = customState;
        label = 'Custom (θ, φ)';
      } else if (STANDARD_BASIS_STATES[stateKey]) {
        newState = STANDARD_BASIS_STATES[stateKey].state;
        label = STANDARD_BASIS_STATES[stateKey].symbol;
      } else {
        newState = { alpha: cOne(), beta: cZero() };
        label = '|0⟩';
      }

      const nextBloch = calculateBlochCoordinates(newState);
      quantumAudio.playGateSound(520);

      setCurrentState(newState);

      // Append initialization record
      setHistory((prev) => [
        ...prev,
        {
          id: `init-${Date.now()}`,
          timestamp: Date.now(),
          gateName: `Set Initial State ${label}`,
          gateSymbol: label,
          previousState: currentState,
          nextState: newState,
          blochCoords: nextBloch,
          description: `Initialized qubit to ${label}`,
        },
      ]);
    },
    [currentState]
  );

  // Handle Applying a Quantum Gate
  const handleApplyGate = useCallback(
    (gate: GateDefinition, param?: number) => {
      setActiveGateId(gate.id);
      setTimeout(() => setActiveGateId(null), 400);

      let matrix;
      if (typeof gate.matrix === 'function') {
        matrix = gate.matrix(param);
      } else {
        matrix = gate.matrix;
      }

      const nextState = applyMatrixToState(matrix, currentState);
      const nextBloch = calculateBlochCoordinates(nextState);

      // Audio feedback
      const freqMap: Record<string, number> = {
        h: 440,
        x: 587.33,
        y: 659.25,
        z: 783.99,
        s: 523.25,
        t: 698.46,
      };
      quantumAudio.playGateSound(freqMap[gate.id] || 493.88);

      setCurrentState(nextState);

      const paramStr = param !== undefined ? `(${(param * (180 / Math.PI)).toFixed(0)}°)` : '';
      setHistory((prev) => [
        ...prev,
        {
          id: `op-${Date.now()}`,
          timestamp: Date.now(),
          gateName: `${gate.name}${paramStr}`,
          gateSymbol: `${gate.symbol}${paramStr}`,
          parameter: param,
          previousState: currentState,
          nextState,
          blochCoords: nextBloch,
          description: gate.description,
        },
      ]);
    },
    [currentState]
  );

  // Handle Wavefunction Collapse from Measurement
  const handleStateCollapsed = useCallback(
    (collapsedState: QuantumStateVector, outcome: '0' | '1') => {
      const nextBloch = calculateBlochCoordinates(collapsedState);
      setCurrentState(collapsedState);

      setHistory((prev) => [
        ...prev,
        {
          id: `measure-${Date.now()}`,
          timestamp: Date.now(),
          gateName: 'Born Measurement',
          gateSymbol: `M: |${outcome}⟩`,
          previousState: currentState,
          nextState: collapsedState,
          blochCoords: nextBloch,
          description: `Wavefunction collapsed into basis state |${outcome}⟩`,
        },
      ]);
    },
    [currentState]
  );

  // Undo Last Gate
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setCurrentState(last.previousState);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    quantumAudio.playGateSound(370);
  }, [history]);

  // Reset to Ground State |0⟩
  const handleReset = useCallback(() => {
    const defaultState: QuantumStateVector = { alpha: cOne(), beta: cZero() };
    setCurrentState(defaultState);
    quantumAudio.playGateSound(330);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header onReset={handleReset} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Top 3-Panel Scientific Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Panel: Initial State & Gate Controls (Col 1-3 on Desktop) */}
          <div className="lg:col-span-3 flex flex-col">
            <LeftControlPanel
              onSelectInitialState={handleSelectInitialState}
              onApplyGate={handleApplyGate}
              onReset={handleReset}
              onUndo={handleUndo}
              canUndo={history.length > 0}
              activeGateId={activeGateId}
            />
          </div>

          {/* Centre Panel: 3D Bloch Sphere (Col 4-8 on Desktop) */}
          <div className="lg:col-span-5 flex flex-col min-h-[460px] sm:min-h-[500px]">
            <BlochSphere
              blochCoords={blochCoords}
              stateVector={currentState}
              isAnimating={activeGateId !== null}
            />
          </div>

          {/* Right Panel: State Vector & Measurement Probabilities (Col 9-12 on Desktop) */}
          <div className="lg:col-span-4 flex flex-col">
            <RightStatePanel
              stateVector={currentState}
              blochCoords={blochCoords}
              onStateCollapsed={handleStateCollapsed}
            />
          </div>
        </div>

        {/* Lower Section: Operation History & Guided Learning Lab */}
        <section className="w-full">
          <BottomPanel
            history={history}
            currentState={currentState}
            blochCoords={blochCoords}
            onSelectInitialState={handleSelectInitialState}
            onApplyGate={handleApplyGate}
            onReset={handleReset}
            onClearHistory={handleClearHistory}
          />
        </section>
      </main>

      {/* Footer / Academic Credentials */}
      <footer className="w-full border-t border-slate-900 bg-[#050810] py-3 text-center text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>B.Tech Design Project: Quantum State Visualizer</span>
          <span>Single-Qubit State Space • Unitary Transformations • Bloch Representation</span>
        </div>
      </footer>
    </div>
  );
}
