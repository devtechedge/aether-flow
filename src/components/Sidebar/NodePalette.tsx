/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, Activity, Cpu, GitBranch, Mail, Folder, FileText, Sparkles, Plus } from 'lucide-react';
import { NodeType } from '../../types';

interface NodePaletteProps {
  onAddNode: (type: NodeType) => void;
}

export default function NodePalette({ onAddNode }: NodePaletteProps) {
  const nodeTemplates = [
    {
      type: 'start' as NodeType,
      title: 'Start Node',
      description: 'The visual execution entry point of the pipeline flowchart.',
      icon: <Play className="w-4 h-4 text-emerald-400" />,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      type: 'end' as NodeType,
      title: 'End Node',
      description: 'Terminates simulation. Displays final profiling telemetry.',
      icon: <Activity className="w-4 h-4 text-rose-400" />,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    },
    {
      type: 'delay' as NodeType,
      title: 'Delay Timer',
      description: 'Pauses simulation thread for a custom second interval.',
      icon: <Cpu className="w-4 h-4 text-amber-400" />,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    {
      type: 'logic' as NodeType,
      title: 'Decision Logic',
      description: 'Evaluates parameters. Branches output into True or False handles.',
      icon: <GitBranch className="w-4 h-4 text-sky-400" />,
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    },
    {
      type: 'gmail' as NodeType,
      title: 'Gmail Orchestrator',
      description: 'List workspace threads, draft letters, or send real emails.',
      icon: <Mail className="w-4 h-4 text-red-400" />,
      color: 'bg-red-500/10 text-red-400 border-red-500/20'
    },
    {
      type: 'drive' as NodeType,
      title: 'Google Drive',
      description: 'Creates file templates, builds folders, or lists items directly.',
      icon: <Folder className="w-4 h-4 text-blue-400" />,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },
    {
      type: 'docs' as NodeType,
      title: 'Google Docs',
      description: 'Fetches document paragraphs or appends real-time logs.',
      icon: <FileText className="w-4 h-4 text-indigo-400" />,
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    },
    {
      type: 'gemini' as NodeType,
      title: 'Gemini AI Agent',
      description: 'Runs high thinking, web grounding, or doc summarizers.',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-white/5 pb-2">
        <h3 className="text-xs font-mono uppercase tracking-[0.15em] font-extrabold text-white">
          Workflow Node Registry
        </h3>
        <p className="text-[10px] text-white/50 font-serif italic mt-0.5">
          Select or drag elements to append execution logic blocks to the canvas view.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
        {nodeTemplates.map((tpl) => (
          <button
            key={tpl.type}
            onClick={() => onAddNode(tpl.type)}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('application/aetherflow-node', tpl.type);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 hover:border-white/20 rounded-xl text-left transition-all hover:bg-white/[0.04] group cursor-grab active:cursor-grabbing"
          >
            <div className={`p-2 rounded-lg border shrink-0 ${tpl.color}`}>
              {tpl.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-[#ff4f12] transition-colors">
                  {tpl.title}
                </span>
                <Plus className="w-3.5 h-3.5 text-white/30 group-hover:text-white transition-all" />
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed font-sans mt-0.5">
                {tpl.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
