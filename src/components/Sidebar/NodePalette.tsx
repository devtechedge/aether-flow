import { Play, Activity, Cpu, GitBranch, Mail, Folder, FileText, Sparkles, Plus } from "lucide-react";
import type { NodeType } from "../../types";

interface NodePaletteProps {
  onAddNode: (type: NodeType) => void;
}

export default function NodePalette({ onAddNode }: NodePaletteProps) {
  const nodeTemplates = [
    {
      type: "start" as NodeType,
      title: "Start Node",
      description: "The visual execution entry point of the pipeline flowchart.",
      icon: <Play className="size-4 text-emerald-500" />,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    {
      type: "end" as NodeType,
      title: "End Node",
      description: "Terminates simulation. Displays final profiling telemetry.",
      icon: <Activity className="size-4 text-rose-500" />,
      color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    },
    {
      type: "delay" as NodeType,
      title: "Delay Timer",
      description: "Pauses simulation thread for a custom second interval.",
      icon: <Cpu className="size-4 text-amber-500" />,
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    {
      type: "logic" as NodeType,
      title: "Decision Logic",
      description: "Evaluates parameters. Branches output into True or False handles.",
      icon: <GitBranch className="size-4 text-sky-500" />,
      color: "bg-sky-500/10 text-sky-600 border-sky-500/20",
    },
    {
      type: "gmail" as NodeType,
      title: "Gmail Orchestrator",
      description: "List workspace threads, draft letters, or send emails.",
      icon: <Mail className="size-4 text-red-500" />,
      color: "bg-red-500/10 text-red-600 border-red-500/20",
    },
    {
      type: "drive" as NodeType,
      title: "Google Drive",
      description: "Creates file templates, builds folders, or lists items.",
      icon: <Folder className="size-4 text-blue-500" />,
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    {
      type: "docs" as NodeType,
      title: "Google Docs",
      description: "Fetches document paragraphs or appends real-time logs.",
      icon: <FileText className="size-4 text-indigo-500" />,
      color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    },
    {
      type: "gemini" as NodeType,
      title: "AI Agent",
      description: "Drafts replies and summaries from the live pipeline context.",
      icon: <Sparkles className="size-4 text-violet-500" />,
      color: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    },
  ];

  return (
    <div className="flex flex-col gap-4" data-testid="node-palette">
      <div className="border-b border-line pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-fg">Workflow Node Registry</h3>
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
          Select or drag elements to append execution blocks to the canvas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 overflow-y-auto pr-1">
        {nodeTemplates.map((tpl) => (
          <button
            key={tpl.type}
            data-testid={`palette-${tpl.type}`}
            type="button"
            onClick={() => onAddNode(tpl.type)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/aetherflow-node", tpl.type);
              e.dataTransfer.effectAllowed = "copy";
            }}
            className="group flex cursor-grab items-start gap-3 rounded-xl border border-line bg-well p-3 text-left transition-colors hover:border-line-strong active:cursor-grabbing"
          >
            <div className={`shrink-0 rounded-lg border p-2 ${tpl.color}`}>{tpl.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-fg group-hover:text-accent">{tpl.title}</span>
                <Plus className="size-3.5 text-subtle group-hover:text-fg" />
              </div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{tpl.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
