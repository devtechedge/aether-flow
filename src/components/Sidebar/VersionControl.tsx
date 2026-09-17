import { useState, type FormEvent } from "react";
import { GitBranch, Plus, Check, AlertCircle, History } from "lucide-react";
import type { Branch, Commit } from "../../types";

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

const fieldClass = "aether-field";

export default function VersionControl({
  branches,
  currentBranch,
  commits,
  onCommit,
  onCheckoutBranch,
  onCreateBranch,
  compareBranch,
  onCompareBranch,
}: VersionControlProps) {
  const [commitMessage, setCommitMessage] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [showCreateBranch, setShowCreateBranch] = useState(false);

  const handleCommitSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    onCommit(commitMessage);
    setCommitMessage("");
  };

  const handleCreateBranchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    const formatted = newBranchName.trim().toLowerCase().replace(/\s+/g, "-");
    onCreateBranch(formatted);
    setNewBranchName("");
    setShowCreateBranch(false);
  };

  const activeBranchObj = branches.find((b) => b.name === currentBranch);
  const activeCommitHash = activeBranchObj?.commitHash;

  const getBranchCommits = (): Commit[] => {
    if (!activeCommitHash) return [];
    const result: Commit[] = [];
    let currentHash: string | undefined = activeCommitHash;
    while (currentHash) {
      const commit = commits.find((c) => c.hash === currentHash);
      if (commit) {
        result.push(commit);
        const idx = commits.indexOf(commit);
        currentHash = idx > 0 ? commits[idx - 1].hash : undefined;
      } else break;
    }
    return result;
  };

  const branchCommits = getBranchCommits();

  return (
    <div className="flex flex-col gap-4" data-testid="version-control">
      <div className="border-b border-line pb-2">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-fg">
          <GitBranch className="size-4 text-accent" /> Local Git Ledger
        </h3>
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
          Atomic branch tracking, commit diff timelines, and sandbox rollbacks.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Active Branch</span>
          <button
            type="button"
            onClick={() => setShowCreateBranch(!showCreateBranch)}
            className="flex items-center gap-1 text-[10px] font-semibold text-accent hover:opacity-80"
          >
            <Plus className="size-3" /> New Branch
          </button>
        </div>
        {showCreateBranch ? (
          <form onSubmit={handleCreateBranchSubmit} className="flex gap-2">
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="e.g. experimental-ai"
              className={fieldClass}
              required
            />
            <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg">
              Add
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {branches.map((b) => (
              <button
                key={b.name}
                type="button"
                onClick={() => onCheckoutBranch(b.name)}
                className={`flex items-center justify-between rounded-lg border p-2 text-xs transition-colors ${
                  b.name === currentBranch
                    ? "border-line-strong bg-well text-accent"
                    : "border-transparent text-muted hover:bg-well hover:text-fg"
                }`}
              >
                <span className="truncate">refs/heads/{b.name}</span>
                {b.name === currentBranch && <Check className="size-3 text-accent" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2.5 rounded-xl border border-line bg-surface p-3">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-subtle">Visual Branch Diffing</span>
        <select
          value={compareBranch || ""}
          onChange={(e) => onCompareBranch(e.target.value || null)}
          className={`${fieldClass} w-full cursor-pointer`}
        >
          <option value="">-- No Baseline Comparison --</option>
          {branches.map((b) => (
            <option key={`opt-${b.name}`} value={b.name} disabled={b.name === currentBranch}>
              Compare with {b.name}
            </option>
          ))}
        </select>
        <p className="text-[8px] leading-normal text-subtle">
          Overlays: <span className="font-semibold text-emerald-600">+Added</span>,{" "}
          <span className="font-semibold text-amber-600">Modified</span>,{" "}
          <span className="font-semibold text-rose-600 line-through">-Deleted</span>
        </p>
      </div>

      <form onSubmit={handleCommitSubmit} className="space-y-3 rounded-xl border border-line bg-surface p-3">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-subtle">
          Commit Workspace Changes
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="e.g. feat: integrate gmail mailings"
            className={`${fieldClass} px-3 py-2`}
            required
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-fg"
          >
            Commit
          </button>
        </div>
      </form>

      <div className="flex min-h-[140px] flex-1 flex-col rounded-xl border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between border-b border-line pb-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-subtle">
            <History className="size-3.5" /> Timeline Index
          </span>
          <span className="text-[9px] text-subtle">{branchCommits.length} commits total</span>
        </div>
        <div className="max-h-[180px] flex-1 space-y-2 overflow-y-auto pr-1">
          {branchCommits.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-3 text-center">
              <AlertCircle className="mb-1 size-5 text-subtle" />
              <p className="text-[9px] text-muted">No commits on this head yet.</p>
            </div>
          ) : (
            branchCommits.map((c, idx) => {
              const isHead = idx === 0;
              return (
                <div
                  key={c.hash}
                  className={`relative rounded-lg border p-2.5 pl-6 text-xs ${
                    isHead ? "border-emerald-500/20 bg-emerald-500/5 text-fg" : "border-line text-muted"
                  }`}
                >
                  <div
                    className={`absolute top-[18px] left-2.5 size-2 -translate-y-1/2 rounded-full border ${
                      isHead ? "border-emerald-500 bg-emerald-400" : "border-line-strong bg-surface"
                    }`}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="block max-w-[130px] truncate text-[10px] font-semibold text-fg">{c.message}</span>
                    <span className="text-[9px] text-subtle">{c.hash.substring(0, 7)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between border-t border-line pt-1 text-[9px] text-subtle">
                    <span>
                      {c.nodes.length} nodes, {c.edges.length} edges
                    </span>
                    <span>
                      {new Date(c.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
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
