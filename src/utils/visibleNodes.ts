import { Bounds, Quadtree } from './quadtree';

export interface CullableNode {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

const PAD = 240;

export function queryVisibleIds(nodes: CullableNode[], viewport: Bounds): string[] {
  if (nodes.length === 0) return [];
  if (viewport.width <= 0 || viewport.height <= 0) {
    return nodes.map((n) => n.id);
  }

  const tree = new Quadtree({
    x: viewport.x - PAD,
    y: viewport.y - PAD,
    width: viewport.width + PAD * 2,
    height: viewport.height + PAD * 2,
  });

  for (const n of nodes) {
    tree.insert({
      id: n.id,
      bounds: {
        x: n.x,
        y: n.y,
        width: n.width || 180,
        height: n.height || 90,
      },
    });
  }

  return tree.query(viewport);
}

export function canvasViewport(
  panX: number,
  panY: number,
  zoom: number,
  width: number,
  height: number
): Bounds {
  const safeZoom = zoom === 0 ? 1 : zoom;
  return {
    x: -panX / safeZoom,
    y: -panY / safeZoom,
    width: width / safeZoom,
    height: height / safeZoom,
  };
}
