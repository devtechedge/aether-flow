import { describe, expect, it } from 'vitest';
import { canvasToScreen, screenToCanvas } from './canvasMath';

describe('canvas projection', () => {
  const rect = { left: 10, top: 20 } as DOMRect;

  it('round-trips screen ↔ canvas coordinates', () => {
    const canvas = screenToCanvas(110, 220, 2, 30, 40, rect);
    expect(canvas).toEqual({ x: 35, y: 80 });
    const screen = canvasToScreen(canvas.x, canvas.y, 2, 30, 40, rect);
    expect(screen).toEqual({ x: 110, y: 220 });
  });
});
