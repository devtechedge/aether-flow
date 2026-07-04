/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NodeType = 
  | 'start' 
  | 'end' 
  | 'delay' 
  | 'logic' 
  | 'gmail' 
  | 'drive' 
  | 'docs' 
  | 'gemini';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: {
    seconds?: number; // For delay
    code?: string; // For logic evaluation
    gmailAction?: 'list' | 'send' | 'draft';
    gmailTo?: string;
    gmailSubject?: string;
    gmailBody?: string;
    gmailQuery?: string;
    driveAction?: 'list' | 'create_folder' | 'create_file';
    driveName?: string;
    driveContent?: string;
    docsAction?: 'read' | 'create' | 'append';
    docsId?: string;
    docsTitle?: string;
    docsContent?: string;
    geminiPrompt?: string;
    geminiModel?: string;
    useSearch?: boolean;
    useThinking?: boolean;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: 'flow' | 'true' | 'false'; // Port identifier
  targetHandle?: 'flow';
}

export interface Commit {
  hash: string;
  message: string;
  timestamp: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  author: string;
}

export interface Branch {
  name: string;
  commitHash: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  nodeId?: string;
  type: 'info' | 'success' | 'error' | 'api_call';
  message: string;
  data?: any;
}

export interface TelemetryData {
  cpuUsage: number;
  memoryUsage: number;
  fps: number;
  activeTransitions: number;
  workerDelay: number;
}

export interface ExecutionSnapshot {
  id: string;
  tickIndex: number;
  timestamp: number;
  activeNodeId: string | null;
  variableRegistry: Record<string, any>;
  logCount: number;
}

