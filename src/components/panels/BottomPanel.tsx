import React, { useState } from 'react';
import {
  HistoryRecord,
  LabExperiment,
  QuantumStateVector,
  BlochCoordinates,
  GateDefinition,
} from '../../types/quantum';
import { GUIDED_EXPERIMENTS } from '../../quantum/experiments';
import { UNIVERSITY_TEST_CASES } from '../../quantum/testCases';
import { formatComplex } from '../../quantum/complex';
import {
  History,
  FlaskConical,
  CheckCircle,
  FileText,
  RotateCcw,
  Play,
  ArrowRight,
  Download,
  AlertCircle,
  ChevronRight,
  Code2,
} from 'lucide-react';

interface BottomPanelProps {
  history: HistoryRecord[];
  currentState: QuantumStateVector;
  blochCoords: BlochCoordinates;
  onSelectInitialState: (stateKey: string) => void;
  onApplyGate: (gate: GateDefinition, param?: number) => void;
  onReset: () => void;
  onClearHistory: () => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  history,
  currentState,
  blochCoords,
  onSelectInitialState,
  onApplyGate,
  onReset,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'experiments' | 'tests' | 'theory'>('experiments');
  const [selectedExperiment, setSelectedExperiment] = useState<LabExperiment>(GUIDED_EXPERIMENTS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [testResults, setTestResults] = useState<Array<{
    id: number;
    title: string;
    description: string;
    passed: boolean;
    details: string;
    actualValues: { p0: number; p1: number; x: number; y: number; z: number };
  }>>(() => {
    return UNIVERSITY_TEST_CASES.map((tc) => {
      const run = tc.runTest();
      return {
        id: tc.id,
        title: tc.title,
        description: tc.description,
        passed: run.passed,
        details: run.details,
        actualValues: run.actualValues,
      };
    });
  });

  // Check if current step condition is satisfied
  const currentStep = selectedExperiment.steps[currentStepIndex];
  const isStepSatisfied = currentStep && currentStep.expectedCondition
    ? currentStep.expectedCondition(currentState, blochCoords)
    : false;

  const handleStartExperiment = (exp: LabExperiment) => {
    setSelectedExperiment(exp);
    setCurrentStepIndex(0);
    onSelectInitialState(exp.initialState);
  };

  const handleNextStep = () => {
    if (currentStepIndex < selectedExperiment.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleRunAllTests = () => {
    const results = UNIVERSITY_TEST_CASES.map((tc) => {
      const run = tc.runTest();
      return {
        id: tc.id,
        title: tc.title,
        description: tc.description,
        passed: run.passed,
        details: run.details,
        actualValues: run.actualValues,
      };
    });
    setTestResults(results);
  };

  // Generate OpenQASM code representation
  const generateOpenQasm = () => {
    let qasm = `// Quantum State Visualizer - Exported Circuit\nOPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];\ncreg c[1];\n\n`;
    history.forEach((rec) => {
      const sym = rec.gateSymbol.toLowerCase();
      if (sym === 'h') qasm += `h q[0];\n`;
      else if (sym === 'x') qasm += `x q[0];\n`;
      else if (sym === 'y') qasm += `y q[0];\n`;
      else if (sym === 'z') qasm += `z q[0];\n`;
      else if (sym === 's') qasm += `s q[0];\n`;
      else if (sym === 't') qasm += `t q[0];\n`;
      else if (sym.startsWith('rx')) qasm += `rx(${rec.parameter?.toFixed(3) || 'pi/2'}) q[0];\n`;
      else if (sym.startsWith('ry')) qasm += `ry(${rec.parameter?.toFixed(3) || 'pi/2'}) q[0];\n`;
      else if (sym.startsWith('rz')) qasm += `rz(${rec.parameter?.toFixed(3) || 'pi/2'}) q[0];\n`;
      else qasm += `// Op: ${rec.gateName}\n`;
    });
    qasm += `measure q[0] -> c[0];\n`;

    const blob = new Blob([qasm], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum_circuit.qasm';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Navigation Tabs Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('experiments')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              activeTab === 'experiments'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span>Guided Lab Modules</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              activeTab === 'history'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4 text-violet-400" />
            <span>Gate History ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              activeTab === 'tests'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Academic Verification (5 Tests)</span>
          </button>

          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              activeTab === 'theory'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Quantum Matrix Reference</span>
          </button>
        </div>

        {/* Tab-specific quick action */}
        {activeTab === 'history' && history.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={generateOpenQasm}
              className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 border border-slate-700 text-cyan-300 hover:bg-slate-700 transition flex items-center space-x-1"
              title="Export as OpenQASM 2.0"
            >
              <Code2 className="w-3.5 h-3.5 mr-1" />
              <span>Export QASM</span>
            </button>
            <button
              onClick={onClearHistory}
              className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-300 transition"
            >
              Clear Log
            </button>
          </div>
        )}

        {activeTab === 'tests' && (
          <button
            onClick={handleRunAllTests}
            className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1 shadow-md"
          >
            <Play className="w-3.5 h-3.5 fill-current mr-1" />
            <span>Run All 5 Test Cases</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="p-4 min-h-[220px]">
        {/* 1. Guided Experiments Tab */}
        {activeTab === 'experiments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Experiment Picker Column */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Select Lab Module
              </span>
              <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                {GUIDED_EXPERIMENTS.map((exp) => {
                  const isSelected = selectedExperiment.id === exp.id;
                  return (
                    <button
                      key={exp.id}
                      onClick={() => handleStartExperiment(exp)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-mono transition border ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{exp.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-sans ${
                            exp.difficulty === 'Beginner'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : exp.difficulty === 'Intermediate'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {exp.difficulty}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5 truncate">
                        {exp.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experiment Active Workflow Column */}
            <div className="lg:col-span-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <div>
                    <h4 className="text-sm font-bold font-mono text-cyan-300">
                      {selectedExperiment.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-sans">
                      {selectedExperiment.description}
                    </p>
                  </div>
                  <div className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    Step {currentStepIndex + 1} of {selectedExperiment.steps.length}
                  </div>
                </div>

                {/* Current Step Instruction Card */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 mb-3">
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center text-xs font-mono shrink-0 font-bold">
                      {currentStepIndex + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-100 mb-1">
                        {currentStep?.instruction}
                      </div>
                      <div className="text-xs text-slate-400 font-sans leading-relaxed">
                        {currentStep?.explanation}
                      </div>
                      {currentStep?.actionHint && (
                        <div className="mt-2 text-xs font-mono text-amber-300 flex items-center space-x-1">
                          <span className="text-slate-500">Hint:</span>
                          <span>{currentStep.actionHint}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Progress & Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-mono">
                  {isStepSatisfied ? (
                    <span className="flex items-center text-emerald-400 font-bold bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-800/60">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Condition Met!
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-400 bg-amber-950/50 px-2.5 py-1 rounded border border-amber-800/60">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      Perform the action above
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStartExperiment(selectedExperiment)}
                    className="px-3 py-1.5 text-xs font-mono rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
                  >
                    Restart Lab
                  </button>
                  {currentStepIndex < selectedExperiment.steps.length - 1 ? (
                    <button
                      onClick={handleNextStep}
                      disabled={!isStepSatisfied}
                      className="px-3 py-1.5 text-xs font-mono font-bold rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:pointer-events-none text-white transition flex items-center space-x-1"
                    >
                      <span>Next Step</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-emerald-400 font-bold px-3 py-1.5 rounded bg-emerald-950/60 border border-emerald-800">
                      🎉 Lab Completed!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Operation History Tab */}
        {activeTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-mono text-sm">
                No gate operations recorded yet. Apply gates or select an initial state to begin tracking the sequence.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[200px]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-2">Step</th>
                      <th className="pb-2">Gate Applied</th>
                      <th className="pb-2">Resulting State |ψ⟩</th>
                      <th className="pb-2">P(0) / P(1)</th>
                      <th className="pb-2">Bloch (x, y, z)</th>
                      <th className="pb-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {history.map((record, index) => {
                      const p0 = (
                        record.nextState.alpha.re ** 2 + record.nextState.alpha.im ** 2
                      ) * 100;
                      const p1 = 100 - p0;

                      return (
                        <tr key={record.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2 text-slate-500">#{index + 1}</td>
                          <td className="py-2">
                            <span className="px-2 py-0.5 rounded font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                              {record.gateSymbol}
                            </span>
                          </td>
                          <td className="py-2 text-slate-200">
                            ({formatComplex(record.nextState.alpha)})|0⟩ + ({formatComplex(record.nextState.beta)})|1⟩
                          </td>
                          <td className="py-2 text-slate-300">
                            <span className="text-violet-400">{p0.toFixed(0)}%</span> /{' '}
                            <span className="text-rose-400">{p1.toFixed(0)}%</span>
                          </td>
                          <td className="py-2 text-slate-400">
                            ({record.blochCoords.x.toFixed(2)}, {record.blochCoords.y.toFixed(2)}, {record.blochCoords.z.toFixed(2)})
                          </td>
                          <td className="py-2 text-slate-400 text-[11px] font-sans">
                            {record.description}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. Academic Verification (5 Test Cases) Tab */}
        {activeTab === 'tests' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-mono font-bold text-slate-200">
                  University Project Automated Test Suite
                </h4>
                <p className="text-xs text-slate-400 font-sans">
                  Mathematically verifies all 5 core cases defined in the project specification against strict numerical tolerances (ε &lt; 10⁻⁵).
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {UNIVERSITY_TEST_CASES.map((tc) => {
                const result = testResults?.find((r) => r.id === tc.id);

                return (
                  <div
                    key={tc.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200">{tc.title}</span>
                        {result && (
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              result.passed
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {result.passed ? '✓ PASSED' : '✗ FAILED'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                        {tc.description}
                      </div>
                      {result && (
                        <div className="text-[11px] text-cyan-300 mt-1 font-mono">
                          {result.details}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block">Expected:</span>
                      <span className="text-slate-300 text-[11px]">{tc.expectedOutcome}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Quantum Theory & Matrices Tab */}
        {activeTab === 'theory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {/* Pauli-X */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-rose-400 block mb-1">Pauli-X (NOT)</span>
              <div className="bg-slate-900 p-2 rounded text-center my-1 text-slate-200">
                [ 0  1 ]<br />[ 1  0 ]
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Rotates 180° around X axis. Swaps basis states |0⟩ ↔ |1⟩.
              </p>
            </div>

            {/* Pauli-Y */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-1">Pauli-Y</span>
              <div className="bg-slate-900 p-2 rounded text-center my-1 text-slate-200">
                [ 0 -i ]<br />[ i  0 ]
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Rotates 180° around Y axis. Bit flip combined with phase flip.
              </p>
            </div>

            {/* Pauli-Z */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-violet-400 block mb-1">Pauli-Z</span>
              <div className="bg-slate-900 p-2 rounded text-center my-1 text-slate-200">
                [ 1  0 ]<br />[ 0 -1 ]
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Rotates 180° around Z axis. Leaves |0⟩ unchanged, negates |1⟩.
              </p>
            </div>

            {/* Hadamard */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-cyan-400 block mb-1">Hadamard (H)</span>
              <div className="bg-slate-900 p-2 rounded text-center my-1 text-slate-200">
                1/√2 · [ 1  1 ]<br />[ 1 -1 ]
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Creates equal superposition. H|0⟩ = |+⟩, H|1⟩ = |-⟩.
              </p>
            </div>

            {/* Bloch Mapping Formula */}
            <div className="md:col-span-2 lg:col-span-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-bold text-cyan-300 block mb-1">
                Bloch Sphere Coordinate Derivation
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center my-1">
                <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
                  <span className="text-rose-400 font-bold">x = 2 Re(α* β)</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
                  <span className="text-emerald-400 font-bold">y = 2 Im(α* β)</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
                  <span className="text-violet-400 font-bold">z = |α|² − |β|²</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-2">
                For any normalized single-qubit pure state |ψ⟩ = α|0⟩ + β|1⟩, with |α|² + |β|² = 1, these coordinates satisfy x² + y² + z² = 1, rigorously mapping the state to the unit 2-sphere.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
