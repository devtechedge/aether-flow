/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QuadtreeItem {
  id: string;
  bounds: Bounds;
}

export class Quadtree {
  private maxItems = 10;
  private maxLevels = 5;
  private level: number;
  private bounds: Bounds;
  private items: QuadtreeItem[];
  private nodes: Quadtree[];

  constructor(bounds: Bounds, level = 0) {
    this.bounds = bounds;
    this.level = level;
    this.items = [];
    this.nodes = [];
  }

  clear() {
    this.items = [];
    for (let i = 0; i < this.nodes.length; i++) {
      this.nodes[i].clear();
    }
    this.nodes = [];
  }

  private split() {
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    this.nodes[0] = new Quadtree({ x: x + subWidth, y: y, width: subWidth, height: subHeight }, this.level + 1);
    this.nodes[1] = new Quadtree({ x: x, y: y, width: subWidth, height: subHeight }, this.level + 1);
    this.nodes[2] = new Quadtree({ x: x, y: y + subHeight, width: subWidth, height: subHeight }, this.level + 1);
    this.nodes[3] = new Quadtree({ x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight }, this.level + 1);
  }

  private getIndex(itemBounds: Bounds): number {
    let index = -1;
    const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
    const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

    const topQuadrant = itemBounds.y < horizontalMidpoint && itemBounds.y + itemBounds.height < horizontalMidpoint;
    const bottomQuadrant = itemBounds.y > horizontalMidpoint;

    if (itemBounds.x < verticalMidpoint && itemBounds.x + itemBounds.width < verticalMidpoint) {
      if (topQuadrant) {
        index = 1;
      } else if (bottomQuadrant) {
        index = 2;
      }
    } else if (itemBounds.x > verticalMidpoint) {
      if (topQuadrant) {
        index = 0;
      } else if (bottomQuadrant) {
        index = 3;
      }
    }

    return index;
  }

  insert(item: QuadtreeItem) {
    if (this.nodes.length > 0) {
      const index = this.getIndex(item.bounds);
      if (index !== -1) {
        this.nodes[index].insert(item);
        return;
      }
    }

    this.items.push(item);

    if (this.items.length > this.maxItems && this.level < this.maxLevels) {
      if (this.nodes.length === 0) {
        this.split();
      }

      let i = 0;
      while (i < this.items.length) {
        const index = this.getIndex(this.items[i].bounds);
        if (index !== -1) {
          this.nodes[index].insert(this.items.splice(i, 1)[0]);
        } else {
          i++;
        }
      }
    }
  }

  query(rect: Bounds): string[] {
    const result: string[] = [];
    this.queryRecursive(rect, result);
    return result;
  }

  private queryRecursive(rect: Bounds, result: string[]) {
    // Add all items in current node that intersect
    for (const item of this.items) {
      if (this.intersects(item.bounds, rect)) {
        result.push(item.id);
      }
    }

    if (this.nodes.length > 0) {
      const index = this.getIndex(rect);
      if (index !== -1) {
        this.nodes[index].queryRecursive(rect, result);
      } else {
        // Query all subnodes if it spans multiple
        for (let i = 0; i < this.nodes.length; i++) {
          if (this.intersects(this.nodes[i].bounds, rect)) {
            this.nodes[i].queryRecursive(rect, result);
          }
        }
      }
    }
  }

  private intersects(a: Bounds, b: Bounds): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}
