/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChangeEvent } from 'react';
import { GraphNode } from '../../types';
import { Mail, Folder, FileText, Sparkles, Cpu, GitBranch } from 'lucide-react';

interface NodeInspectorProps {
  node: GraphNode | null;
  onUpdateProperties: (id: string, properties: Partial<GraphNode['properties']>, label?: string) => void;
}

export default function NodeInspector({ node, onUpdateProperties }: NodeInspectorProps) {
  if (!node) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/[0.01] border border-white/5 rounded-2xl h-full">
        <div className="p-3 bg-white/[0.02] rounded-full border border-white/5 text-white/30 mb-3 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-white/70">
          Inspector Standby
        </h4>
        <p className="text-[10px] text-white/40 max-w-[200px] font-serif italic mt-1 leading-relaxed">
          Select a node from the interactive canvas to edit active properties, API binds, and conditional logics.
        </p>
      </div>
    );
  }

  const handleLabelChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUpdateProperties(node.id, {}, e.target.value);
  };

  const handlePropChange = (key: string, value: any) => {
    onUpdateProperties(node.id, { [key]: value });
  };

  return (
    <div className="flex-1 flex flex-col gap-5 h-full overflow-y-auto pr-1">
      {/* Inspector Header */}
      <div className="border-b border-white/5 pb-3">
        <span className="text-[9px] font-mono text-[#ff4f12] uppercase tracking-[0.2em] font-extrabold block">
          Node Inspector
        </span>
        <h3 className="text-sm font-bold text-white mt-1 flex items-center gap-2">
          Configure: {node.label}
        </h3>
      </div>

      <div className="space-y-4">
        {/* General: Label */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
            Display Label
          </label>
          <input
            type="text"
            value={node.label}
            onChange={handleLabelChange}
            className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
            placeholder="e.g. Fetch Email List"
          />
        </div>

        {/* --- NODE SPECIFIC PROPERTIES --- */}

        {/* 1. Delay Node */}
        {node.type === 'delay' && (
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" /> Delay Duration (Seconds)
            </label>
            <input
              type="number"
              min="0.5"
              max="60"
              step="0.5"
              value={node.properties.seconds ?? 2}
              onChange={(e) => handlePropChange('seconds', parseFloat(e.target.value) || 2)}
              className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
            />
            <p className="text-[9px] text-white/40 font-serif italic mt-1.5">
              Sets the pause period of this execution frame thread before transitioning to the next handle.
            </p>
          </div>
        )}

        {/* 2. Decision / Logic Node */}
        {node.type === 'logic' && (
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-sky-400" /> JavaScript Branch Condition
            </label>
            <textarea
              value={node.properties.code ?? 'true'}
              onChange={(e) => handlePropChange('code', e.target.value)}
              rows={4}
              className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono leading-relaxed"
              placeholder="e.g. emails.length > 0"
            />
            <p className="text-[9px] text-white/40 font-serif italic mt-1.5">
              Returns boolean. Evaluates state variables (e.g. <code className="text-white/60">emails</code>, <code className="text-white/60">docsContent</code>) to choose either the True or False output path.
            </p>
          </div>
        )}

        {/* 3. Gmail Node */}
        {node.type === 'gmail' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-red-400" /> Gmail Action
              </label>
              <select
                value={node.properties.gmailAction ?? 'list'}
                onChange={(e) => handlePropChange('gmailAction', e.target.value)}
                className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
              >
                <option value="list">List Inbox Conversations</option>
                <option value="draft">Draft New Email</option>
                <option value="send">Send Email Instantly</option>
              </select>
            </div>

            {node.properties.gmailAction === 'list' ? (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                  Search Query (Optional)
                </label>
                <input
                  type="text"
                  value={node.properties.gmailQuery ?? ''}
                  onChange={(e) => handlePropChange('gmailQuery', e.target.value)}
                  className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
                  placeholder="e.g. is:unread from:boss"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    To (Recipient Email)
                  </label>
                  <input
                    type="text"
                    value={node.properties.gmailTo ?? ''}
                    onChange={(e) => handlePropChange('gmailTo', e.target.value)}
                    className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
                    placeholder="e.g. dev@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={node.properties.gmailSubject ?? ''}
                    onChange={(e) => handlePropChange('gmailSubject', e.target.value)}
                    className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
                    placeholder="e.g. Automated Performance Summary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    Email Body Template
                  </label>
                  <textarea
                    value={node.properties.gmailBody ?? ''}
                    onChange={(e) => handlePropChange('gmailBody', e.target.value)}
                    rows={4}
                    className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono leading-relaxed"
                    placeholder="Write template... supports {{variables}} from output states."
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* 4. Google Drive Node */}
        {node.type === 'drive' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-blue-400" /> Google Drive Action
              </label>
              <select
                value={node.properties.driveAction ?? 'list'}
                onChange={(e) => handlePropChange('driveAction', e.target.value)}
                className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
              >
                <option value="list">List Files in Root</option>
                <option value="create_folder">Create Storage Folder</option>
                <option value="create_file">Create Raw File</option>
              </select>
            </div>

            {node.properties.driveAction !== 'list' && (
              <>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    {node.properties.driveAction === 'create_folder' ? 'Folder Name' : 'File Name'}
                  </label>
                  <input
                    type="text"
                    value={node.properties.driveName ?? ''}
                    onChange={(e) => handlePropChange('driveName', e.target.value)}
                    className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
                    placeholder={node.properties.driveAction === 'create_folder' ? 'e.g. Workflow_Archive' : 'e.g. document.txt'}
                  />
                </div>

                {node.properties.driveAction === 'create_file' && (
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                      File Plaintext Content
                    </label>
                    <textarea
                      value={node.properties.driveContent ?? ''}
                      onChange={(e) => handlePropChange('driveContent', e.target.value)}
                      rows={4}
                      className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono leading-relaxed"
                      placeholder="Insert text content... supports {{variables}}"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 5. Google Docs Node */}
        {node.type === 'docs' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Google Docs Action
              </label>
              <select
                value={node.properties.docsAction ?? 'read'}
                onChange={(e) => handlePropChange('docsAction', e.target.value)}
                className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
              >
                <option value="read">Read Document Paragraphs</option>
                <option value="create">Create Fresh Document</option>
                <option value="append">Append Logs to Document</option>
              </select>
            </div>

            {node.properties.docsAction !== 'create' ? (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                  Document ID
                </label>
                <input
                  type="text"
                  value={node.properties.docsId ?? ''}
                  onChange={(e) => handlePropChange('docsId', e.target.value)}
                  className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
                  placeholder="Paste Doc ID from Google URL"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  value={node.properties.docsTitle ?? ''}
                  onChange={(e) => handlePropChange('docsTitle', e.target.value)}
                  className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
                  placeholder="e.g. Gemini AI Summary Report"
                />
              </div>
            )}

            {node.properties.docsAction !== 'read' && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                  Text Content
                </label>
                <textarea
                  value={node.properties.docsContent ?? ''}
                  onChange={(e) => handlePropChange('docsContent', e.target.value)}
                  rows={4}
                  className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono leading-relaxed"
                  placeholder="Insert paragraphs... supports {{variables}}"
                />
              </div>
            )}
          </div>
        )}

        {/* 6. Gemini AI Agent Node */}
        {node.type === 'gemini' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Gemini LLM Core
              </label>
              <select
                value={node.properties.geminiModel ?? 'gemini-3.5-flash'}
                onChange={(e) => handlePropChange('geminiModel', e.target.value)}
                className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono"
              >
                <option value="gemini-3.5-flash">gemini-3.5-flash (Fast, web queries)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep reasoning)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                Agent Prompt Instructions
              </label>
              <textarea
                value={node.properties.geminiPrompt ?? ''}
                onChange={(e) => handlePropChange('geminiPrompt', e.target.value)}
                rows={5}
                className="w-full bg-[#121318] text-xs px-3 py-2 rounded-xl border border-white/5 focus:border-white/20 outline-none text-white font-mono leading-relaxed"
                placeholder="Analyze context from emails: {{emails}} and summarize."
              />
            </div>

            <div className="space-y-2 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60 font-serif italic">Google Search Grounding</span>
                <input
                  type="checkbox"
                  checked={node.properties.useSearch ?? true}
                  onChange={(e) => handlePropChange('useSearch', e.target.checked)}
                  className="rounded bg-[#121318] border-white/10 text-[#ff4f12] focus:ring-[#ff4f12]"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60 font-serif italic">High Thinking Mode</span>
                <input
                  type="checkbox"
                  checked={node.properties.useThinking ?? false}
                  onChange={(e) => handlePropChange('useThinking', e.target.checked)}
                  className="rounded bg-[#121318] border-white/10 text-[#ff4f12] focus:ring-[#ff4f12]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
