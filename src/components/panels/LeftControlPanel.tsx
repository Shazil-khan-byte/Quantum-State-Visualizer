import React, { useState } from 'react';
import { GateDefinition, QuantumStateVector } from '../../types/quantum';
import { AVAILABLE_GATES, stateFromBlochAngles } from '../../quantum/matrix';
import { STANDARD_BASIS_STATES } from '../../quantum/simulator';
import { RotateCcw, Sliders, Info, Sparkles, BookOpen } from 'lucide-react';

interface LeftControlPanelProps {
  onSelectInitialState: (stateKey: string, customState?: QuantumStateVector) => void;
  onApplyGate: (gate: GateDefinition, param?: number) => void;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
  activeGateId: string | null;
}

export const LeftControlPanel: React.FC<LeftControlPanelProps> = ({
  onSelectInitialState,
  onApplyGate,
  onReset,
  onUndo,
  canUndo,
  activeGateId,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('0');
  const [showAngleSliders, setShowAngleSliders] = useState<boolean>(false);
  const [customTheta, setCustomTheta] = useState<number>(0);
  const [customPhi, setCustomPhi] = useState<number>(0);
  const [rotationAngle, setRotationAngle] = useState<number>(Math.PI / 2);
  const [hoveredGate, setHoveredGate] = useState<GateDefinition | null>(null);

  const handlePresetClick = (key: string) => {
    setSelectedPreset(key);
    setShowAngleSliders(false);
    onSelectInitialState(key);
  };

  const handleAngleChange = (theta: number, phi: number) => {
    setCustomTheta(theta);
    setCustomPhi(phi);
    setSelectedPreset('custom');
    const newState = stateFromBlochAngles(theta, phi);
    onSelectInitialState('custom', newState);
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4 text-slate-100">
      {/* 1. Initial State Selection */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
            <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono">
              Initial State
            </h3>
          </div>
          <button
            onClick={() => setShowAngleSliders(!showAngleSliders)}
            className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition font-mono ${
              showAngleSliders
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Custom Angles (θ, φ)"
          >
            <Sliders className="w-3.5 h-3.5 mr-1" />
            <span>Angles</span>
          </button>
        </div>

        {/* Standard Basis State Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(STANDARD_BASIS_STATES).map(([key, val]) => {
            const isSelected = selectedPreset === key && !showAngleSliders;
            return (
              <button
                key={key}
                onClick={() => handlePresetClick(key)}
                className={`py-2 px-2.5 rounded-lg font-mono text-sm font-bold transition flex flex-col items-center justify-center border ${
                  isSelected
                    ? 'bg-violet-600/30 border-violet-400 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{val.symbol}</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                  {key === '0'
                    ? 'Ground'
                    : key === '1'
                    ? 'Excited'
                    : key === '+'
                    ? '+X Super'
                    : key === '-'
                    ? '-X Super'
                    : key === 'i'
                    ? '+Y Phase'
                    : '-Y Phase'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Polar / Azimuthal Angle Sliders */}
        {showAngleSliders && (
          <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Polar θ (Colatitude):</span>
                <span className="text-cyan-300">{(customTheta * (180 / Math.PI)).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.PI}
                step={Math.PI / 36}
                value={customTheta}
                onChange={(e) => handleAngleChange(parseFloat(e.target.value), customPhi)}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0° (|0⟩)</span>
                <span>90° (Equator)</span>
                <span>180° (|1⟩)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Azimuthal φ (Longitude):</span>
                <span className="text-violet-300">{(customPhi * (180 / Math.PI)).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max={2 * Math.PI}
                step={Math.PI / 36}
                value={customPhi}
                onChange={(e) => handleAngleChange(customTheta, parseFloat(e.target.value))}
                className="w-full accent-violet-400 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0° (+X)</span>
                <span>90° (+Y)</span>
                <span>180° (-X)</span>
                <span>270° (-Y)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Quantum Gate Operations */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono">
                Quantum Gates
              </h3>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="px-2 py-0.5 text-xs rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition font-mono"
                title="Undo last gate"
              >
                Undo
              </button>
              <button
                onClick={onReset}
                className="px-2 py-0.5 text-xs rounded bg-slate-800 border border-slate-700 text-rose-300 hover:bg-rose-950/40 hover:border-rose-700/60 transition font-mono flex items-center space-x-1"
                title="Reset Qubit to |0⟩"
              >
                <RotateCcw className="w-3 h-3 mr-1 inline" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Primary Gates: Hadamard & Pauli */}
          <div className="space-y-2 mb-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Fundamental Operators
            </span>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_GATES.filter((g) => ['h', 'x', 'y', 'z'].includes(g.id)).map((gate) => {
                const isActive = activeGateId === gate.id;
                return (
                  <button
                    key={gate.id}
                    onClick={() => onApplyGate(gate)}
                    onMouseEnter={() => setHoveredGate(gate)}
                    onMouseLeave={() => setHoveredGate(null)}
                    className={`h-11 rounded-lg font-mono font-bold text-base transition flex items-center justify-center border shadow-md ${
                      isActive
                        ? 'ring-2 ring-cyan-400 scale-95'
                        : ''
                    } ${
                      gate.id === 'h'
                        ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400'
                        : gate.id === 'x'
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50 hover:border-rose-400'
                        : gate.id === 'y'
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400'
                        : 'bg-violet-950/40 border-violet-500/40 text-violet-300 hover:bg-violet-900/50 hover:border-violet-400'
                    }`}
                  >
                    {gate.symbol}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phase Gates: S, S†, T, T† */}
          <div className="space-y-2 mb-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Phase Shift Gates
            </span>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_GATES.filter((g) => ['s', 's_dag', 't', 't_dag'].includes(g.id)).map(
                (gate) => (
                  <button
                    key={gate.id}
                    onClick={() => onApplyGate(gate)}
                    onMouseEnter={() => setHoveredGate(gate)}
                    onMouseLeave={() => setHoveredGate(null)}
                    className="h-9 rounded-lg font-mono text-sm font-semibold transition flex items-center justify-center border bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
                  >
                    {gate.symbol}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Continuous Rotation Gates: Rx, Ry, Rz */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Arbitrary Rotations (Angle θ)
              </span>
              <span className="text-[11px] font-mono text-amber-300">
                {(rotationAngle * (180 / Math.PI)).toFixed(0)}°
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_GATES.filter((g) => ['rx', 'ry', 'rz'].includes(g.id)).map((gate) => (
                <button
                  key={gate.id}
                  onClick={() => onApplyGate(gate, rotationAngle)}
                  onMouseEnter={() => setHoveredGate(gate)}
                  onMouseLeave={() => setHoveredGate(null)}
                  className="py-1.5 px-2 rounded-lg font-mono text-xs font-semibold transition flex items-center justify-center border bg-amber-950/20 border-amber-600/30 text-amber-200 hover:bg-amber-900/30 hover:border-amber-500/50"
                >
                  {gate.symbol}(θ)
                </button>
              ))}
            </div>

            <input
              type="range"
              min={-Math.PI}
              max={Math.PI}
              step={Math.PI / 12}
              value={rotationAngle}
              onChange={(e) => setRotationAngle(parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded cursor-pointer mt-1"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>-180°</span>
              <span>-90°</span>
              <span>0°</span>
              <span>+90°</span>
              <span>+180°</span>
            </div>
          </div>
        </div>

        {/* Active / Hovered Gate Detail Tooltip Card */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
          {hoveredGate ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-cyan-300">
                  {hoveredGate.name} ({hoveredGate.symbol})
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {hoveredGate.category}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-tight mb-2">
                {hoveredGate.description}
              </p>
              {typeof hoveredGate.matrix !== 'function' && (
                <div className="font-mono text-[11px] bg-slate-900 p-1.5 rounded border border-slate-800 text-center text-slate-300">
                  [ [{hoveredGate.matrix[0][0].re}, {hoveredGate.matrix[0][1].re}] , [{hoveredGate.matrix[1][0].re}, {hoveredGate.matrix[1][1].re}] ]
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Hover over any gate to inspect its matrix and physical rotation.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
