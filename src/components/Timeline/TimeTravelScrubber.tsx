/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, Pause, Square, SkipForward, Cpu, Trash2, ShieldCheck, Terminal, Disc, Zap } from 'lucide-react';
import { LogEntry, TelemetryData, ExecutionSnapshot } from '../../types';

interface TimeTravelScrubberProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onStepForward: () => void;
  simulationSpeed: number;
  onChangeSpeed: (speed: number) => void;
  telemetry: TelemetryData;
  historySnapshots?: ExecutionSnapshot[];
  activeSnapshotIndex?: number | null;
  onScrubSnapshot?: (index: number) => void;
}

export default function TimeTravelScrubber({
  logs,
  onClearLogs,
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onStepForward,
  simulationSpeed,
  onChangeSpeed,
  telemetry,
  historySnapshots = [],
  activeSnapshotIndex = null,
  onScrubSnapshot
}: TimeTravelScrubberProps) {
  return (
    <div className="bg-[#121318] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-5 h-full">
      {/* VCR & Telemetry profiling panel (Left Side) */}
      <div className="flex flex-col justify-between md:w-[320px] shrink-0 border-r border-white/5 pr-0 md:pr-5 gap-4">
        {/* VCR Player Controls */}
        <div>
          <span className="text-[10px] font-mono uppercase text-white/40 block mb-2.5">
            Simulation Controller
          </span>
          <div className="flex items-center gap-2">
            {isPlaying ? (
              <button
                onClick={onPause}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white cursor-pointer hover:bg-white/[0.08] transition-all"
                title="Pause Execution"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#ff4f12] text-white hover:bg-[#ff6a38] shadow-lg shadow-[#ff4f12]/10 cursor-pointer transition-all"
                title="Run State Machine"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}

            <button
              onClick={onStepForward}
              disabled={isPlaying}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white cursor-pointer hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Single Instruction Step"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={onStop}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white cursor-pointer hover:bg-white/[0.08] transition-all"
              title="Halt & Reset VM"
            >
              <Square className="w-4 h-4 fill-current text-white/80" />
            </button>

            <div className="h-6 w-px bg-white/10 mx-1" />

            {/* Speeds selector buttons */}
            <div className="flex bg-[#0d0e11] p-1 border border-white/5 rounded-lg">
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                    simulationSpeed === s
                      ? 'bg-white/5 text-[#ff4f12] font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forensic Debugger Scrubber slider */}
        {historySnapshots && historySnapshots.length > 0 && (
          <div className="bg-[#0d0e11] border border-[#ff4f12]/10 p-3 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#ff4f12] font-black flex items-center gap-1.5 uppercase tracking-wider">
                <Disc className="w-3.5 h-3.5 text-[#ff4f12] animate-pulse" /> Forensic Scrub
              </span>
              <span className="text-white/40">
                Tick {activeSnapshotIndex !== null ? activeSnapshotIndex + 1 : 0} / {historySnapshots.length}
              </span>
            </div>
            
            <input
              type="range"
              min={0}
              max={historySnapshots.length - 1}
              value={activeSnapshotIndex ?? 0}
              onChange={(e) => onScrubSnapshot && onScrubSnapshot(parseInt(e.target.value))}
              disabled={isPlaying}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff4f12] disabled:opacity-40 disabled:cursor-not-allowed outline-none"
            />
            
            <p className="text-[8px] font-mono text-white/30 leading-normal">
              {isPlaying 
                ? "Simulating... halt/pause execution to retrospectively scrub variables." 
                : "Drag slider to roll back variables, call flows, and visual node states."}
            </p>
          </div>
        )}

        {/* Telemetry diagnostics display */}
        <div className="bg-[#0d0e11] border border-white/5 p-3 rounded-xl space-y-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#ff4f12]" /> VM Diagnostics
            </span>
            <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-400">
              <ShieldCheck className="w-3 h-3" /> SECURE HANDSHAKE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-mono">
            <div className="flex justify-between">
              <span className="text-white/35">CPU Cycles:</span>
              <span className="text-white/85 font-semibold text-right">{telemetry.cpuUsage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/35">Mem Heap:</span>
              <span className="text-white/85 font-semibold text-right">{telemetry.memoryUsage} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/35">Renderer:</span>
              <span className="text-white/85 font-semibold text-right">{telemetry.fps} FPS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/35">Off-thread:</span>
              <span className="text-white/85 font-semibold text-right">{telemetry.workerDelay}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic compiler telemetry terminal console (Right Side) */}
      <div className="flex-1 flex flex-col justify-between h-[160px] md:h-full">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
          <span className="text-[10px] font-mono uppercase text-white/40 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-white/40" /> Live VM Compilation & Execution Logs
          </span>
          <button
            onClick={onClearLogs}
            className="text-[10px] font-mono text-white/30 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Clear Console
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#0d0e11] rounded-xl border border-white/5 p-3 font-mono text-[10px] space-y-1.5 timeline-scrollbar select-text selection:bg-[#ff4f12]/20">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/30 italic text-[9px] gap-1.5 font-serif">
              <Disc className="w-3.5 h-3.5 animate-spin text-[#ff4f12]/30" />
              Machine thread online. Press compile and run execution pipeline flowchart...
            </div>
          ) : (
            logs.map((log) => {
              let typeColor = 'text-white/60';
              let tag = 'SYS';
              if (log.type === 'success') {
                typeColor = 'text-emerald-400';
                tag = 'OK ';
              } else if (log.type === 'error') {
                typeColor = 'text-rose-400';
                tag = 'ERR';
              } else if (log.type === 'api_call') {
                typeColor = 'text-sky-400';
                tag = 'API';
              }

              return (
                <div key={log.id} className="flex gap-2 items-start leading-relaxed border-b border-white/[0.01] pb-1">
                  <span className="text-white/30 shrink-0 select-none">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={`font-bold shrink-0 select-none ${typeColor}`}>
                    [{tag}]
                  </span>
                  <span className="text-white/80 flex-1 break-all font-mono leading-relaxed">
                    {log.message}
                    {log.data && (
                      <pre className="mt-1 bg-white/[0.02] border border-white/5 p-1.5 rounded text-[9px] text-white/50 max-h-[100px] overflow-auto block whitespace-pre-wrap leading-tight">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
