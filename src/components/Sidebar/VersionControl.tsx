/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { GitBranch, Plus, ChevronRight, Check, AlertCircle, History, ArrowRight } from 'lucide-react';
import { Commit, Branch } from '../../types';

interface VersionControlProps {
  branches: Branch[];
  currentBranch: string;
  commits: Commit[];
  onCommit: (message: string) => void;
  onCheckoutBranch: (branchName: string) => void;
  onCreateBranch: (branchName: string) => void;
  compareBranch: string | null;
  onCompareBranch: (branchName: string | null) => void;
}

export default function VersionControl({
  branches,
  currentBranch,
  commits,
  onCommit,
  onCheckoutBranch,
  onCreateBranch,
  compareBranch,
  onCompareBranch
}: VersionControlProps) {
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [showCreateBranch, setShowCreateBranch] = useState<boolean>(false);
  const [viewHistory, setViewHistory] = useState<boolean>(false);

  const handleCommitSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    onCommit(commitMessage);
    setCommitMessage('');
  };

  const handleCreateBranchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    // Replace spaces with dash standard git branch name formatting
    const formatted = newBranchName.trim().toLowerCase().replace(/\s+/g, '-');
    onCreateBranch(formatted);
    setNewBranchName('');
    setShowCreateBranch(false);
  };

  // Get active branch's commit history
  const activeBranchObj = branches.find(b => b.name === currentBranch);
  const activeCommitHash = activeBranchObj?.commitHash;
  
  // Trace commits backwards starting from the current branch's head commit
  const getBranchCommits = (): Commit[] => {
    if (!activeCommitHash) return [];
    const result: Commit[] = [];
    let currentHash: string | undefined = activeCommitHash;
    
    // Simplistic visual history trace
    while (currentHash) {
      const commit = commits.find(c => c.hash === currentHash);
      if (commit) {
        result.push(commit);
        // For a single flat chain demonstration, search the previous chronological commit
        const idx = commits.indexOf(commit);
        currentHash = idx > 0 ? commits[idx - 1].hash : undefined;
      } else {
        break;
      }
    }
    return result;
  };

  const branchCommits = getBranchCommits();

  return (
    <div className="flex flex-col gap-4">
      {/* Panel header */}
      <div className="border-b border-white/5 pb-2">
        <h3 className="text-xs font-mono uppercase tracking-[0.15em] font-extrabold text-white flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#ff4f12]" /> Local Git Ledger
        </h3>
        <p className="text-[10px] text-white/50 font-serif italic mt-0.5">
          Atomic branch tracking, commit diff timelines, and multi-user sandbox rollbacks.
        </p>
      </div>

      {/* Branch switching dropdown */}
      <div className="bg-[#121318] p-3 rounded-xl border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-white/40">Active Branch</span>
          <button 
            onClick={() => setShowCreateBranch(!showCreateBranch)}
            className="text-[10px] font-mono text-[#ff4f12] hover:text-[#ff6a38] transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> New Branch
          </button>
        </div>

        {showCreateBranch ? (
          <form onSubmit={handleCreateBranchSubmit} className="flex gap-2">
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="e.g. experimental-ai"
              className="flex-1 bg-[#0d0e11] text-xs px-2.5 py-1.5 rounded-lg border border-white/10 outline-none text-white font-mono"
              required
            />
            <button 
              type="submit"
              className="bg-[#ff4f12] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#ff6a38] transition-colors cursor-pointer"
            >
              Add
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {branches.map((b) => (
              <button
                key={b.name}
                onClick={() => onCheckoutBranch(b.name)}
                className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  b.name === currentBranch
                    ? 'bg-white/5 border-white/20 text-[#ff4f12]'
                    : 'bg-transparent border-transparent text-white/60 hover:bg-white/[0.02] hover:text-white'
                }`}
              >
                <span className="truncate">refs/heads/{b.name}</span>
                {b.name === currentBranch && <Check className="w-3 h-3 text-[#ff4f12]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Branch Comparison Selector */}
      <div className="bg-[#121318] p-3 rounded-xl border border-white/5 space-y-2.5">
        <span className="text-[10px] font-mono uppercase text-white/40 block">Visual Branch Diffing</span>
        <div className="flex gap-2">
          <select
            value={compareBranch || ''}
            onChange={(e) => onCompareBranch(e.target.value || null)}
            className="flex-1 bg-[#0d0e11] text-xs px-2.5 py-1.5 rounded-lg border border-white/10 outline-none text-white/80 font-mono cursor-pointer"
          >
            <option value="">-- No Baseline Comparison --</option>
            {branches.map(b => (
              <option key={`opt-${b.name}`} value={b.name} disabled={b.name === currentBranch}>
                Compare with {b.name}
              </option>
            ))}
          </select>
          {compareBranch && (
            <button
              type="button"
              onClick={() => onCompareBranch(null)}
              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-mono text-[10px] rounded-lg transition-colors cursor-pointer"
              title="Clear Comparison Overlay"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-[8px] font-mono text-white/30 leading-normal">
          Displays real-time diff overlays: <span className="text-emerald-400 font-black">+Added</span>, <span className="text-amber-400 font-black">Modified</span>, and <span className="text-rose-400 font-black line-through">-Deleted</span> baseline elements.
        </p>
      </div>

      {/* Create commit input */}
      <form onSubmit={handleCommitSubmit} className="bg-[#121318] p-3 rounded-xl border border-white/5 space-y-3">
        <span className="text-[10px] font-mono uppercase text-white/40 block">Commit Workspace Changes</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="e.g. feat: integrate gmail mailings"
            className="flex-1 bg-[#0d0e11] text-xs px-3 py-2 rounded-lg border border-white/5 focus:border-white/20 outline-none text-white font-mono"
            required
          />
          <button
            type="submit"
            className="bg-[#ff4f12] text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-[#ff6a38] transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
          >
            Commit
          </button>
        </div>
      </form>

      {/* History timelines list */}
      <div className="bg-[#121318] p-3 rounded-xl border border-white/5 flex-1 min-h-[140px] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
          <span className="text-[10px] font-mono uppercase text-white/40 flex items-center gap-1">
            <History className="w-3.5 h-3.5 text-white/40" /> Timeline Index
          </span>
          <span className="text-[9px] font-mono text-white/30">
            {branchCommits.length} commits total
          </span>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[180px] space-y-2 pr-1 timeline-scrollbar">
          {branchCommits.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-3">
              <AlertCircle className="w-5 h-5 text-white/20 mb-1" />
              <p className="text-[9px] text-white/40 font-serif italic">
                No commit hashes registered on this head node yet. Create a commit to start logging.
              </p>
            </div>
          ) : (
            branchCommits.map((c, idx) => {
              const nodeCount = c.nodes.length;
              const edgeCount = c.edges.length;
              const isHead = idx === 0;

              return (
                <div 
                  key={c.hash} 
                  className={`p-2.5 rounded-lg border text-xs font-sans transition-all relative pl-6 ${
                    isHead 
                      ? 'bg-emerald-500/[0.02] border-emerald-500/20 text-white/90' 
                      : 'bg-transparent border-white/5 text-white/60 hover:bg-white/[0.01]'
                  }`}
                >
                  {/* Ledger circle tracker */}
                  <div className={`absolute left-2.5 top-[18px] -translate-y-1/2 w-2 h-2 rounded-full border ${
                    isHead ? 'bg-emerald-400 border-emerald-500' : 'bg-[#121318] border-white/20'
                  }`} />
                  
                  {/* Chronological joining line */}
                  {idx < branchCommits.length - 1 && (
                    <div className="absolute left-[13px] top-[18px] bottom-[-18px] w-px bg-white/10" />
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-[10px] text-white/80 max-w-[130px] truncate block">
                      {c.message}
                    </span>
                    <span className="font-mono text-[9px] text-white/40">
                      {c.hash.substring(0, 7)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1.5 text-[9px] font-mono text-white/40 border-t border-white/5 pt-1">
                    <span>{nodeCount} nodes, {edgeCount} edges</span>
                    <span className="italic">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
