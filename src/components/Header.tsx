import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, Atom, Sparkles, BookOpen } from 'lucide-react';
import { quantumAudio } from '../quantum/simulator';

interface HeaderProps {
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const toggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    quantumAudio.setSoundEnabled(nextState);
  };

  return (
    <>
      <header className="w-full bg-[#070b14]/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Project Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center justify-center">
              <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
                <Atom className="w-5 h-5 text-cyan-400 animate-spin-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-slate-100">
                  Quantum State Visualizer
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-700/50 hidden md:inline-block">
                  B.Tech Design Project
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
                Interactive Single-Qubit Simulator • Matrix Transformations & 3D Bloch Sphere
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg border transition text-xs font-mono flex items-center space-x-1.5 ${
                soundOn
                  ? 'bg-slate-900 border-slate-700 text-cyan-300 hover:border-cyan-500'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundOn ? 'Mute Audio Synthesizer' : 'Unmute Audio Synthesizer'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline-block text-[11px]">
                {soundOn ? 'Audio ON' : 'Audio OFF'}
              </span>
            </button>

            <button
              onClick={() => setShowInfoModal(true)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition text-xs font-mono flex items-center space-x-1"
              title="Project Info & Documentation"
            >
              <HelpCircle className="w-4 h-4 text-violet-400" />
              <span className="hidden sm:inline-block text-[11px]">Guide</span>
            </button>
          </div>
        </div>
      </header>

      {/* Academic Project Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Atom className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold font-mono text-cyan-300">
                  Quantum State Visualizer - Project Overview
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white font-mono text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-4 text-xs font-sans leading-relaxed text-slate-300">
              <div>
                <h4 className="font-bold text-sm font-mono text-slate-100 mb-1">
                  1. Academic Purpose
                </h4>
                <p>
                  This project provides an educational simulation environment connecting mathematical state vectors, $2 \times 2$ unitary gate operations, Born rule measurement probabilities, and 3D Bloch Sphere representation for a two-level quantum system (qubit).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm font-mono text-slate-100 mb-1">
                  2. Mathematical Architecture
                </h4>
                <p>
                  Any pure qubit state is defined by |ψ⟩ = α|0⟩ + β|1⟩ where α, β are complex numbers (α, β ∈ ℂ) and |α|² + |β|² = 1. The state is mapped to the Bloch Sphere via:
                </p>
                <div className="my-2 p-2 rounded bg-slate-950 font-mono text-center text-cyan-300">
                  x = 2 Re(α* β), &nbsp; y = 2 Im(α* β), &nbsp; z = |α|² - |β|²
                </div>
                <p>
                  The coordinates strictly obey $x^2 + y^2 + z^2 = 1$, representing a point on the surface of the unit sphere $S^2$.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm font-mono text-slate-100 mb-1">
                  3. Key Features & How to Use
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Initial State:</strong> Choose from computational basis (|0⟩, |1⟩), superposition (|+⟩, |-⟩), or dial arbitrary polar angles (θ, φ).</li>
                  <li><strong>Gates:</strong> Apply standard unitary operations (Hadamard, Pauli-X, Y, Z, Phase S/T, and arbitrary continuous rotations Rx, Ry, Rz).</li>
                  <li><strong>Bloch Sphere:</strong> Click and drag to orbit in 3D. Inspect the state vector, equator circle, and projection guidelines.</li>
                  <li><strong>Measurement:</strong> Click "Measure Qubit" to simulate wavefunction collapse, or run 100/1000 statistical shots.</li>
                  <li><strong>Verification:</strong> Open the "Academic Verification" tab to run the 5 built-in university test cases.</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-mono text-xs font-bold text-white transition"
              >
                Close & Return to Lab
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
