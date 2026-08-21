import { describe, expect, it } from 'vitest';
import { GraphEdge, GraphNode } from '../types';
import { compileGraph, nextEdge } from './graphCompile';

function node(partial: Partial<GraphNode> & Pick<GraphNode, 'id' | 'type'>): GraphNode {
  return {
    label: partial.label ?? partial.id,
    x: 0,
    y: 0,
    width: 180,
    height: 90,
    properties: {},
    ...partial,
  };
}

describe('compileGraph', () => {
  it('accepts a start → end pipeline', () => {
    const nodes = [node({ id: 's', type: 'start' }), node({ id: 'e', type: 'end' })];
    const edges: GraphEdge[] = [{ id: 'a', source: 's', target: 'e' }];
    const result = compileGraph(nodes, edges);
    expect(result.ok).toBe(true);
    expect(result.startId).toBe('s');
    expect(result.nodeCount).toBe(2);
  });

  it('rejects a graph with no start node', () => {
    const result = compileGraph([node({ id: 'e', type: 'end' })], []);
    expect(result.ok).toBe(false);
    expect(result.hasEntry).toBe(false);
    expect(result.errors[0]).toMatch(/Start/);
  });

  it('rejects self-edges and dangling edges', () => {
    const nodes = [node({ id: 's', type: 'start' }), node({ id: 'e', type: 'end' })];
    const edges: GraphEdge[] = [
      { id: 'loop', source: 's', target: 's' },
      { id: 'ghost', source: 's', target: 'missing' },
    ];
    const result = compileGraph(nodes, edges);
    expect(result.ok).toBe(false);
    expect(result.selfEdges).toBe(1);
    expect(result.danglingEdges).toBe(1);
  });
});

describe('nextEdge', () => {
  const edges: GraphEdge[] = [
    { id: 't', source: 'logic', target: 'yes', sourceHandle: 'true' },
    { id: 'f', source: 'logic', target: 'no', sourceHandle: 'false' },
    { id: 'flow', source: 'start', target: 'logic' },
  ];

  it('follows an unlabeled flow handle', () => {
    expect(nextEdge(edges, 'start', 'flow')?.id).toBe('flow');
  });

  it('follows true/false ports on a decision node', () => {
    expect(nextEdge(edges, 'logic', 'true')?.target).toBe('yes');
    expect(nextEdge(edges, 'logic', 'false')?.target).toBe('no');
  });
});
