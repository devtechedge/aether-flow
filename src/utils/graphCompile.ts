import { GraphEdge, GraphNode } from '../types';

export interface CompileDiagnostics {
  ok: boolean;
  hasEntry: boolean;
  hasExit: boolean;
  startId: string | null;
  endId: string | null;
  nodeCount: number;
  edgeCount: number;
  selfEdges: number;
  danglingEdges: number;
  errors: string[];
}

export function compileGraph(nodes: GraphNode[], edges: GraphEdge[]): CompileDiagnostics {
  const ids = new Set(nodes.map((n) => n.id));
  const starts = nodes.filter((n) => n.type === 'start');
  const ends = nodes.filter((n) => n.type === 'end');
  const selfEdges = edges.filter((e) => e.source === e.target).length;
  const danglingEdges = edges.filter((e) => !ids.has(e.source) || !ids.has(e.target)).length;

  const errors: string[] = [];
  if (starts.length === 0) errors.push('Graph is missing a Start node.');
  if (starts.length > 1) errors.push('Graph has more than one Start node.');
  if (ends.length === 0) errors.push('Graph is missing an End node.');
  if (selfEdges > 0) errors.push('Graph contains self-referencing edges.');
  if (danglingEdges > 0) errors.push('Graph contains edges that point at missing nodes.');

  return {
    ok: errors.length === 0,
    hasEntry: starts.length === 1,
    hasExit: ends.length >= 1,
    startId: starts[0]?.id ?? null,
    endId: ends[0]?.id ?? null,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    selfEdges,
    danglingEdges,
    errors,
  };
}

export function nextEdge(
  edges: GraphEdge[],
  sourceId: string,
  portHandle: 'flow' | 'true' | 'false'
): GraphEdge | undefined {
  return edges.find((e) =>
    e.source === sourceId &&
    (portHandle === 'flow'
      ? !e.sourceHandle || e.sourceHandle === 'flow'
      : e.sourceHandle === portHandle)
  );
}
