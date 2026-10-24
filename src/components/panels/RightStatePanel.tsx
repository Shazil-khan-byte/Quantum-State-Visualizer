import React, { useState } from 'react';
import { QuantumStateVector, BlochCoordinates } from '../../types/quantum';
import { formatComplex, cAbs, cArg, cAbsSq } from '../../quantum/complex';
import {
  getMeasurementProbabilities,
  sampleMeasurementShots,
  measureQubit,
  quantumAudio,
} from '../../quantum/simulator';
import {
  Zap,
  BarChart3,
  CheckCircle2,
  Activity,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface RightStatePanelProps {
  stateVector: QuantumStateVector;
  blochCoords: BlochCoordinates;
  onStateCollapsed: (collapsedState: QuantumStateVector, outcome: '0' | '1') => void;
}

// Mini 2D Complex Phasor component for displaying amplitude in complex plane
const ComplexPhasorCircle: React.FC<{
  re: number;
  im: number;
  label: string;
  color: string;
}> = ({ re, im, label, color }) => {
  const size = 68;
  const center = size / 2;
  const radius = center - 6;

  // Clamped coordinates inside the unit circle
  const px = center + re * radius;
  const py = center - im * radius; // Invert SVG y

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[68px] h-[68px] bg-slate-950 rounded-full border border-slate-800 p-1">
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
          {/* Unit circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          {/* Axes */}
          <line x1={center} y1={4} x2={center} y2={size - 4} stroke="#334155" strokeWidth="1" />
          <line x1={4} y1={center} x2={size - 4} y2={center} stroke="#334155" strokeWidth="1" />

          {/* Phasor line */}
          <line
            x1={center}
            y1={center}
            x2={px}
            y2={py}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Phasor point */}
          <circle cx={px} cy={py} r="3" fill={color} />
        </svg>
      </div>
      <span className="text-[10px] font-mono mt-1 text-slate-400">{label}</span>
    </div>
  );
};

export const RightStatePanel: React.FC<RightStatePanelProps> = ({
  stateVector,
  blochCoords,
  onStateCollapsed,
}) => {
  const [shotResults, setShotResults] = useState<{
    shotCount: number;
    count0: number;
    count1: number;
    empiricalP0: number;
    empiricalP1: number;
    theoreticalP0: number;
    theoreticalP1: number;
  } | null>(null);

  const [lastMeasuredOutcome, setLastMeasuredOutcome] = useState<'0' | '1' | null>(null);
  const [isSampling, setIsSampling] = useState<boolean>(false);

  const probs = getMeasurementProbabilities(stateVector);

  const alphaMag = cAbs(stateVector.alpha);
  const alphaPhase = cArg(stateVector.alpha);
  const betaMag = cAbs(stateVector.beta);
  const betaPhase = cArg(stateVector.beta);

  const normSum = (cAbsSq(stateVector.alpha) + cAbsSq(stateVector.beta)).toFixed(4);

  // Single Quantum Measurement
  const handleSingleMeasurement = () => {
    const { outcome, collapsedState } = measureQubit(stateVector);
    quantumAudio.playMeasurementCollapse(outcome);
    setLastMeasuredOutcome(outcome);
    onStateCollapsed(collapsedState, outcome);

    // Reset last measurement indicator after 3 seconds
    setTimeout(() => {
      setLastMeasuredOutcome(null);
    }, 2800);
  };

  // Run Batch Shots (100 or 1000)
  const handleRunShots = (shots: number) => {
    setIsSampling(true);
    quantumAudio.playGateSound(660);

    setTimeout(() => {
      const results = sampleMeasurementShots(stateVector, shots);
      setShotResults(results);
      setIsSampling(false);
    }, 200);
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4 text-slate-100">
      {/* 1. Quantum State Vector Display */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono">
              State Vector |ψ⟩
            </h3>
          </div>
          <div className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            <span>Σ |c|² = {normSum}</span>
          </div>
        </div>

        {/* Dirac Equation Display */}
        <div className="my-2 p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-center overflow-x-auto">
          <div className="text-xs text-slate-400 mb-1">State in Computational Basis:</div>
          <div className="text-sm font-semibold text-slate-100 tracking-wide flex items-center justify-center flex-wrap gap-1">
            <span className="text-cyan-400 font-bold">|ψ⟩</span>
            <span>=</span>
            <span className="text-violet-300">({formatComplex(stateVector.alpha)})</span>
            <span className="text-slate-400">|0⟩</span>
            <span>+</span>
            <span className="text-rose-300">({formatComplex(stateVector.beta)})</span>
            <span className="text-slate-400">|1⟩</span>
          </div>
        </div>

        {/* Complex Amplitudes Breakdown with Phasors */}
        <div className="grid grid-cols-2 gap-2 mt-3 font-mono">
          {/* Alpha (|0⟩ amplitude) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-violet-900/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-violet-300">Amplitude α (|0⟩)</div>
              <div className="text-xs text-slate-200 mt-0.5">
                {formatComplex(stateVector.alpha)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                |α| = {alphaMag.toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-400">
                ∠ = {(alphaPhase * (180 / Math.PI)).toFixed(0)}°
              </div>
            </div>
            <ComplexPhasorCircle
              re={stateVector.alpha.re}
              im={stateVector.alpha.im}
              label="α phasor"
              color="#a78bfa"
            />
          </div>

          {/* Beta (|1⟩ amplitude) */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-rose-900/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-rose-300">Amplitude β (|1⟩)</div>
              <div className="text-xs text-slate-200 mt-0.5">
                {formatComplex(stateVector.beta)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                |β| = {betaMag.toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-400">
                ∠ = {(betaPhase * (180 / Math.PI)).toFixed(0)}°
              </div>
            </div>
            <ComplexPhasorCircle
              re={stateVector.beta.re}
              im={stateVector.beta.im}
              label="β phasor"
              color="#fb7185"
            />
          </div>
        </div>
      </div>

      {/* 2. Measurement Probabilities & Collapse Tool */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono">
                Measurement Probabilities
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">P = |amplitude|²</span>
          </div>

          {/* Probability Bar for |0⟩ */}
          <div className="space-y-1 mb-3">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-violet-300 font-semibold">P(0) = |α|²</span>
              <span className="text-violet-300 font-bold">{probs.p0Percent}%</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-400 transition-all duration-300"
                style={{ width: `${probs.p0 * 100}%` }}
              />
            </div>
          </div>

          {/* Probability Bar for |1⟩ */}
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-rose-300 font-semibold">P(1) = |β|²</span>
              <span className="text-rose-300 font-bold">{probs.p1Percent}%</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-pink-400 transition-all duration-300"
                style={{ width: `${probs.p1 * 100}%` }}
              />
            </div>
          </div>

          {/* Collapse Feedback Flash */}
          {lastMeasuredOutcome && (
            <div className="mb-3 p-2 rounded-lg bg-cyan-950/60 border border-cyan-500 text-center font-mono text-xs text-cyan-200 animate-pulse">
              ⚡ Wavefunction Collapsed to |{lastMeasuredOutcome}⟩!
            </div>
          )}

          {/* Single Measurement Action Button */}
          <button
            onClick={handleSingleMeasurement}
            className="w-full py-2.5 px-4 rounded-xl font-mono text-sm font-bold transition flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Measure Qubit (Born Collapse)</span>
          </button>

          {/* Batch Sampling Controls */}
          <div className="mt-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400">Statistical Sampling:</span>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => handleRunShots(100)}
                  disabled={isSampling}
                  className="px-2 py-1 text-xs font-mono rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                >
                  100 Shots
                </button>
                <button
                  onClick={() => handleRunShots(1000)}
                  disabled={isSampling}
                  className="px-2 py-1 text-xs font-mono rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                >
                  1,000 Shots
                </button>
              </div>
            </div>

            {/* Batch Sampling Results Histogram */}
            {shotResults && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Total Shots: {shotResults.shotCount}</span>
                  <span>Empirical vs Theoretical</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-violet-300 font-bold block text-sm">
                      {shotResults.count0}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      |0⟩ ({(shotResults.empiricalP0 * 100).toFixed(1)}% vs {(shotResults.theoreticalP0 * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-rose-300 font-bold block text-sm">
                      {shotResults.count1}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      |1⟩ ({(shotResults.empiricalP1 * 100).toFixed(1)}% vs {(shotResults.theoreticalP1 * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
