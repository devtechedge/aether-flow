import { useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  Play,
  Trash2,
  Sparkles,
  Cpu,
  Mail,
  Folder,
  FileText,
  Activity,
  GitBranch,
  Info,
} from "lucide-react";
import type { GraphEdge, GraphNode, NodeType } from "../../types";
import { screenToCanvas } from "../../utils/canvasMath";
import { deletedNodes as findDeletedNodes, diffNode } from "../../utils/nodeDiff";
import { canvasViewport, queryVisibleIds } from "../../utils/visibleNodes";

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodeCoordinates: (id: string, x: number, y: number) => void;
  onAddEdge: (source: string, target: string, sourceHandle?: "flow" | "true" | "false") => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  activeNodeId: string | null;
  simulatingEdgeId: string | null;
  onAddNodeAt?: (type: NodeType, x: number, y: number) => void;
  compareNodes?: GraphNode[] | null;
}

type DragSession =
  | { kind: "pan"; pointerId: number; startX: number; startY: number; origX: number; origY: number }
  | { kind: "node"; pointerId: number; id: string; offsetX: number; offsetY: number }
  | { kind: "connect"; pointerId: number; nodeId: string; handleType: "flow" | "true" | "false" };

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
  compareNodes = null,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 80, y: 80 });
  const [connectMousePos, setConnectMousePos] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    handleType: "flow" | "true" | "false";
  } | null>(null);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const dragRef = useRef<DragSession | null>(null);
  const nodesRef = useRef(nodes);
  const spaceHeld = useRef(false);

  zoomRef.current = zoom;
  panRef.current = pan;
  nodesRef.current = nodes;


  const fitNodesInView = (animatePad = 56) => {
    const el = containerRef.current;
    if (!el) return;
    const list = nodesRef.current;
    if (list.length === 0) return;
    const viewW = el.clientWidth;
    const viewH = el.clientHeight;
    if (viewW < 40 || viewH < 40) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of list) {
      const w = n.width || 180;
      const h = n.height || 90;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + w);
      maxY = Math.max(maxY, n.y + h);
    }
    const contentW = Math.max(maxX - minX, 1);
    const contentH = Math.max(maxY - minY, 1);
    const zoomX = (viewW - animatePad * 2) / contentW;
    const zoomY = (viewH - animatePad * 2) / contentH;
    // Fit everything; never zoom in past 100% on auto-fit
    const nextZoom = Math.max(0.25, Math.min(1, zoomX, zoomY));
    const nextPan = {
      x: (viewW - contentW * nextZoom) / 2 - minX * nextZoom,
      y: (viewH - contentH * nextZoom) / 2 - minY * nextZoom,
    };
    zoomRef.current = nextZoom;
    panRef.current = nextPan;
    setZoom(nextZoom);
    setPan(nextPan);
  };

  // Fit once the canvas has a real size (fresh load / layout settle)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let fitted = false;
    const tryFit = () => {
      if (fitted) return;
      if (el.clientWidth < 40 || el.clientHeight < 40) return;
      fitted = true;
      fitNodesInView();
    };
    tryFit();
    const ro = new ResizeObserver(() => tryFit());
    ro.observe(el);
    const t = window.setTimeout(tryFit, 50);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
    // intentionally only on mount — Reset button also calls fitNodesInView
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const onSelectNodeRef = useRef(onSelectNode);
  const onUpdateRef = useRef(onUpdateNodeCoordinates);
  const onAddEdgeRef = useRef(onAddEdge);
  onSelectNodeRef.current = onSelectNode;
  onUpdateRef.current = onUpdateNodeCoordinates;
  onAddEdgeRef.current = onAddEdge;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeld.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeld.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const applyZoom = (event: WheelEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const target = event.target as Node | null;
      const overCanvas = !!target && (target === el || el.contains(target));
      if (!overCanvas) return;

      event.preventDefault();
      event.stopPropagation();

      const rect = el.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const intensity = event.ctrlKey || event.metaKey ? 0.01 : 0.0024;
      const factor = Math.exp(-delta * intensity);
      const nextZoom = Math.max(0.25, Math.min(3, currentZoom * factor));
      const dX = mouseX - currentPan.x;
      const dY = mouseY - currentPan.y;
      const nextPan = {
        x: mouseX - dX * (nextZoom / currentZoom),
        y: mouseY - dY * (nextZoom / currentZoom),
      };
      zoomRef.current = nextZoom;
      panRef.current = nextPan;
      setZoom(nextZoom);
      setPan(nextPan);
    };

    window.addEventListener("wheel", applyZoom, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", applyZoom, true);
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current || !onAddNodeAt) return;
    const type = e.dataTransfer.getData("application/aetherflow-node") as NodeType;
    if (!type) return;
    const rect = containerRef.current.getBoundingClientRect();
    const p = screenToCanvas(e.clientX, e.clientY, zoomRef.current, panRef.current.x, panRef.current.y, rect);
    onAddNodeAt(type, p.x, p.y);
  };

  const getNodeDiffStatus = (node: GraphNode) => diffNode(node, compareNodes);
  const deletedNodes = findDeletedNodes(nodes, compareNodes);

  const visibleIds = useMemo(() => {
    const width = containerRef.current?.clientWidth ?? 0;
    const height = containerRef.current?.clientHeight ?? 0;
    if (!width || !height) return new Set(nodes.map((n) => n.id));
    const viewport = canvasViewport(pan.x, pan.y, zoom, width, height);
    return new Set(queryVisibleIds(nodes, viewport));
  }, [nodes, pan.x, pan.y, zoom]);

  const getNodePortCoords = (node: GraphNode, isInput: boolean, handleType?: "flow" | "true" | "false") => {
    const width = node.width || 180;
    const height = node.height || 90;
    if (isInput) return { x: node.x, y: node.y + height / 2 };
    if (handleType === "true") return { x: node.x + width, y: node.y + height / 3 };
    if (handleType === "false") return { x: node.x + width, y: node.y + (height * 2) / 3 };
    return { x: node.x + width, y: node.y + height / 2 };
  };

  const drawBezierSpline = (x1: number, y1: number, x2: number, y2: number) => {
    const controlOffset = Math.max(Math.abs(x2 - x1) * 0.5, 40);
    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
  };

  const hitNode = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const p = screenToCanvas(clientX, clientY, zoomRef.current, panRef.current.x, panRef.current.y, rect);
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n = nodesRef.current[i];
      const w = n.width || 180;
      const h = n.height || 90;
      if (p.x >= n.x && p.x <= n.x + w && p.y >= n.y && p.y <= n.y + h) return n;
    }
    return null;
  };

  const endDrag = (event: PointerEvent | ReactPointerEvent) => {
    const session = dragRef.current;
    if (!session) return;
    if (session.kind === "connect") {
      const target = hitNode(event.clientX, event.clientY);
      if (target && target.id !== session.nodeId) {
        onAddEdgeRef.current(session.nodeId, target.id, session.handleType);
      }
    }
    try {
      containerRef.current?.releasePointerCapture(session.pointerId);
    } catch {
      /* already released */
    }
    dragRef.current = null;
    setDraggingNodeId(null);
    setConnectingFrom(null);
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const session = dragRef.current;
      if (!session) return;
      event.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      if (session.kind === "pan") {
        const next = {
          x: session.origX + (event.clientX - session.startX),
          y: session.origY + (event.clientY - session.startY),
        };
        panRef.current = next;
        setPan(next);
        return;
      }

      const p = screenToCanvas(event.clientX, event.clientY, zoomRef.current, panRef.current.x, panRef.current.y, rect);
      if (session.kind === "node") {
        onUpdateRef.current(session.id, p.x - session.offsetX, p.y - session.offsetY);
      } else if (session.kind === "connect") {
        setConnectMousePos(p);
      }
    };

    const onUp = (event: PointerEvent) => endDrag(event);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const capture = (event: ReactPointerEvent) => {
    try {
      (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    } catch {
      /* untrusted or already captured */
    }
    try {
      containerRef.current?.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const beginPan = (event: ReactPointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    capture(event);
    dragRef.current = {
      kind: "pan",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origX: panRef.current.x,
      origY: panRef.current.y,
    };
    onSelectNodeRef.current(null);
  };

  const handleCanvasPointerDown = (event: ReactPointerEvent) => {
    // Middle / right / space-drag always pans
    if (event.button === 2 || event.button === 1 || spaceHeld.current) {
      beginPan(event);
      return;
    }
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    const onBg =
      target === containerRef.current ||
      target.classList.contains("canvas-grid") ||
      target.dataset.canvasBg === "true" ||
      !!target.closest?.("[data-canvas-bg='true']");
    // Left-drag empty canvas (or dedicated pan surface) to pan the view
    if (onBg) beginPan(event);
  };

  const handleNodePointerDown = (event: ReactPointerEvent, node: GraphNode) => {
    event.stopPropagation();
    event.preventDefault();
    if (event.button !== 0) return;
    if (spaceHeld.current) {
      handleCanvasPointerDown(event);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = screenToCanvas(event.clientX, event.clientY, zoomRef.current, panRef.current.x, panRef.current.y, rect);
    capture(event);
    onSelectNodeRef.current(node.id);
    setDraggingNodeId(node.id);
    dragRef.current = {
      kind: "node",
      pointerId: event.pointerId,
      id: node.id,
      offsetX: p.x - node.x,
      offsetY: p.y - node.y,
    };
  };

  const handlePortConnectionStart = (
    event: ReactPointerEvent,
    nodeId: string,
    handleType: "flow" | "true" | "false",
  ) => {
    event.stopPropagation();
    event.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = screenToCanvas(event.clientX, event.clientY, zoomRef.current, panRef.current.x, panRef.current.y, rect);
    capture(event);
    setConnectingFrom({ nodeId, handleType });
    setConnectMousePos(p);
    dragRef.current = { kind: "connect", pointerId: event.pointerId, nodeId, handleType };
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case "start":
        return <Play className="size-4 text-emerald-500 fill-emerald-500/20" />;
      case "end":
        return <Activity className="size-4 text-rose-500" />;
      case "delay":
        return <Cpu className="size-4 text-amber-500" />;
      case "logic":
        return <GitBranch className="size-4 text-sky-500" />;
      case "gmail":
        return <Mail className="size-4 text-red-500" />;
      case "drive":
        return <Folder className="size-4 text-blue-500" />;
      case "docs":
        return <FileText className="size-4 text-indigo-500" />;
      case "gemini":
        return <Sparkles className="size-4 text-violet-500" />;
    }
  };

  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case "start":
        return "border-emerald-500/35";
      case "end":
        return "border-rose-500/35";
      case "delay":
        return "border-amber-500/35";
      case "logic":
        return "border-sky-500/35";
      case "gmail":
        return "border-red-500/35";
      case "drive":
        return "border-blue-500/35";
      case "docs":
        return "border-indigo-500/35";
      case "gemini":
        return "border-violet-500/35";
    }
  };

  const hintFor = (node: GraphNode) => {
    if (node.type === "delay") return `${node.properties.seconds}s pause`;
    if (node.type === "logic") return `${node.properties.code || "true"}`;
    if (node.type === "gmail") return `Gmail: ${node.properties.gmailAction}`;
    if (node.type === "drive") return `Drive: ${node.properties.driveAction}`;
    if (node.type === "docs") return `Docs: ${node.properties.docsAction}`;
    if (node.type === "gemini") return `AI: ${node.properties.geminiModel?.replace("-preview", "")}`;
    if (node.type === "start") return "Entry point";
    return "Simulator termination";
  };

  return (
    <div
      id="graph-canvas-container"
      data-testid="graph-canvas"
      ref={containerRef}
      onPointerDown={handleCanvasPointerDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={(e) => e.preventDefault()}
      className="relative h-full min-h-0 flex-1 cursor-grab overflow-hidden rounded-2xl border border-line bg-deep select-none active:cursor-grabbing"
      style={{ touchAction: "none" }}
    >
      <div
        data-canvas-bg="true"
        className="canvas-grid pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(circle, var(--grid-dot) 1px, transparent 1px),
            linear-gradient(to right, var(--line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--line) 1px, transparent 1px)
          `,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

            {/* Full-bleed pan hit target under nodes/edges */}
      <div
        data-canvas-bg="true"
        data-pan-surface="true"
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
      />

      <svg id="connections-canvas" className="pointer-events-none absolute inset-0 h-full w-full">
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            const startCoords = getNodePortCoords(sourceNode, false, edge.sourceHandle);
            const endCoords = getNodePortCoords(targetNode, true);
            const path = drawBezierSpline(startCoords.x, startCoords.y, endCoords.x, endCoords.y);
            const isSimulating = simulatingEdgeId === edge.id;
            return (
              <g key={edge.id} className="group pointer-events-auto">
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Delete connection pathway?")) onDeleteEdge(edge.id);
                  }}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={isSimulating ? "var(--accent)" : "color-mix(in oklab, var(--fg) 28%, transparent)"}
                  strokeWidth={2}
                />
                {isSimulating && (
                  <path
                    d={path}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    strokeDasharray="6, 12"
                    className="animate-[dash_1s_linear_infinite]"
                  />
                )}
              </g>
            );
          })}
          {connectingFrom &&
            (() => {
              const srcNode = nodes.find((n) => n.id === connectingFrom.nodeId);
              if (!srcNode) return null;
              const startCoords = getNodePortCoords(srcNode, false, connectingFrom.handleType);
              return (
                <path
                  d={drawBezierSpline(startCoords.x, startCoords.y, connectMousePos.x, connectMousePos.y)}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  strokeDasharray="4, 4"
                />
              );
            })()}
        </g>
      </svg>

      <div
        id="nodes-layer"
        className="pointer-events-none absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        {nodes
          .filter((node) => visibleIds.has(node.id))
          .map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isActive = activeNodeId === node.id;
            const width = node.width || 180;
            const height = node.height || 90;
            const diffStatus = getNodeDiffStatus(node);
            const isDragging = draggingNodeId === node.id;

            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: node.x,
                  top: node.y,
                  width,
                  height,
                  zIndex: isDragging || isSelected ? 20 : 1,
                }}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onDragStart={(e) => e.preventDefault()}
                draggable={false}
                className={`pointer-events-auto flex cursor-grab flex-col justify-between rounded-xl border bg-surface p-3.5 text-fg shadow-[var(--shadow)] active:cursor-grabbing ${getNodeColor(node.type)} ${
                  isSelected ? "ring-2 ring-fg/35" : ""
                } ${isActive ? "ring-2 ring-accent" : ""} ${
                  diffStatus === "added" ? "ring-2 ring-emerald-500/50" : ""
                } ${diffStatus === "modified" ? "ring-2 ring-amber-500/50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="shrink-0 rounded-lg border border-line bg-well p-1">{getNodeIcon(node.type)}</div>
                    <div className="truncate">
                      <span className="block text-[9px] font-semibold uppercase leading-none tracking-wider text-subtle">
                        {node.type}
                      </span>
                      <span className="text-xs font-semibold leading-snug">{node.label}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete node "${node.label}"?`)) onDeleteNode(node.id);
                    }}
                    className="rounded-md p-1 text-subtle hover:bg-well hover:text-rose-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <div className="mt-1 flex items-center justify-between border-t border-line pt-1.5 text-[10px] text-muted">
                  <span className="max-w-[130px] truncate italic">{hintFor(node)}</span>
                  {isActive && (
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
                    </span>
                  )}
                </div>

                {node.type !== "start" && (
                  <div
                    className="absolute top-1/2 left-0 size-3 -translate-x-1.5 -translate-y-1/2 rounded-full border-2 border-surface bg-accent"
                    title="Execution Flow Input"
                  />
                )}

                {node.type !== "end" &&
                  (node.type === "logic" ? (
                    <>
                      <div
                        onPointerDown={(e) => handlePortConnectionStart(e, node.id, "true")}
                        className="absolute top-1/3 right-0 size-3 translate-x-1.5 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-surface bg-emerald-500"
                        title="Branch Output: TRUE"
                      >
                        <span className="absolute -top-4 text-[8px] font-bold text-emerald-600">T</span>
                      </div>
                      <div
                        onPointerDown={(e) => handlePortConnectionStart(e, node.id, "false")}
                        className="absolute top-2/3 right-0 size-3 translate-x-1.5 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-surface bg-rose-500"
                        title="Branch Output: FALSE"
                      >
                        <span className="absolute -bottom-4 text-[8px] font-bold text-rose-600">F</span>
                      </div>
                    </>
                  ) : (
                    <div
                      onPointerDown={(e) => handlePortConnectionStart(e, node.id, "flow")}
                      className="absolute top-1/2 right-0 size-3 translate-x-1.5 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-surface bg-accent"
                      title="Flow Next Output"
                    />
                  ))}
              </div>
            );
          })}

        {deletedNodes.map((dNode) => {
          const width = dNode.width || 180;
          const height = dNode.height || 90;
          return (
            <div
              key={`deleted-${dNode.id}`}
              style={{ position: "absolute", left: dNode.x, top: dNode.y, width, height }}
              className="pointer-events-none flex flex-col justify-between rounded-xl border border-dashed border-rose-500/50 bg-rose-500/5 p-3.5 opacity-50"
            >
              <span className="text-xs font-semibold text-rose-500 line-through">{dNode.label}</span>
              <span className="text-[9px] font-semibold uppercase text-rose-500">Deleted</span>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-3 overflow-hidden rounded-xl border border-line bg-surface px-3 py-2 text-xs text-muted shadow-[var(--shadow)]">
        <div className="flex min-w-0 items-center gap-1.5">
          <Info className="size-4 shrink-0" />
          <span className="truncate">
            Zoom: <strong className="tabular-nums text-fg">{Math.round(zoom * 100)}%</strong>
          </span>
        </div>
        <div className="h-3 w-px shrink-0 bg-line-strong" />
        <button
          type="button"
          onClick={() => fitNodesInView()}
          className="shrink-0 text-[10px] font-semibold uppercase tracking-wider hover:text-fg"
        >
          Reset
        </button>
      </div>

      <div className="absolute top-3 right-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 truncate rounded-full border border-line bg-surface px-3 py-1 text-[10px] font-medium text-muted">
        <Activity className="size-3.5 text-emerald-500" />
        <span>SVG canvas · {nodes.length} nodes</span>
      </div>

      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -18; }
        }
      `}</style>
    </div>
  );
}
