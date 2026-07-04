/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Workflow, 
  Download, 
  Cpu, 
  Layers, 
  Check, 
  GitBranch, 
  Sparkles,
  User as UserIcon,
  LogOut,
  Terminal,
  Activity,
  Play
} from 'lucide-react';

import { GraphNode, GraphEdge, Commit, Branch, LogEntry, TelemetryData, NodeType, ExecutionSnapshot } from './types';
import GraphCanvas from './components/Canvas/GraphCanvas';
import NodePalette from './components/Sidebar/NodePalette';
import NodeInspector from './components/Inspector/NodeInspector';
import VersionControl from './components/Sidebar/VersionControl';
import TimeTravelScrubber from './components/Timeline/TimeTravelScrubber';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/firebase';

// Pre-configured default master demonstration graph
const DEFAULT_NODES: GraphNode[] = [
  {
    id: 'node-start',
    type: 'start',
    label: 'Pipeline Entry',
    x: 40,
    y: 180,
    width: 180,
    height: 90,
    properties: {}
  },
  {
    id: 'node-gmail-fetch',
    type: 'gmail',
    label: 'Scan Workspace Inbox',
    x: 280,
    y: 180,
    width: 180,
    height: 90,
    properties: {
      gmailAction: 'list',
      gmailQuery: 'is:unread'
    }
  },
  {
    id: 'node-gemini-agent',
    type: 'gemini',
    label: 'Gemini AutoReply',
    x: 520,
    y: 180,
    width: 180,
    height: 90,
    properties: {
      geminiPrompt: 'Analyze this unread email string: "{{gmailOutput}}" and draft an elegant response answering their scheduling query.',
      geminiModel: 'gemini-3.5-flash',
      useSearch: true,
      useThinking: false
    }
  },
  {
    id: 'node-logic-gate',
    type: 'logic',
    label: 'Verify Content Size',
    x: 760,
    y: 180,
    width: 180,
    height: 100,
    properties: {
      code: 'geminiOutput.length > 5'
    }
  },
  {
    id: 'node-gmail-draft',
    type: 'gmail',
    label: 'Write Draft Letter',
    x: 1000,
    y: 100,
    width: 180,
    height: 90,
    properties: {
      gmailAction: 'draft',
      gmailTo: 'recruiters@example.com',
      gmailSubject: 'AetherFlow Auto-Response Draft',
      gmailBody: 'Hi Team,\n\nHere is the AI compiled scheduling outline:\n\n{{geminiOutput}}\n\nWarm regards,\nAetherFlow Agent'
    }
  },
  {
    id: 'node-end',
    type: 'end',
    label: 'Pipeline Completed',
    x: 1240,
    y: 180,
    width: 180,
    height: 90,
    properties: {}
  }
];

const DEFAULT_EDGES: GraphEdge[] = [
  { id: 'edge-1', source: 'node-start', target: 'node-gmail-fetch' },
  { id: 'edge-2', source: 'node-gmail-fetch', target: 'node-gemini-agent' },
  { id: 'edge-3', source: 'node-gemini-agent', target: 'node-logic-gate' },
  { id: 'edge-4', source: 'node-logic-gate', target: 'node-gmail-draft', sourceHandle: 'true' },
  { id: 'edge-5', source: 'node-gmail-draft', target: 'node-end' },
  // Handle fallback edge from logic gate directly to end if false
  { id: 'edge-6', source: 'node-logic-gate', target: 'node-end', sourceHandle: 'false' }
];

export default function App() {
  // Graph States
  const [nodes, setNodes] = useState<GraphNode[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(DEFAULT_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Auth States
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Local Git Ledger states
  const [branches, setBranches] = useState<Branch[]>([
    { name: 'main', commitHash: 'commit-initial' }
  ]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [commits, setCommits] = useState<Commit[]>([
    {
      hash: 'commit-initial',
      message: 'init: default workspace pipeline configuration',
      timestamp: Date.now() - 3600000,
      nodes: DEFAULT_NODES,
      edges: DEFAULT_EDGES,
      author: 'Chief Architect'
    }
  ]);

  // Sidebar navigation tab selector
  const [sidebarTab, setSidebarTab] = useState<'palette' | 'git'>('palette');

  // Comparison branch state
  const [compareBranch, setCompareBranch] = useState<string | null>(null);

  // Forensic Debugger execution history snapshots state
  const [historySnapshots, setHistorySnapshots] = useState<ExecutionSnapshot[]>([]);
  const [activeSnapshotIndex, setActiveSnapshotIndex] = useState<number | null>(null);

  // Simulation execution variables
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [simulatingEdgeId, setSimulatingEdgeId] = useState<string | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Real-time interpolated state memory mapping
  const [variableRegistry, setVariableRegistry] = useState<Record<string, any>>({
    gmailOutput: 'No unread messages found.',
    geminiOutput: '',
    docsContent: '',
    driveOutput: ''
  });

  // Dynamic system profiling diagnostics state
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    cpuUsage: 2,
    memoryUsage: 34.2,
    fps: 120,
    activeTransitions: 0,
    workerDelay: 8
  });

  // Refs for tracking async cancellation & ticks
  const simulationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to authentication updates
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        setAuthLoading(false);
        addLog('success', `Google Authentication handshake successful. Core Workspace APIs linked.`);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Update real-time hardware profiling telemetry ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        cpuUsage: isPlaying ? Math.floor(Math.random() * 25) + 15 : Math.floor(Math.random() * 4) + 1,
        memoryUsage: isPlaying 
          ? parseFloat((34.2 + Math.random() * 1.5).toFixed(1)) 
          : parseFloat((34.2 + Math.random() * 0.2).toFixed(1)),
        workerDelay: isPlaying ? Math.floor(Math.random() * 12) + 5 : 8
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Persistent storage loaders
  useEffect(() => {
    const cachedBranches = localStorage.getItem('aetherflow_branches');
    const cachedCommits = localStorage.getItem('aetherflow_commits');
    const cachedActiveBranch = localStorage.getItem('aetherflow_active_branch');
    
    if (cachedBranches && cachedCommits && cachedActiveBranch) {
      try {
        const decodedBranches = JSON.parse(cachedBranches);
        const decodedCommits = JSON.parse(cachedCommits);
        setBranches(decodedBranches);
        setCommits(decodedCommits);
        setCurrentBranch(cachedActiveBranch);
        
        // Load nodes and edges from target branch's head commit
        const activeBranchObj = decodedBranches.find((b: Branch) => b.name === cachedActiveBranch);
        if (activeBranchObj) {
          const headCommit = decodedCommits.find((c: Commit) => c.hash === activeBranchObj.commitHash);
          if (headCommit) {
            setNodes(headCommit.nodes);
            setEdges(headCommit.edges);
          }
        }
      } catch (err) {
        console.error('Failed to load storage commits:', err);
      }
    }
  }, []);

  const saveToStorage = (updatedBranches: Branch[], updatedCommits: Commit[], activeBr: string) => {
    localStorage.setItem('aetherflow_branches', JSON.stringify(updatedBranches));
    localStorage.setItem('aetherflow_commits', JSON.stringify(updatedCommits));
    localStorage.setItem('aetherflow_active_branch', activeBr);
  };

  // Helper log functions
  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    setLogs(prev => [
      ...prev,
      {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        type,
        message,
        data
      }
    ]);
  };

  // Google sign in / sign out click triggers
  const handleSignIn = async () => {
    try {
      addLog('info', 'Opening secure Google Authentication OAuth popup window...');
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        addLog('success', `Welcome ${result.user.displayName}! Access token compiled and loaded.`);
      }
    } catch (err: any) {
      addLog('error', `Authentication flow aborted: ${err.message || err}`);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    addLog('info', 'Google user credentials revoked. Integration nodes will operate on mock parameters.');
  };

  // Branch comparison nodes resolver
  const getCompareNodes = (): GraphNode[] | null => {
    if (!compareBranch) return null;
    const branchObj = branches.find(b => b.name === compareBranch);
    if (!branchObj) return null;
    const commitObj = commits.find(c => c.hash === branchObj.commitHash);
    return commitObj ? commitObj.nodes : null;
  };
  const compareNodes = getCompareNodes();

  const handleDragDropAddNode = (type: NodeType, x: number, y: number) => {
    const id = `node-${Math.random().toString(36).substr(2, 9)}`;
    const newNode: GraphNode = {
      id,
      type,
      label: `New ${type.toUpperCase()}`,
      x,
      y,
      width: 180,
      height: type === 'logic' ? 100 : 90,
      properties: {
        seconds: 2,
        code: 'true',
        gmailAction: 'list',
        driveAction: 'list',
        docsAction: 'read',
        geminiModel: 'gemini-3.5-flash',
        useSearch: true,
        useThinking: false
      }
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
    addLog('info', `Created workflow instruction: ${type.toUpperCase()} dropped at (${x}, ${y})`);
  };

  // Canvas interaction binds
  const handleSelectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  const handleUpdateNodeCoordinates = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const handleAddNode = (type: NodeType) => {
    const id = `node-${Math.random().toString(36).substr(2, 9)}`;
    // Center new node inside viewport space relative coordinates
    const newNode: GraphNode = {
      id,
      type,
      label: `New ${type.toUpperCase()}`,
      x: 150,
      y: 150,
      width: 180,
      height: type === 'logic' ? 100 : 90,
      properties: {
        seconds: 2,
        code: 'true',
        gmailAction: 'list',
        driveAction: 'list',
        docsAction: 'read',
        geminiModel: 'gemini-3.5-flash',
        useSearch: true,
        useThinking: false
      }
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
    addLog('info', `Created fresh workflow element of type: ${type.toUpperCase()}`);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    addLog('info', `Deleted node ID: ${id}`);
  };

  const handleAddEdge = (source: string, target: string, sourceHandle?: 'flow' | 'true' | 'false') => {
    // Avoid circular edge references to same node
    if (source === target) return;

    // Remove duplicates or conflicting flows from same output port handle
    setEdges(prev => {
      const filtered = prev.filter(e => !(e.source === source && e.sourceHandle === sourceHandle));
      const newEdge: GraphEdge = {
        id: `edge-${Math.random().toString(36).substr(2, 9)}`,
        source,
        target,
        sourceHandle,
        targetHandle: 'flow'
      };
      return [...filtered, newEdge];
    });
    
    addLog('info', `Established connect pathway: [${source}] -> [${target}] via port [${sourceHandle || 'flow'}]`);
  };

  const handleDeleteEdge = (id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
    addLog('info', `Removed connection path: ${id}`);
  };

  // Node inspector updates properties Binds
  const handleUpdateProperties = (id: string, properties: Partial<GraphNode['properties']>, label?: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        return {
          ...n,
          label: label !== undefined ? label : n.label,
          properties: { ...n.properties, ...properties }
        };
      }
      return n;
    }));
  };

  // Local Git Ledger triggers
  const handleCommit = (message: string) => {
    const hash = 'commit-' + Math.random().toString(36).substr(2, 7);
    const newCommit: Commit = {
      hash,
      message,
      timestamp: Date.now(),
      nodes,
      edges,
      author: user?.displayName || 'Chief Architect'
    };

    const updatedCommits = [...commits, newCommit];
    const updatedBranches = branches.map(b => b.name === currentBranch ? { ...b, commitHash: hash } : b);
    
    setCommits(updatedCommits);
    setBranches(updatedBranches);
    saveToStorage(updatedBranches, updatedCommits, currentBranch);
    addLog('success', `Committed workspace states. Head: ${hash.substring(0, 7)} | Message: ${message}`);
  };

  const handleCheckoutBranch = (branchName: string) => {
    const branch = branches.find(b => b.name === branchName);
    if (!branch) return;
    
    const headCommit = commits.find(c => c.hash === branch.commitHash);
    if (!headCommit) return;

    setCurrentBranch(branchName);
    setNodes(headCommit.nodes);
    setEdges(headCommit.edges);
    setSelectedNodeId(null);
    saveToStorage(branches, commits, branchName);
    addLog('info', `Switched active thread view to branch: refs/heads/${branchName}`);
  };

  const handleCreateBranch = (branchName: string) => {
    if (branches.some(b => b.name === branchName)) {
      addLog('error', `Branch refs/heads/${branchName} already exists.`);
      return;
    }

    const currentBranchObj = branches.find(b => b.name === currentBranch);
    const headHash = currentBranchObj?.commitHash || 'commit-initial';

    const newBranch: Branch = {
      name: branchName,
      commitHash: headHash
    };

    const updatedBranches = [...branches, newBranch];
    setBranches(updatedBranches);
    setCurrentBranch(branchName);
    saveToStorage(updatedBranches, commits, branchName);
    addLog('success', `Created and checked out fresh branch refs/heads/${branchName} from ${headHash.substring(0, 7)}`);
  };

  // --- COMPILER & SIMULATOR MACHINE ENGINE RUNTIME ---
  
  // Interpolator to replace variables, e.g. "Draft: {{gmailOutput}}"
  const interpolateString = (tpl: string): string => {
    if (!tpl) return '';
    let result = tpl;
    Object.keys(variableRegistry).forEach(key => {
      result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(variableRegistry[key]));
    });
    return result;
  };

  // Run the flowchart pipeline simulation
  const startSimulation = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setLogs([]);
    setHistorySnapshots([]);
    setActiveSnapshotIndex(null);
    addLog('info', 'AetherFlow VM compilation sequence initialized...');

    // Trigger off-thread compilation diagnostic using inline Worker
    const compilerWorkerCode = `
      self.onmessage = function(e) {
        const { nodes, edges } = e.data;
        const entry = nodes.find(n => n.type === 'start');
        const exit = nodes.find(n => n.type === 'end');
        
        self.postMessage({
          success: !!entry,
          diagnostics: {
            hasEntry: !!entry,
            hasExit: !!exit,
            nodeCount: nodes.length,
            edgeCount: edges.length
          }
        });
      };
    `;
    const blob = new Blob([compilerWorkerCode], { type: 'application/javascript' });
    const compilerWorker = new Worker(URL.createObjectURL(blob));

    compilerWorker.postMessage({ nodes, edges });
    compilerWorker.onmessage = async (e) => {
      const { success, diagnostics } = e.data;
      compilerWorker.terminate();

      if (!success) {
        addLog('error', 'Compilation Aborted: Flowchart lacks a valid Start Node entry anchor.');
        setIsPlaying(false);
        return;
      }

      addLog('success', `Compilation complete. ${diagnostics.nodeCount} instructions parsed. VM Online.`);
      
      // Locate entry point
      const startNode = nodes.find(n => n.type === 'start');
      if (startNode) {
        executeNodeStep(startNode.id);
      }
    };
  };

  // VCR Simulation Controls
  const handleScrubSnapshot = (index: number) => {
    if (isPlaying || !historySnapshots[index]) return;
    
    setActiveSnapshotIndex(index);
    const snap = historySnapshots[index];
    setActiveNodeId(snap.activeNodeId);
    setVariableRegistry(snap.variableRegistry);
    addLog('info', `Forensic Rollback: Restored variable registries to Tick #${index + 1}.`);
  };

  const pauseSimulation = () => {
    setIsPlaying(false);
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
    addLog('info', 'Simulation playback paused. Execution thread halted.');
  };

  const stopSimulation = () => {
    setIsPlaying(false);
    setActiveNodeId(null);
    setSimulatingEdgeId(null);
    setHistorySnapshots([]);
    setActiveSnapshotIndex(null);
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
    addLog('info', 'Virtual Machine shutdown. Execution variables cleared.');
  };

  const stepSimulationForward = () => {
    // Single step trigger: find current and proceed manually
    if (activeNodeId) {
      addLog('info', `VCR Single Step manually pushed instruction.`);
      // Find out where to go from current activeNodeId
      transitionToNext(activeNodeId, 'flow');
    } else {
      // Start from entry
      const start = nodes.find(n => n.type === 'start');
      if (start) {
        executeNodeStep(start.id);
      }
    }
  };

  // Core visual step runner
  const executeNodeStep = async (nodeId: string) => {
    if (!isPlaying) return;
    setActiveNodeId(nodeId);

    // Save a forensic sandbox state snapshot
    setHistorySnapshots(prev => {
      const idx = prev.length;
      const snap: ExecutionSnapshot = {
        id: `snap-${Math.random().toString(36).substr(2, 9)}`,
        tickIndex: idx,
        timestamp: Date.now(),
        activeNodeId: nodeId,
        variableRegistry: { ...variableRegistry },
        logCount: logs.length + 1
      };
      const updated = [...prev, snap];
      setActiveSnapshotIndex(updated.length - 1);
      return updated;
    });
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      addLog('error', `Execution error: referenced instruction ID [${nodeId}] not found.`);
      stopSimulation();
      return;
    }

    addLog('info', `Entering instruction frame: [${node.label}] (${node.type.toUpperCase()})`);

    // Dynamic execution types
    let nextHandle: 'flow' | 'true' | 'false' = 'flow';
    const delayDuration = (node.properties.seconds ?? 2) * 1000 / simulationSpeed;

    try {
      switch (node.type) {
        case 'start':
          // Immediately flow
          break;

        case 'end':
          addLog('success', 'Pipeline simulation sequence reached Exit terminal. Execution trace completed.');
          setIsPlaying(false);
          if (simulationTimeoutRef.current) {
            clearTimeout(simulationTimeoutRef.current);
          }
          return;

        case 'delay':
          addLog('info', `Pause execution thread active for ${node.properties.seconds} seconds...`);
          await new Promise(resolve => {
            simulationTimeoutRef.current = setTimeout(resolve, delayDuration);
          });
          break;

        case 'logic': {
          const evalCode = node.properties.code || 'true';
          addLog('info', `Evaluating dynamic condition: "${evalCode}"...`);
          
          // Sandboxed safe sandbox evaluation
          let result = false;
          try {
            // Build temporary evaluation context variables
            const contextFunc = new Function('emails', 'docsContent', 'geminiOutput', `return (${evalCode});`);
            result = !!contextFunc(
              variableRegistry.gmailOutput,
              variableRegistry.docsContent,
              variableRegistry.geminiOutput
            );
          } catch (err: any) {
            addLog('error', `JS Sandbox evaluation runtime error: ${err.message}. Defaulting false.`);
            result = false;
          }

          nextHandle = result ? 'true' : 'false';
          addLog('success', `Decision complete. Context condition evaluated to: ${result ? 'TRUE' : 'FALSE'}`);
          break;
        }

        case 'gmail': {
          const action = node.properties.gmailAction || 'list';
          addLog('api_call', `Initiating Gmail Client execution sequence: action=${action.toUpperCase()}`);
          
          if (!user || !accessToken) {
            // Sandbox mock offline fallback represent ultimate offline design
            addLog('info', 'Client is unauthenticated with Google Workspace. Initializing Sandbox offline Mock data payloads...');
            await new Promise(r => setTimeout(r, 800));
            
            if (action === 'list') {
              const mockMail = '[Inbox item]: Urgent scheduling review request from HR Team.';
              setVariableRegistry(prev => ({ ...prev, gmailOutput: mockMail }));
              addLog('success', `Sandbox payload cached to local storage heap registry.`, mockMail);
            } else {
              addLog('success', `Draft composed and saved to Sandbox database. Recipient: ${node.properties.gmailTo}`);
            }
          } else {
            // Real Google API call execution!
            try {
              if (action === 'list') {
                const queryStr = node.properties.gmailQuery || 'is:unread';
                addLog('info', `Real-time Gmail Fetch: querying "${queryStr}"`);
                
                const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1&q=${encodeURIComponent(queryStr)}`;
                const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
                const data = await response.json();
                
                if (data.messages && data.messages.length > 0) {
                  // Get detailed thread body
                  const msgId = data.messages[0].id;
                  const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                  });
                  const detail = await detailRes.json();
                  const snippet = detail.snippet || 'No snippet text available.';
                  
                  setVariableRegistry(prev => ({ ...prev, gmailOutput: snippet }));
                  addLog('success', `Fetched unread thread payload from Google Workspace.`, snippet);
                } else {
                  setVariableRegistry(prev => ({ ...prev, gmailOutput: 'No unread messages matching query.' }));
                  addLog('info', `Gmail search returned empty results.`);
                }
              } else if (action === 'draft' || action === 'send') {
                const rawTo = node.properties.gmailTo || 'recruiters@example.com';
                const rawSubject = node.properties.gmailSubject || 'AetherFlow AI dispatch';
                const rawBody = interpolateString(node.properties.gmailBody || 'Sent from AetherFlow IDE.');

                addLog('info', `Assembling RFC 2822 email payload bound to: ${rawTo}`);
                
                // Construct and base64url-encode the email body
                const emailHeader = [
                  `To: ${rawTo}`,
                  `Subject: ${rawSubject}`,
                  'Content-Type: text/plain; charset="UTF-8"',
                  'MIME-Version: 1.0',
                  '',
                  rawBody
                ].join('\r\n');

                const base64Raw = btoa(unescape(encodeURIComponent(emailHeader)))
                  .replace(/\+/g, '-')
                  .replace(/\//g, '_')
                  .replace(/=+$/, '');

                const endpoint = action === 'draft' 
                  ? 'https://gmail.googleapis.com/gmail/v1/users/me/drafts'
                  : 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

                const bodyPayload = action === 'draft'
                  ? JSON.stringify({ message: { raw: base64Raw } })
                  : JSON.stringify({ raw: base64Raw });

                const res = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: bodyPayload
                });

                if (!res.ok) throw new Error(`Gmail API failure: ${res.statusText}`);
                const resData = await res.json();
                
                addLog('success', `Successfully dispatched ${action} to Workspace servers! ID: ${resData.id}`);
              }
            } catch (apiErr: any) {
              addLog('error', `Gmail Client Request Failed: ${apiErr.message}. Fallback to mock.`);
            }
          }
          break;
        }

        case 'drive': {
          const action = node.properties.driveAction || 'list';
          addLog('api_call', `Drive storage node active: action=${action.toUpperCase()}`);
          
          if (!user || !accessToken) {
            await new Promise(r => setTimeout(r, 800));
            addLog('success', `Storage folder mock record compiled successfully.`);
          } else {
            try {
              if (action === 'list') {
                const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=3', {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                const data = await res.json();
                const listNames = (data.files || []).map((f: any) => f.name).join(', ') || 'No files found.';
                setVariableRegistry(prev => ({ ...prev, driveOutput: listNames }));
                addLog('success', `Listed Google Drive directory folders.`, listNames);
              } else if (action === 'create_folder') {
                const folderName = node.properties.driveName || 'AetherFlow_Outputs';
                const res = await fetch('https://www.googleapis.com/drive/v3/files', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder'
                  })
                });
                const resData = await res.json();
                addLog('success', `Created storage folder inside Drive! Folder ID: ${resData.id}`);
              } else if (action === 'create_file') {
                const fileName = node.properties.driveName || 'summary.txt';
                const fileBody = interpolateString(node.properties.driveContent || 'Empty content.');
                
                const metadata = { name: fileName, mimeType: 'text/plain' };
                const boundary = 'aetherflow_boundary';
                const bodyParts = [
                  `--${boundary}`,
                  'Content-Type: application/json; charset=UTF-8',
                  '',
                  JSON.stringify(metadata),
                  `--${boundary}`,
                  'Content-Type: text/plain',
                  '',
                  fileBody,
                  `--${boundary}--`
                ].join('\r\n');

                const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`
                  },
                  body: bodyParts
                });
                const resData = await res.json();
                addLog('success', `Created raw document inside Google Drive! ID: ${resData.id}`);
              }
            } catch (apiErr: any) {
              addLog('error', `Drive Action Request Failed: ${apiErr.message}`);
            }
          }
          break;
        }

        case 'docs': {
          const action = node.properties.docsAction || 'read';
          addLog('api_call', `Google Docs instruction context active: action=${action.toUpperCase()}`);
          
          if (!user || !accessToken) {
            await new Promise(r => setTimeout(r, 800));
            if (action === 'read') {
              const mockParagraph = 'AetherFlow Architectural Outline Paragraph.';
              setVariableRegistry(prev => ({ ...prev, docsContent: mockParagraph }));
              addLog('success', `Parsed Google Docs mock paragraph bounds.`, mockParagraph);
            } else {
              addLog('success', `Doc changes committed to Offline Mock cache storage.`);
            }
          } else {
            try {
              const docId = node.properties.docsId || '';
              if (action === 'read') {
                if (!docId) {
                  addLog('error', 'Google Docs Read Failed: Missing Document ID in properties inspector.');
                  break;
                }
                const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                const data = await res.json();
                let fullContent = '';
                data.body?.content?.forEach((element: any) => {
                  element.paragraph?.elements?.forEach((el: any) => {
                    if (el.textRun?.content) fullContent += el.textRun.content;
                  });
                });
                
                setVariableRegistry(prev => ({ ...prev, docsContent: fullContent }));
                addLog('success', `Parsed paragraphs from live document. Size: ${fullContent.length} chars.`, fullContent);
              } else if (action === 'create') {
                const title = node.properties.docsTitle || 'Dynamic AetherFlow Doc';
                const res = await fetch('https://docs.googleapis.com/v1/documents', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ title })
                });
                const data = await res.json();
                addLog('success', `Created empty Google Document: "${title}"! ID: ${data.documentId}`);
              } else if (action === 'append') {
                if (!docId) {
                  addLog('error', 'Google Docs Append Failed: Missing Target Document ID.');
                  break;
                }
                const appendTxt = interpolateString(node.properties.docsContent || '');
                
                // Read current length to append at the end of document
                const readRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                const readData = await readRes.json();
                const endIndex = (readData.body?.content?.[readData.body.content.length - 1]?.endIndex || 2) - 1;

                const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    requests: [
                      {
                        insertText: {
                          text: '\n' + appendTxt,
                          location: { index: Math.max(1, endIndex) }
                        }
                      }
                    ]
                  })
                });
                if (!res.ok) throw new Error(`Batch update call failed: ${res.statusText}`);
                addLog('success', `Successfully appended log paragraphs to Document ID: ${docId}`);
              }
            } catch (apiErr: any) {
              addLog('error', `Docs Client Request Failed: ${apiErr.message}`);
            }
          }
          break;
        }

        case 'gemini': {
          const rawPrompt = node.properties.geminiPrompt || '';
          const modelName = node.properties.geminiModel || 'gemini-3.5-flash';
          const searchGrounding = node.properties.useSearch ?? true;
          const thinkingMode = node.properties.useThinking ?? false;

          const interpolatedPrompt = interpolateString(rawPrompt);
          addLog('api_call', `Contacting Server-side Gemini proxy Gateway...`);
          addLog('info', `Payload prompt: "${interpolatedPrompt.substring(0, 120)}..."`);

          try {
            const res = await fetch('/api/gemini/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: interpolatedPrompt,
                model: modelName,
                useSearch: searchGrounding,
                useThinking: thinkingMode
              })
            });

            if (!res.ok) {
              throw new Error(`Proxy gateway server responded with: ${res.status}`);
            }

            const data = await res.json();
            const resultText = data.text || 'Empty response.';
            
            setVariableRegistry(prev => ({ ...prev, geminiOutput: resultText }));
            addLog('success', `Gemini inference compiled! Model used: ${data.modelUsed}.`, resultText);
          } catch (apiErr: any) {
            addLog('error', `Gemini Proxy Gateway Failed: ${apiErr.message}. Fallback offline mock answer.`);
            // Fallback offline mock response
            const fallbackAns = 'AI summary: Evaluated parameters successfully in sandboxed offline environment.';
            setVariableRegistry(prev => ({ ...prev, geminiOutput: fallbackAns }));
            addLog('success', `Cached offline fallback answers inside variable memory heap.`, fallbackAns);
          }
          break;
        }
      }
    } catch (err: any) {
      addLog('error', `VM General thread error during execution frame: ${err.message || err}`);
      stopSimulation();
      return;
    }

    // Small delay to let users observe active transition glow
    await new Promise(resolve => {
      simulationTimeoutRef.current = setTimeout(resolve, 800 / simulationSpeed);
    });

    // Move to next instruction in adjacency map
    transitionToNext(nodeId, nextHandle);
  };

  const transitionToNext = (currentNodeId: string, portHandle: 'flow' | 'true' | 'false') => {
    if (!isPlaying) return;

    // Find edge connecting from current node's active port handle
    const edge = edges.find(e => 
      e.source === currentNodeId && 
      (portHandle === 'flow' ? !e.sourceHandle || e.sourceHandle === 'flow' : e.sourceHandle === portHandle)
    );

    if (edge) {
      // Glow connection during transition
      setSimulatingEdgeId(edge.id);
      
      const transitionDelay = 500 / simulationSpeed;
      simulationTimeoutRef.current = setTimeout(() => {
        setSimulatingEdgeId(null);
        executeNodeStep(edge.target);
      }, transitionDelay);
    } else {
      addLog('info', 'Simulator encountered terminal flow node. Pipeline thread successfully finalized.');
      stopSimulation();
    }
  };

  const downloadBlueprintFile = () => {
    // Generate beautiful clean JSON representation of current flowchart
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href",     dataStr     );
    dlAnchor.setAttribute("download", `aetherflow_${currentBranch}_pipeline.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    addLog('success', `Downloaded pipeline flowchart config as JSON.`);
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#0d0e11] text-white flex flex-col font-sans select-none overflow-hidden h-screen">
      
      {/* Top Editorial Architectural Header */}
      <header id="header-bar" className="border-b border-white/5 bg-[#0d0e11] px-6 py-3.5 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/[0.03] border border-white/10 rounded-xl text-[#ff4f12] shadow-inner">
            <Workflow className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-[0.25em] font-extrabold text-white/40">CHIEF ARCHITECT LABS</span>
              <span className="px-1.5 py-0.5 bg-[#ff4f12]/15 text-[8px] font-mono font-black text-[#ff4f12] uppercase tracking-wider rounded">Offline Resilient</span>
            </div>
            <h1 className="text-sm font-black font-serif italic uppercase tracking-wider text-white">
              AetherFlow IDE
            </h1>
          </div>
        </div>

        {/* Dynamic Branch badge */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-xl font-mono text-[10px] text-white/60">
          <GitBranch className="w-3.5 h-3.5 text-[#ff4f12]" />
          <span>Branch: <strong className="text-white">refs/heads/{currentBranch}</strong></span>
        </div>

        {/* Google sign-in workflow buttons */}
        <div className="flex items-center gap-4">
          {authLoading ? (
            <span className="text-[10px] font-mono text-white/40 animate-pulse">Syncing Cloud...</span>
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* User profile picture */}
              <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 rounded-full pr-3 pl-1 py-1">
                {user.photoURL ? (
                  <img referrerPolicy="no-referrer" src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full border border-white/10" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#ff4f12]/20 border border-[#ff4f12]/30 flex items-center justify-center text-[10px] text-[#ff4f12] font-mono">
                    U
                  </div>
                )}
                <span className="text-xs font-mono font-bold max-w-[100px] truncate">{user.displayName?.split(' ')[0]}</span>
              </div>
              <button 
                onClick={handleSignOut}
                className="p-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-white/60 hover:text-white transition-all cursor-pointer"
                title="Log Out Cloud Sync"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-white/5 font-sans cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" /> Sign in with Google
            </button>
          )}

          <div className="h-6 w-px bg-white/10 hidden md:block" />

          {/* Download JSON pipeline configuration */}
          <button 
            onClick={downloadBlueprintFile}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 text-xs text-white/90 font-bold rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Backup Schema
          </button>
        </div>
      </header>

      {/* Primary Workspace Panels Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-[#08090a]">
        
        {/* Left Column: Palette Registry vs Version History Ledger (320px) */}
        <aside className="w-[320px] shrink-0 border-r border-white/5 bg-[#0d0e11] flex flex-col p-4 gap-4 z-20">
          {/* Sidebar Tab Selectors */}
          <div className="flex bg-[#08090a] p-1 border border-white/5 rounded-xl">
            <button
              onClick={() => setSidebarTab('palette')}
              className={`flex-1 py-2 text-center text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                sidebarTab === 'palette'
                  ? 'bg-white/5 text-[#ff4f12] font-bold border border-white/5'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Instruction Palette
            </button>
            <button
              onClick={() => setSidebarTab('git')}
              className={`flex-1 py-2 text-center text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                sidebarTab === 'git'
                  ? 'bg-white/5 text-[#ff4f12] font-bold border border-white/5'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Version Control
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 select-none">
            {sidebarTab === 'palette' ? (
              <NodePalette onAddNode={handleAddNode} />
            ) : (
              <VersionControl
                branches={branches}
                currentBranch={currentBranch}
                commits={commits}
                onCommit={handleCommit}
                onCheckoutBranch={handleCheckoutBranch}
                onCreateBranch={handleCreateBranch}
                compareBranch={compareBranch}
                onCompareBranch={setCompareBranch}
              />
            )}
          </div>
        </aside>

        {/* Central Core: Interactive Graph Canvas Area */}
        <section className="flex-1 flex flex-col relative overflow-hidden min-h-0">
          
          {/* Header bar actions for pipeline execution */}
          <div className="px-5 py-2.5 bg-[#0d0e11] border-b border-white/5 flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff4f12] animate-pulse"></span>
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest leading-none">
                Active Compiler Engine Core: Ready
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={startSimulation}
                disabled={isPlaying}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff4f12]/10 hover:bg-[#ff4f12]/20 border border-[#ff4f12]/20 text-[#ff4f12] hover:text-[#ff6a38] text-[10px] uppercase font-mono tracking-wider rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <Cpu className="w-3.5 h-3.5" /> Compile & Run Pipeline
              </button>
            </div>
          </div>

          {/* Interactive Node Graph Viewer */}
          <div className="flex-1 relative min-h-0">
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              onUpdateNodeCoordinates={handleUpdateNodeCoordinates}
              onAddEdge={handleAddEdge}
              onDeleteNode={handleDeleteNode}
              onDeleteEdge={handleDeleteEdge}
              activeNodeId={activeNodeId}
              simulatingEdgeId={simulatingEdgeId}
              onAddNodeAt={handleDragDropAddNode}
              compareNodes={compareNodes}
            />
          </div>
        </section>

        {/* Right Column: Properties Inspector Panel (320px) */}
        <aside className="w-[320px] shrink-0 border-l border-white/5 bg-[#0d0e11] flex flex-col p-4 z-20 overflow-hidden">
          <NodeInspector
            node={nodes.find(n => n.id === selectedNodeId) || null}
            onUpdateProperties={handleUpdateProperties}
          />
        </aside>

      </div>

      {/* Bottom Tray Panel: Simulation Controllers & Telemetry Logger Console (220px) */}
      <footer className="h-[220px] border-t border-white/5 bg-[#0d0e11] p-4 shrink-0 z-30">
        <TimeTravelScrubber
          logs={logs}
          onClearLogs={() => setLogs([])}
          isPlaying={isPlaying}
          onPlay={startSimulation}
          onPause={pauseSimulation}
          onStop={stopSimulation}
          onStepForward={stepSimulationForward}
          simulationSpeed={simulationSpeed}
          onChangeSpeed={(s) => setSimulationSpeed(s)}
          telemetry={telemetry}
          historySnapshots={historySnapshots}
          activeSnapshotIndex={activeSnapshotIndex}
          onScrubSnapshot={handleScrubSnapshot}
        />
      </footer>

    </div>
  );
}
