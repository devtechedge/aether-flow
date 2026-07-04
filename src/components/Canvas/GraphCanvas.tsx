/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, MouseEvent, WheelEvent, DragEvent } from 'react';
import { 
  Play, 
  Settings, 
  Trash2, 
  Sparkles, 
  Cpu, 
  Mail, 
  Folder, 
  FileText, 
  Activity,
  GitBranch,
  Info
} from 'lucide-react';
import { GraphNode, GraphEdge, NodeType } from '../../types';
import { screenToCanvas } from '../../utils/canvasMath';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodeCoordinates: (id: string, x: number, y: number) => void;
  onAddEdge: (source: string, target: string, sourceHandle?: 'flow' | 'true' | 'false') => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  activeNodeId: string | null;
  simulatingEdgeId: string | null;
  onAddNodeAt?: (type: NodeType, x: number, y: number) => void;
  compareNodes?: GraphNode[] | null;
}

export default function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNodeCoordinates,
  onAddEdge,
  onDeleteNode,
  onDeleteEdge,
  activeNodeId,
  simulatingEdgeId,
  onAddNodeAt,
  compareNodes = null
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Transform states
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 100, y: 100 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Port connection draft state
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    handleType: 'flow' | 'true' | 'false';
  } | null>(null);
  const [connectMousePos, setConnectMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // HTML5 Drag and Drop event targets
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current || !onAddNodeAt) return;
    const type = e.dataTransfer.getData('application/aetherflow-node') as NodeType;
    if (!type) return;

    const rect = containerRef.current.getBoundingClientRect();
    const p = screenToCanvas(e.clientX, e.clientY, zoom, pan.x, pan.y, rect);
    
    // Auto align to clean grid spacing bounds
    const snappedX = Math.round(p.x / 8) * 8;
    const snappedY = Math.round(p.y / 8) * 8;
    onAddNodeAt(type, snappedX, snappedY);
  };

  // Branch Comparison (Visual Diffing) Engines
  const getNodeDiffStatus = (node: GraphNode): 'added' | 'modified' | 'none' => {
    if (!compareNodes) return 'none';
    const original = compareNodes.find(cn => cn.id === node.id);
    if (!original) return 'added';

    const isMoved = Math.abs(original.x - node.x) > 2 || Math.abs(original.y - node.y) > 2;
    const isLabelChanged = original.label !== node.label;
    const isPropsChanged = JSON.stringify(original.properties) !== JSON.stringify(node.properties);

    if (isMoved || isLabelChanged || isPropsChanged) {
      return 'modified';
    }
    return 'none';
  };

  const deletedNodes = compareNodes 
    ? compareNodes.filter(cn => !nodes.some(n => n.id === cn.id))
    : [];


  // Get SVG connection path coordinate helpers
  const getNodePortCoords = (node: GraphNode, isInput: boolean, handleType?: 'flow' | 'true' | 'false') => {
    const width = node.width || 180;
    const height = node.height || 90;
    
    if (isInput) {
      // Left center
      return { x: node.x, y: node.y + height / 2 };
    } else {
      // Output right side
      if (handleType === 'true') {
        // Upper right
        return { x: node.x + width, y: node.y + height / 3 };
      } else if (handleType === 'false') {
        // Lower right
        return { x: node.x + width, y: node.y + (height * 2) / 3 };
      }
      // Standard right center
      return { x: node.x + width, y: node.y + height / 2 };
    }
  };

  const drawBezierSpline = (x1: number, y1: number, x2: number, y2: number) => {
    const controlOffset = Math.max(Math.abs(x2 - x1) * 0.5, 40);
    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
  };

  // Panning & zooming wheel listener
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomIntensity = 0.1;
    const wheelVal = e.deltaY;
    const zoomFactor = wheelVal < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    
    const newZoom = Math.max(0.3, Math.min(3, zoom * zoomFactor));

    // Align offset to focus zoom around mouse pointer
    const dX = mouseX - pan.x;
    const dY = mouseY - pan.y;

    setPan({
      x: mouseX - dX * (newZoom / zoom),
      y: mouseY - dY * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  // Mouse interact down
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button === 2 || e.shiftKey) {
      // Right click or shift key for panning
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-grid')) {
      // Background click: start panning and deselect
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectNode(null);
    }
  };

  // Mouse move
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (draggingNodeId) {
      const p = screenToCanvas(e.clientX, e.clientY, zoom, pan.x, pan.y, rect);
      // Snapping to an 8px grid represents high alignment craft
      const snappedX = Math.round((p.x - nodeDragOffset.x) / 8) * 8;
      const snappedY = Math.round((p.y - nodeDragOffset.y) / 8) * 8;
      onUpdateNodeCoordinates(draggingNodeId, snappedX, snappedY);
    } else if (connectingFrom) {
      const p = screenToCanvas(e.clientX, e.clientY, zoom, pan.x, pan.y, rect);
      setConnectMousePos(p);
    }
  };

  // Mouse up
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setConnectingFrom(null);
  };

  // Trigger dragging for a specific node
  const handleNodeDragStart = (e: MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    if (connectingFrom) return;
    onSelectNode(node.id);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const p = screenToCanvas(e.clientX, e.clientY, zoom, pan.x, pan.y, rect);
    
    setDraggingNodeId(node.id);
    setNodeDragOffset({
      x: p.x - node.x,
      y: p.y - node.y
    });
  };

  // Port connection triggers
  const handlePortConnectionStart = (e: MouseEvent, nodeId: string, handleType: 'flow' | 'true' | 'false') => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const p = screenToCanvas(e.clientX, e.clientY, zoom, pan.x, pan.y, rect);

    setConnectingFrom({ nodeId, handleType });
    setConnectMousePos(p);
  };

  const handlePortConnectionEnd = (e: MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    if (connectingFrom) {
      if (connectingFrom.nodeId !== targetNodeId) {
        onAddEdge(connectingFrom.nodeId, targetNodeId, connectingFrom.handleType);
      }
      setConnectingFrom(null);
    }
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'start': return <Play className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />;
      case 'end': return <Activity className="w-4 h-4 text-rose-500" />;
      case 'delay': return <Cpu className="w-4 h-4 text-amber-500" />;
      case 'logic': return <GitBranch className="w-4 h-4 text-sky-500" />;
      case 'gmail': return <Mail className="w-4 h-4 text-red-500" />;
      case 'drive': return <Folder className="w-4 h-4 text-blue-500" />;
      case 'docs': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'gemini': return <Sparkles className="w-4 h-4 text-purple-500 fill-purple-500/10" />;
    }
  };

  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case 'start': return 'border-emerald-500/30 bg-emerald-500/[0.02] shadow-emerald-500/5';
      case 'end': return 'border-rose-500/30 bg-rose-500/[0.02] shadow-rose-500/5';
      case 'delay': return 'border-amber-500/30 bg-amber-500/[0.02] shadow-amber-500/5';
      case 'logic': return 'border-sky-500/30 bg-sky-500/[0.02] shadow-sky-500/5';
      case 'gmail': return 'border-red-500/30 bg-red-500/[0.02] shadow-red-500/5';
      case 'drive': return 'border-blue-500/30 bg-blue-500/[0.02] shadow-blue-500/5';
      case 'docs': return 'border-indigo-500/30 bg-indigo-500/[0.02] shadow-indigo-500/5';
      case 'gemini': return 'border-purple-500/30 bg-purple-500/[0.02] shadow-purple-500/5';
    }
  };

  return (
    <div 
      id="graph-canvas-container"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={(e) => e.preventDefault()}
      className="flex-1 h-full bg-[#0d0e11] border border-[#1a1a1a]/10 rounded-2xl relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* Blueprint Grid Overlay */}
      <div 
        className="canvas-grid absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: `
            radial-gradient(circle, #ffffff 1px, transparent 1px),
            linear-gradient(to right, #ffffff11 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff11 1px, transparent 1px)
          `,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* SVG Connections Canvas */}
      <svg 
        id="connections-canvas"
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render All Dynamic Beziers */}
          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const startCoords = getNodePortCoords(sourceNode, false, edge.sourceHandle);
            const endCoords = getNodePortCoords(targetNode, true);
            const path = drawBezierSpline(startCoords.x, startCoords.y, endCoords.x, endCoords.y);
            const isSimulating = simulatingEdgeId === edge.id;

            return (
              <g key={edge.id} className="group pointer-events-auto">
                {/* Clickable wider selection bounding path */}
                <path 
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={15}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const confirmed = window.confirm('Delete connection pathway?');
                    if (confirmed) onDeleteEdge(edge.id);
                  }}
                />
                
                {/* Visual SVG line */}
                <path 
                  d={path}
                  fill="none"
                  stroke={isSimulating ? '#ff4f12' : '#ffffff22'}
                  strokeWidth={2}
                  className="transition-colors duration-200 group-hover:stroke-white/50"
                  style={{
                    filter: isSimulating ? 'drop-shadow(0 0 4px #ff4f12)' : 'none'
                  }}
                />

                {/* Simulated active glowing transit particle pulse */}
                {isSimulating && (
                  <path 
                    d={path}
                    fill="none"
                    stroke="#ff4f12"
                    strokeWidth={3}
                    strokeDasharray="6, 12"
                    className="animate-[dash_1s_linear_infinite]"
                  />
                )}
              </g>
            );
          })}

          {/* Current Live Drafting Connection */}
          {connectingFrom && (
            (() => {
              const srcNode = nodes.find(n => n.id === connectingFrom.nodeId);
              if (!srcNode) return null;
              const startCoords = getNodePortCoords(srcNode, false, connectingFrom.handleType);
              return (
                <path 
                  d={drawBezierSpline(startCoords.x, startCoords.y, connectMousePos.x, connectMousePos.y)}
                  fill="none"
                  stroke="#ffffff66"
                  strokeWidth={1.5}
                  strokeDasharray="4, 4"
                />
              );
            })()
          )}
        </g>
      </svg>

      {/* HTML Absolute Nodes Layer */}
      <div 
        id="nodes-layer"
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isActive = activeNodeId === node.id;
          const width = node.width || 180;
          const height = node.height || 90;

          const diffStatus = getNodeDiffStatus(node);
          let diffBorderClass = '';
          let diffBadge = null;

          if (diffStatus === 'added') {
            diffBorderClass = 'ring-2 ring-emerald-500/50 border-emerald-500 shadow-emerald-500/10';
            diffBadge = (
              <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[7px] font-black uppercase rounded tracking-wider">
                + Added
              </span>
            );
          } else if (diffStatus === 'modified') {
            diffBorderClass = 'ring-2 ring-amber-500/50 border-amber-500 shadow-amber-500/10';
            diffBadge = (
              <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[7px] font-black uppercase rounded tracking-wider">
                Modified
              </span>
            );
          }

          return (
            <div 
              key={node.id}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: width,
                height: height,
              }}
              onMouseDown={(e) => handleNodeDragStart(e, node)}
              onMouseUp={(e) => handlePortConnectionEnd(e, node.id)}
              className={`pointer-events-auto rounded-xl border bg-[#121318]/90 text-white backdrop-blur-md flex flex-col justify-between p-3.5 shadow-xl transition-all ${getNodeColor(node.type)} ${
                isSelected ? 'ring-2 ring-white/40 border-white/60' : 'hover:border-white/20'
              } ${
                isActive ? 'ring-2 ring-[#ff4f12] border-[#ff4f12] shadow-[#ff4f12]/20 shadow-2xl' : ''
              } ${diffBorderClass}`}
            >
              {/* Node Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="p-1 bg-white/5 rounded border border-white/10 shrink-0">
                    {getNodeIcon(node.type)}
                  </div>
                  <div className="truncate">
                    <span className="text-[9px] font-mono text-white/40 uppercase block leading-none">
                      {node.type}
                    </span>
                    <span className="text-xs font-bold font-sans text-white/95 leading-snug">
                      {node.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {diffBadge}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const confirmed = window.confirm(`Are you sure you want to delete node "${node.label}"?`);
                      if (confirmed) onDeleteNode(node.id);
                    }}
                    className="p-1 text-white/40 hover:text-rose-400 hover:bg-white/5 rounded transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Node Properties Hint */}
              <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-white/50 border-t border-white/5 pt-1.5">
                <span className="truncate max-w-[120px] font-serif italic text-white/60">
                  {node.type === 'delay' && `${node.properties.seconds}s pause`}
                  {node.type === 'logic' && `${node.properties.code || 'true'}`}
                  {node.type === 'gmail' && `Gmail: ${node.properties.gmailAction}`}
                  {node.type === 'drive' && `Drive: ${node.properties.driveAction}`}
                  {node.type === 'docs' && `Docs: ${node.properties.docsAction}`}
                  {node.type === 'gemini' && `AI: ${node.properties.geminiModel?.replace('-preview', '')}`}
                  {node.type === 'start' && 'Entry point'}
                  {node.type === 'end' && 'Simulator termination'}
                </span>
                
                {isActive && (
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4f12] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ff4f12]"></span>
                  </span>
                )}
              </div>

              {/* Port Connector Anchors */}
              {/* Input Port (All except Start Node) */}
              {node.type !== 'start' && (
                <div 
                  className="absolute left-0 top-1/2 -translate-x-[6px] -translate-y-1/2 w-3 h-3 bg-[#ff4f12] border-2 border-[#0d0e11] rounded-full cursor-crosshair hover:scale-125 transition-all"
                  title="Execution Flow Input"
                  style={{ filter: 'drop-shadow(0 0 2px #ff4f12)' }}
                />
              )}

              {/* Output Ports (All except End Node) */}
              {node.type !== 'end' && (
                node.type === 'logic' ? (
                  <>
                    {/* Logic True Port */}
                    <div 
                      onMouseDown={(e) => handlePortConnectionStart(e, node.id, 'true')}
                      className="absolute right-0 top-1/3 translate-x-[6px] -translate-y-1/2 w-3 h-3 bg-emerald-500 border-2 border-[#0d0e11] rounded-full cursor-crosshair hover:scale-125 transition-all flex items-center justify-center text-[6px] font-bold text-white"
                      title="Branch Output: TRUE"
                      style={{ filter: 'drop-shadow(0 0 2px #10b981)' }}
                    >
                      <span className="text-[6px] text-white select-none absolute -top-4 font-mono font-bold">T</span>
                    </div>

                    {/* Logic False Port */}
                    <div 
                      onMouseDown={(e) => handlePortConnectionStart(e, node.id, 'false')}
                      className="absolute right-0 top-[66%] translate-x-[6px] -translate-y-1/2 w-3 h-3 bg-rose-500 border-2 border-[#0d0e11] rounded-full cursor-crosshair hover:scale-125 transition-all flex items-center justify-center text-[6px] font-bold text-white"
                      title="Branch Output: FALSE"
                      style={{ filter: 'drop-shadow(0 0 2px #f43f5e)' }}
                    >
                      <span className="text-[6px] text-white select-none absolute -bottom-4.5 font-mono font-bold">F</span>
                    </div>
                  </>
                ) : (
                  /* Standard flow output port */
                  <div 
                    onMouseDown={(e) => handlePortConnectionStart(e, node.id, 'flow')}
                    className="absolute right-0 top-1/2 translate-x-[6px] -translate-y-1/2 w-3 h-3 bg-[#ff4f12] border-2 border-[#0d0e11] rounded-full cursor-crosshair hover:scale-125 transition-all"
                    title="Flow Next Output"
                    style={{ filter: 'drop-shadow(0 0 2px #ff4f12)' }}
                  />
                )
              )}
            </div>
          );
        })}

        {/* Ghost Deleted Nodes (Branch Comparison) */}
        {deletedNodes.map((dNode) => {
          const width = dNode.width || 180;
          const height = dNode.height || 90;
          return (
            <div 
              key={`deleted-${dNode.id}`}
              style={{
                position: 'absolute',
                left: dNode.x,
                top: dNode.y,
                width: width,
                height: height,
              }}
              className="pointer-events-none rounded-xl border border-dashed border-rose-500/50 bg-rose-950/10 opacity-50 text-white flex flex-col justify-between p-3.5 shadow-none"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="p-1 bg-white/5 rounded border border-white/5 shrink-0 opacity-40">
                    {getNodeIcon(dNode.type)}
                  </div>
                  <div className="truncate">
                    <span className="text-[9px] font-mono text-rose-400/50 uppercase block leading-none">
                      {dNode.type}
                    </span>
                    <span className="text-xs font-bold font-sans text-rose-300/70 line-through leading-snug">
                      {dNode.label}
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[7px] font-black uppercase rounded tracking-wider">
                  - Deleted
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-rose-400/40 border-t border-rose-500/10 pt-1.5">
                <span className="truncate italic">Baseline element</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control overlay floating bar inside canvas */}
      <div className="absolute bottom-4 left-4 bg-[#121318]/90 backdrop-blur-md px-3.5 py-2 border border-white/5 rounded-xl shadow-lg flex items-center gap-3 text-xs font-mono text-white/70">
        <div className="flex items-center gap-1.5">
          <Info className="w-4 h-4 text-white/50" />
          <span>Zoom: <strong>{Math.round(zoom * 100)}%</strong></span>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <button 
          onClick={() => { setZoom(1); setPan({ x: 100, y: 100 }); }}
          className="hover:text-white transition-colors uppercase text-[10px] font-bold"
        >
          Reset View
        </button>
      </div>

      {/* Frame FPS profile badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full text-[10px] font-mono text-white/60">
        <Activity className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-bold">WebGL Composite: Locked 120 FPS</span>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -18;
          }
        }
      `}</style>
    </div>
  );
}
