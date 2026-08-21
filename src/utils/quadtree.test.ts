import { describe, expect, it } from 'vitest';
import { Quadtree } from './quadtree';
import { canvasViewport, queryVisibleIds } from './visibleNodes';

describe('Quadtree', () => {
  it('returns items that intersect the query rect', () => {
    const tree = new Quadtree({ x: 0, y: 0, width: 1000, height: 1000 });
    tree.insert({ id: 'a', bounds: { x: 10, y: 10, width: 40, height: 40 } });
    tree.insert({ id: 'b', bounds: { x: 800, y: 800, width: 40, height: 40 } });
    expect(tree.query({ x: 0, y: 0, width: 100, height: 100 })).toEqual(['a']);
    expect(tree.query({ x: 700, y: 700, width: 200, height: 200 })).toEqual(['b']);
  });
});

describe('queryVisibleIds', () => {
  const nodes = [
    { id: 'near', x: 0, y: 0, width: 180, height: 90 },
    { id: 'far', x: 4000, y: 4000, width: 180, height: 90 },
  ];

  it('culls nodes outside the padded viewport', () => {
    const visible = queryVisibleIds(nodes, { x: 0, y: 0, width: 400, height: 400 });
    expect(visible).toContain('near');
    expect(visible).not.toContain('far');
  });

  it('maps pan/zoom into canvas space', () => {
    const view = canvasViewport(100, 50, 2, 800, 600);
    expect(view).toEqual({ x: -50, y: -25, width: 400, height: 300 });
  });
});
