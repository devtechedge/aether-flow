/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number;
  y: number;
}

export function screenToCanvas(
  clientX: number,
  clientY: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
  rect: DOMRect
): Point {
  return {
    x: (clientX - rect.left - offsetX) / zoom,
    y: (clientY - rect.top - offsetY) / zoom,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
  rect: DOMRect
): Point {
  return {
    x: canvasX * zoom + offsetX + rect.left,
    y: canvasY * zoom + offsetY + rect.top,
  };
}
