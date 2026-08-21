import { describe, expect, it } from 'vitest';
import { GraphNode } from '../types';
import { deletedNodes, diffNode } from './nodeDiff';

const base: GraphNode = {
  id: 'n1',
  type: 'start',
  label: 'Entry',
  x: 0,
  y: 0,
  width: 180,
  height: 90,
  properties: {},
};

describe('diffNode', () => {
  it('marks a missing baseline id as added', () => {
    expect(diffNode(base, [])).toBe('added');
  });

  it('marks moved or relabeled nodes as modified', () => {
    expect(diffNode({ ...base, x: 40 }, [base])).toBe('modified');
    expect(diffNode({ ...base, label: 'Other' }, [base])).toBe('modified');
  });

  it('returns none when the node is unchanged', () => {
    expect(diffNode(base, [base])).toBe('none');
  });
});

describe('deletedNodes', () => {
  it('returns baseline nodes missing from current', () => {
    const gone = deletedNodes([], [base]);
    expect(gone.map((n) => n.id)).toEqual(['n1']);
  });
});
