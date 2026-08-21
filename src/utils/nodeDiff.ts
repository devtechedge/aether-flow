import { GraphNode } from '../types';

export type NodeDiffStatus = 'added' | 'modified' | 'deleted' | 'none';

export function diffNode(
  node: GraphNode,
  baseline: GraphNode[] | null | undefined
): Exclude<NodeDiffStatus, 'deleted'> {
  if (!baseline) return 'none';
  const original = baseline.find((cn) => cn.id === node.id);
  if (!original) return 'added';

  const moved = Math.abs(original.x - node.x) > 2 || Math.abs(original.y - node.y) > 2;
  const labelChanged = original.label !== node.label;
  const propsChanged = JSON.stringify(original.properties) !== JSON.stringify(node.properties);

  return moved || labelChanged || propsChanged ? 'modified' : 'none';
}

export function deletedNodes(
  current: GraphNode[],
  baseline: GraphNode[] | null | undefined
): GraphNode[] {
  if (!baseline) return [];
  return baseline.filter((cn) => !current.some((n) => n.id === cn.id));
}
