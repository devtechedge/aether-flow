import type { ChangeEvent } from "react";
import type { GraphNode } from "../../types";
import { Mail, Folder, FileText, Sparkles, Cpu, GitBranch } from "lucide-react";

interface NodeInspectorProps {
  node: GraphNode | null;
  onUpdateProperties: (id: string, properties: Partial<GraphNode["properties"]>, label?: string) => void;
}

const fieldClass = "aether-field";

export default function NodeInspector({ node, onUpdateProperties }: NodeInspectorProps) {
  if (!node) {
    return (
      <div
        className="flex h-full flex-1 flex-col items-center justify-center rounded-2xl border border-line bg-well p-6 text-center"
        data-testid="node-inspector"
      >
        <div className="mb-3 rounded-full border border-line bg-surface p-3 text-subtle">
          <Sparkles className="size-6" />
        </div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-fg">Inspector Standby</h4>
        <p className="mt-1 max-w-[200px] text-[10px] leading-relaxed text-muted">
          Select a node from the canvas to edit properties, API binds, and branch conditions.
        </p>
      </div>
    );
  }

  const handleLabelChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUpdateProperties(node.id, {}, e.target.value);
  };

  const handlePropChange = (key: string, value: unknown) => {
    onUpdateProperties(node.id, { [key]: value });
  };

  return (
    <div className="flex h-full flex-1 flex-col gap-5 overflow-y-auto pr-1" data-testid="node-inspector">
      <div className="border-b border-line pb-3">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-accent">Node Inspector</span>
        <h3 className="mt-1 text-sm font-semibold text-fg">Configure: {node.label}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted">
            Display Label
          </label>
          <input type="text" value={node.label} onChange={handleLabelChange} className={fieldClass} />
        </div>

        {node.type === "delay" && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <Cpu className="size-3.5 text-amber-500" /> Delay Duration (Seconds)
            </label>
            <input
              type="number"
              min="0.5"
              max="60"
              step="0.5"
              value={node.properties.seconds ?? 2}
              onChange={(e) => handlePropChange("seconds", parseFloat(e.target.value) || 2)}
              className={fieldClass}
            />
          </div>
        )}

        {node.type === "logic" && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <GitBranch className="size-3.5 text-sky-500" /> JavaScript Branch Condition
            </label>
            <textarea
              value={node.properties.code ?? "true"}
              onChange={(e) => handlePropChange("code", e.target.value)}
              rows={4}
              className={`${fieldClass} leading-relaxed`}
            />
            <p className="mt-1.5 text-[9px] leading-relaxed text-muted">
              Returns boolean. Evaluates state variables (emails, docsContent, geminiOutput).
            </p>
          </div>
        )}

        {node.type === "gmail" && (
          <div className="space-y-3.5">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                <Mail className="size-3.5 text-red-500" /> Gmail Action
              </label>
              <select
                value={node.properties.gmailAction ?? "list"}
                onChange={(e) => handlePropChange("gmailAction", e.target.value)}
                className={fieldClass}
              >
                <option value="list">List Inbox Conversations</option>
                <option value="draft">Draft New Email</option>
                <option value="send">Send Email Instantly</option>
              </select>
            </div>
            {node.properties.gmailAction === "list" ? (
              <input
                type="text"
                value={node.properties.gmailQuery ?? ""}
                onChange={(e) => handlePropChange("gmailQuery", e.target.value)}
                className={fieldClass}
                placeholder="e.g. is:unread from:boss"
              />
            ) : (
              <>
                <input
                  type="text"
                  value={node.properties.gmailTo ?? ""}
                  onChange={(e) => handlePropChange("gmailTo", e.target.value)}
                  className={fieldClass}
                  placeholder="Recipient email"
                />
                <input
                  type="text"
                  value={node.properties.gmailSubject ?? ""}
                  onChange={(e) => handlePropChange("gmailSubject", e.target.value)}
                  className={fieldClass}
                  placeholder="Subject"
                />
                <textarea
                  value={node.properties.gmailBody ?? ""}
                  onChange={(e) => handlePropChange("gmailBody", e.target.value)}
                  rows={4}
                  className={`${fieldClass} leading-relaxed`}
                  placeholder="Body template. Supports {{variables}}."
                />
              </>
            )}
          </div>
        )}

        {node.type === "drive" && (
          <div className="space-y-3.5">
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <Folder className="size-3.5 text-blue-500" /> Google Drive Action
            </label>
            <select
              value={node.properties.driveAction ?? "list"}
              onChange={(e) => handlePropChange("driveAction", e.target.value)}
              className={fieldClass}
            >
              <option value="list">List Files in Root</option>
              <option value="create_folder">Create Storage Folder</option>
              <option value="create_file">Create Raw File</option>
            </select>
            {node.properties.driveAction !== "list" && (
              <input
                type="text"
                value={node.properties.driveName ?? ""}
                onChange={(e) => handlePropChange("driveName", e.target.value)}
                className={fieldClass}
                placeholder={node.properties.driveAction === "create_folder" ? "Folder name" : "File name"}
              />
            )}
          </div>
        )}

        {node.type === "docs" && (
          <div className="space-y-3.5">
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <FileText className="size-3.5 text-indigo-500" /> Google Docs Action
            </label>
            <select
              value={node.properties.docsAction ?? "read"}
              onChange={(e) => handlePropChange("docsAction", e.target.value)}
              className={fieldClass}
            >
              <option value="read">Read Document Paragraphs</option>
              <option value="create">Create Fresh Document</option>
              <option value="append">Append Logs to Document</option>
            </select>
          </div>
        )}

        {node.type === "gemini" && (
          <div className="space-y-3.5">
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <Sparkles className="size-3.5 text-violet-500" /> Agent Prompt
            </label>
            <textarea
              value={node.properties.geminiPrompt ?? ""}
              onChange={(e) => handlePropChange("geminiPrompt", e.target.value)}
              rows={5}
              className={`${fieldClass} leading-relaxed`}
              placeholder="Analyze context from emails: {{gmailOutput}}"
            />
          </div>
        )}
      </div>
    </div>
  );
}
