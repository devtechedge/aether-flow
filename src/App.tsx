/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Workflow, 
  Download, 
  Cpu, 
  Layers, 
  GitBranch, 
  User as UserIcon,
} from 'lucide-react';

import { GraphNode, GraphEdge, Commit, Branch, LogEntry, TelemetryData, NodeType, ExecutionSnapshot } from './types';
import GraphCanvas from './components/Canvas/GraphCanvas';
import NodePalette from './components/Sidebar/NodePalette';
import NodeInspector from './components/Inspector/NodeInspector';
import VersionControl from './components/Sidebar/VersionControl';
import TimeTravelScrubber from './components/Timeline/TimeTravelScrubber';
import ThemeToggle from './components/ThemeToggle';
import { initAuth, googleSignIn, logout, firebaseEnabled, formatAuthError } from './lib/firebase';
import ViewportLock from './components/ViewportLock';
import { compileGraph, nextEdge } from './utils/graphCompile';
import { interpolateTemplate } from './utils/interpolate';
import { evaluateLogic } from './utils/logicEval';

// Pre-configured default master demonstration graph
const DEFAULT_NODES: GraphNode[] = [
  {
    id: 'node-start',
    type: 'start',
    label: 'Pipeline Entry',
    x: 80,
    y: 70,
    width: 180,
    height: 90,
    properties: {}
  },
  {
    id: 'node-gmail-fetch',
    type: 'gmail',
    label: 'Scan Workspace Inbox',
    x: 80,
    y: 280,
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
    x: 400,
    y: 70,
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
    x: 400,
    y: 280,
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
    x: 720,
    y: 70,
    width: 180,
    height: 90,
    properties: {
      gmailAction: 'draft',
      gmailTo: 'team@example.com',
      gmailSubject: 'AetherFlow Auto-Response Draft',
      gmailBody: 'Hi Team,\n\nHere is the AI compiled scheduling outline:\n\n{{geminiOutput}}\n\nWarm regards,\nAetherFlow Agent'
    }
  },
  {
    id: 'node-end',
    type: 'end',
    label: 'Pipeline Completed',
    x: 720,
    y: 280,
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
  const [mobilePanel, setMobilePanel] = useState<'none' | 'left' | 'right'>('none');

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
  const simulationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);

  const setPlaying = (value: boolean) => {
    isPlayingRef.current = value;
    setIsPlaying(value);
  };

  // Subscribe to authentication updates
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        setAuthLoading(false);
        if (token) {
          addLog('success', `Signed in as ${authUser.displayName || authUser.email || 'Google user'}. Workspace APIs linked.`);
        } else {
          addLog('info', `Signed in as ${authUser.displayName || authUser.email || 'Google user'}. Click Sign in with Google again to grant Gmail / Drive / Docs.`);
        }
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
    if (!firebaseEnabled) {
      addLog('error', 'Google sign-in is not configured.');
      return;
    }
    try {
      addLog('info', 'Opening Google sign-in…');
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        if (result.accessToken) {
          addLog('success', `Welcome ${result.user.displayName || result.user.email || 'Google user'}. Gmail / Drive / Docs linked.`);
        } else {
          addLog('info', `Welcome ${result.user.displayName || result.user.email || 'Google user'}. Workspace scopes were not granted; nodes will stay on mock data.`);
        }
      } else {
        addLog('info', 'Continuing Google sign-in in this window…');
      }
    } catch (err: unknown) {
      addLog('error', formatAuthError(err));
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
  const interpolateString = (tpl: string): string => interpolateTemplate(tpl, variableRegistry);

  // Run the flowchart pipeline simulation
  const startSimulation = async () => {
    if (isPlayingRef.current) return;
    setPlaying(true);
    setLogs([]);
    setHistorySnapshots([]);
    setActiveSnapshotIndex(null);

    const diagnostics = compileGraph(nodes, edges);
    if (!diagnostics.ok || !diagnostics.startId) {
      addLog('error', diagnostics.errors[0] || 'Compilation aborted.');
      setPlaying(false);
      return;
    }

    addLog('success', `Compilation complete. ${diagnostics.nodeCount} instructions parsed.`);
    executeNodeStep(diagnostics.startId);
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
    setPlaying(false);
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
    addLog('info', 'Simulation playback paused. Execution thread halted.');
  };

  const stopSimulation = () => {
    setPlaying(false);
    setActiveNodeId(null);
    setSimulatingEdgeId(null);
    setHistorySnapshots([]);
    setActiveSnapshotIndex(null);
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
    addLog('info', 'Simulator stopped. Execution variables cleared.');
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
    if (!isPlayingRef.current) return;
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
          setPlaying(false);
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
          const result = evaluateLogic(evalCode, {
            emails: variableRegistry.gmailOutput,
            docsContent: variableRegistry.docsContent,
            geminiOutput: variableRegistry.geminiOutput,
          });
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
                const rawTo = node.properties.gmailTo || 'team@example.com';
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
    if (!isPlayingRef.current) return;

    const edge = nextEdge(edges, currentNodeId, portHandle);

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

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-center text-[10px] font-semibold uppercase tracking-wider ${
      active ? 'bg-surface text-accent shadow-[inset_0_0_0_1px_var(--line)]' : 'text-subtle hover:text-fg'
    }`;

  return (
    <div id="app-root" data-testid="app-root" className="ide select-none">
      <ViewportLock />
      <header id="header-bar" data-testid="app-header" className="ide-header">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-well text-accent shadow-[inset_0_0_0_1px_var(--line-strong)]">
            <Workflow className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-subtle">
                Chief Architect Labs
              </span>
              <span className="hidden rounded bg-accent/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-accent sm:inline">
                Offline Resilient
              </span>
            </div>
            <h1 className="text-sm font-semibold uppercase tracking-wider">AetherFlow IDE</h1>
          </div>
        </div>

        <div className="ide-wide items-center gap-2 rounded-xl border border-line bg-well px-3 py-1.5 text-[10px] text-muted">
          <GitBranch className="size-3.5 text-accent" />
          <span>
            Branch: <strong className="text-fg">refs/heads/{currentBranch}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ide-dock ide-dock-palette"
            onClick={() => setMobilePanel((p) => (p === 'left' ? 'none' : 'left'))}
          >
            <Layers className="size-4" />
            <span className="hidden sm:inline">Palette</span>
          </button>
          {authLoading ? (
            <span className="text-[10px] text-subtle">Syncing…</span>
          ) : user ? (
            <div className="auth-chip text-xs font-medium text-fg">
              {user.photoURL ? (
                <img referrerPolicy="no-referrer" src={user.photoURL} alt={user.displayName || 'User'} />
              ) : (
                <div className="grid size-6 place-items-center rounded-full bg-accent/20 text-[10px] text-accent">
                  {(user.displayName || 'U').slice(0, 1)}
                </div>
              )}
              <span>{user.displayName?.split(' ')[0]}</span>
              <button type="button" onClick={handleSignOut} title="Log out">
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid="google-signin"
              onClick={handleSignIn}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-fg hover:opacity-90"
            >
              <UserIcon className="size-3.5" /> Sign in with Google
            </button>
          )}
          <button
            type="button"
            onClick={downloadBlueprintFile}
            className="hidden items-center gap-1.5 rounded-xl border border-line bg-well px-3.5 py-2 text-xs font-semibold text-fg hover:border-line-strong md:flex"
          >
            <Download className="size-3.5" /> Backup Schema
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="ide-body">
        <aside className={`ide-rail ide-rail-left ${mobilePanel === 'left' ? 'is-open' : ''}`}>
          <div className="flex rounded-xl border border-line bg-well p-1">
            <button type="button" data-testid="tab-palette" onClick={() => setSidebarTab('palette')} className={tabClass(sidebarTab === 'palette')}>
              Instruction Palette
            </button>
            <button type="button" data-testid="tab-git" onClick={() => setSidebarTab('git')} className={tabClass(sidebarTab === 'git')}>
              Version Control
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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

        <section className="ide-stage">
          <div className="ide-stage-bar">
            <div className="flex min-w-0 items-center gap-2">
              <span className="size-2 shrink-0 animate-pulse rounded-full bg-accent" />
              <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted">
                <span className="ide-status-short">Engine ready</span>
                <span className="ide-status-full">Compiler engine ready</span>
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="ide-dock ide-dock-inspector"
                onClick={() => setMobilePanel((p) => (p === 'right' ? 'none' : 'right'))}
              >
                Inspector
              </button>
              <button
                type="button"
                data-testid="run-pipeline"
                onClick={() => void startSimulation()}
                disabled={isPlaying}
                className="flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent disabled:opacity-40"
              >
                <Cpu className="size-3.5" />
                <span className="ide-status-short">Run</span>
                <span className="ide-status-full">Run pipeline</span>
              </button>
            </div>
          </div>
          <div className="ide-stage-canvas">
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

        <aside className={`ide-rail ide-rail-right ${mobilePanel === 'right' ? 'is-open' : ''}`}>
          <NodeInspector
            node={nodes.find(n => n.id === selectedNodeId) || null}
            onUpdateProperties={handleUpdateProperties}
          />
        </aside>

        {mobilePanel !== 'none' && (
          <button
            type="button"
            className="ide-scrim"
            aria-label="Close panel"
            onClick={() => setMobilePanel('none')}
          />
        )}
      </div>

      <footer className="ide-deck">
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
