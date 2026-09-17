import { Play, Pause, Square, SkipForward, Cpu, Trash2, ShieldCheck, Terminal, Disc } from "lucide-react";
import type { ExecutionSnapshot, LogEntry, TelemetryData } from "../../types";

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
  onScrubSnapshot,
}: TimeTravelScrubberProps) {
  const vcrBtn =
    "flex size-9 items-center justify-center rounded-xl border border-line bg-well text-fg hover:border-line-strong";

  return (
    <div className="ide-vcr" data-testid="time-travel-scrubber">
      <div className="ide-vcr-transport">
        {isPlaying ? (
          <button type="button" onClick={onPause} className={vcrBtn} title="Pause Execution">
            <Pause className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            data-testid="vcr-play"
            onClick={onPlay}
            className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-fg"
            title="Run State Machine"
          >
            <Play className="size-4 fill-current" style={{ marginLeft: 2 }} />
          </button>
        )}
        <button type="button" onClick={onStepForward} disabled={isPlaying} className={`${vcrBtn} disabled:opacity-40`}>
          <SkipForward className="size-4" />
        </button>
        <button type="button" onClick={onStop} className={vcrBtn}>
          <Square className="size-4 fill-current" />
        </button>
        <div className="mx-0.5 h-5 w-px bg-line-strong" />
        <div className="flex rounded-lg border border-line bg-well p-0.5">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeSpeed(s)}
              className={`rounded px-2 py-1 text-[10px] font-medium ${
                simulationSpeed === s ? "bg-surface text-accent" : "text-subtle hover:text-fg"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        {historySnapshots.length > 0 && (
          <div className="flex min-w-[120px] flex-1 items-center gap-2">
            <Disc className="size-3.5 shrink-0 text-accent" />
            <input
              type="range"
              min={0}
              max={historySnapshots.length - 1}
              value={activeSnapshotIndex ?? 0}
              onChange={(e) => onScrubSnapshot?.(parseInt(e.target.value, 10))}
              disabled={isPlaying}
              className="w-full accent-[var(--accent)] disabled:opacity-40"
            />
          </div>
        )}
      </div>

      <div className="ide-vcr-logs">
        <div className="mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-subtle">
            <Terminal className="size-3.5" /> Live VM Logs
          </span>
          <button type="button" onClick={onClearLogs} className="flex items-center gap-1 text-[10px] text-subtle hover:text-fg">
            <Trash2 className="size-3" /> Clear
          </button>
        </div>
        <div
          data-testid="console-log"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto rounded-xl border border-line bg-well p-2 text-[10px] leading-relaxed"
        >
          {logs.length === 0 ? (
            <div className="flex h-full items-center gap-1.5 italic text-subtle">
              <Disc className="size-3.5 text-accent/40" />
              Machine thread online. Press run…
            </div>
          ) : (
            logs.map((log) => {
              let typeColor = "text-muted";
              let tag = "SYS";
              if (log.type === "success") {
                typeColor = "text-emerald-600";
                tag = "OK ";
              } else if (log.type === "error") {
                typeColor = "text-rose-600";
                tag = "ERR";
              } else if (log.type === "api_call") {
                typeColor = "text-sky-600";
                tag = "API";
              }
              return (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="shrink-0 tabular-nums text-subtle">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className={`shrink-0 font-semibold ${typeColor}`}>[{tag}]</span>
                  <span className="min-w-0 flex-1 break-all text-fg">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="ide-vcr-telemetry">
        <div className="flex items-center justify-between gap-2 text-[9px] font-semibold uppercase tracking-wider text-subtle">
          <span className="flex items-center gap-1">
            <Cpu className="size-3 text-accent" /> VM Diagnostics
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            <ShieldCheck className="size-3" /> Secure
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <div className="flex justify-between gap-2">
            <span className="text-subtle">CPU</span>
            <span className="tabular-nums font-semibold text-fg">{telemetry.cpuUsage}%</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-subtle">Mem</span>
            <span className="tabular-nums font-semibold text-fg">{telemetry.memoryUsage} MB</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-subtle">GPU</span>
            <span className="tabular-nums font-semibold text-fg">{telemetry.fps} FPS</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-subtle">I/O</span>
            <span className="tabular-nums font-semibold text-fg">{telemetry.workerDelay}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
