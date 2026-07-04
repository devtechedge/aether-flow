# ARCHITECTURAL BLUEPRINT & AGENT PROMPT
## Project: AetherFlow IDE — High-Performance, Local-First Reactive Flowchart Compiler & Execution Simulator

This masterclass blueprint is authored to showcase 20+ years of engineering craftsmanship, design leadership, and platform optimization. It is optimized to run completely in-browser, making it 100% deployable to **Vercel** with **zero paid database or server dependencies**, while delivering a performance profile that will captivate hiring managers, CTOs, and technical recruiters.

---

## 1. Project Concept & Wow Factor

### What is AetherFlow IDE?
AetherFlow is a state-of-the-art **Local-First Visual Node-Graph IDE, Reactive State Machine Compiler, and Off-Main-Thread Workflow Execution Simulator**. 
Instead of a basic drawing canvas, AetherFlow compiles interactive visual graphs into **fully executable TypeScript statecharts**, executes them inside an isolated sandboxed Web Worker, and offers real-time debugging, hardware-telemetry, and performance profiling.

### Why This Stand Out to Recruiters:
1. **Low-Level Math & Graphics**: A custom HTML5 Canvas/SVG hybrid pan-zoom engine written without heavy pre-made chart libraries, demonstrating 2D matrix math, quadtree spatial collision indexing, and cubic bezier custom connection routing.
2. **High-Performance Concurrency**: High-performance parsing, lexical analysis, and code compilation performed on an isolated **Web Worker** thread, ensuring the UI remains butter-smooth at a locked 120 FPS.
3. **Database & Git-Like Versioning**: A fully local Git-like revision engine built on **IndexedDB** that supports branching, commits, merging, visual diff-viewing, and collision resolution—all on-device.
4. **Time-Travel Forensic Debugger**: A full event-sourcing ledger using a structured **Command Pattern** with snapshots, allowing the user to scrub back and forth through execution history in a high-fidelity visual player.
5. **Architectural Purity**: Clean Architecture principles, full TypeScript typing with strict interface guarantees, zero telemetry bloat, and highly refined slate-themed visual aesthetics.

---

## 2. Technical Stack & No-Cost Vercel Architecture

AetherFlow runs entirely inside the user's browser, bypassing complex database setup fees while exhibiting advanced offline-first techniques.

* **Frontend Framework**: React 19 + TypeScript (strict mode, custom hooks, and functional components).
* **Styling**: Tailwind CSS (CSS variables, high-contrast slate aesthetics, strict layout constraints).
* **Animation & micro-interactions**: `motion` (formerly framer-motion) for fluid contextual layout shifting, modal triggers, and timeline scrub feedback.
* **Local Persistence**: **IndexedDB** (using Dexie.js or native wrappers) configured with custom indexes for super-fast visual state queries.
* **Multi-threading Engine**: **Web Workers** for:
  - Visual graph compilation to ES6.
  - Runtime VM simulation and state transition traversal.
  - AST Parsing & code optimization.
* **Data Visualizer**: Raw SVG and lightweight **D3.js** modules to render performance graphs, transition frame-rates, and execution logs.
* **Testing**: **Vitest** for algorithmic compilation checks, and **Playwright** for canvas pan/zoom end-to-end integration.

---

## 3. High-Level System Architecture

```
                                  +------------------------------------+
                                  |         AetherFlow UI Thread       |
                                  |  (React 19, Tailwind, Lucide, Motion)|
                                  +--------+------------------+---------+
                                           |                  ^
                 User Inputs / Node Modifies|                  | Visual Updates / Telemetry
                                           v                  |
  +----------------------------------------+                  +-----------------------------------+
  |                                                                                               |
  |  +------------------------+     +------------------------+     +------------------------+     |
  |  |   Canvas Pan/Zoom      |     |  Undo/Redo Command     |     |   Local Database       |     |
  |  |   Renderer Matrix 2D   |     |  Event-Sourcing Ledger |     |   IndexedDB (Dexie)    |     |
  |  +------------------------+     +------------------------+     +------------------------+     |
  |                                                                                               |
  +----------------------------------------+------------------+-----------------------------------+
                                           |                  ^
                                    JSON   |                  |  Worker Response
                                    Payload|                  |  (Logs, Output, AST, State Change)
                                           v                  |
                                  +--------+------------------+---------+
                                  |         Multi-Thread Bridge         |
                                  |          (Web Worker API)           |
                                  +------------------------------------+
                                           |                  ^
                                           |                  |
                                           v                  |
                                  +--------+------------------+---------+
                                  |      Compilation & Execution Worker|
                                  |                                     |
                                  |  +-------------------------------+  |
                                  |  |   AST Parser & Code Generator |  |
                                  |  +-------------------------------+  |
                                  |  |   Sandboxed Execution VM      |  |
                                  |  +-------------------------------+  |
                                  +-------------------------------------+
```

---

## 4. Key Core Features & Data Schemas

### A. Graph Data Schema (`/src/types.ts`)
```typescript
export interface GraphNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'submachine' | 'delay';
  label: string;
  position: { x: number; y: number };
  properties: {
    codeSnippet?: string; // Code executed during action
    delayMs?: number;     // For delay node
    conditionExpr?: string; // For condition node
  };
}

export interface GraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  triggerEvent: string; // Event key that fires this transition
  guardExpression?: string; // Inline logic checked before firing
}

export interface AetherFlowGraph {
  id: string;
  name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  updatedAt: number;
}

export interface Branch {
  name: string;      // e.g., 'main', 'feature-alpha'
  headCommitId: string;
}

export interface Commit {
  id: string;
  parentId: string | null;
  message: string;
  timestamp: number;
  graphSnapshot: AetherFlowGraph;
}
```

### B. High-Performance Canvas Engine Requirements
* **Transform Matrix**: The visual coordinate system must use a 2D transform matrix `[a, b, c, d, e, f]` supporting panning with middle-click / spacebar-drag and smooth trackpad zooming centered on the mouse position.
* **Spatial Partitioning**: Write a simple Quadtree in TypeScript. In scenarios where the user builds complex graphs with 500+ nodes, the Quadtree must be utilized to prune nodes outside the viewport, completely skipping unnecessary rendering and ensuring 120 FPS performance on standard screens.
* **Cubic Splines**: Draw node-connecting lines as custom SVG path strings using Cubic Bezier curves with slope adjustment depending on horizontal distance between connection ports.

### C. The Web Worker Sandboxed VM
* **Compilation**: The compiler Worker takes the graph structure, builds an adjacency matrix, checks for cycles or disconnected states, compiles it into clean executable JS ESM modules, and validates syntax.
* **Execution**: Run code scripts attached to Nodes inside the worker using scoped `new Function()` execution context bound with simulated browser objects (a mock `console.log`, variable storage stack, and state transitions metrics).
* **Continuous Streaming**: The VM must stream execution telemetry (active nodes, transition speeds, active variable values) back to the main UI thread at 30ms intervals.

### D. Multi-Branch Versioning (Git-on-IndexedDB)
* Create an abstract database layer using IndexedDB.
* Users can click "Commit", type a message, create a new branch, and visualize differences between branches using a beautiful "Split Diff Layout" that highlights added, modified, or deleted nodes.

---

## 5. Directory Layout Blueprint
An industry-standard layout showcasing meticulous design, modular separation of concerns, and clean enterprise packaging:

```
/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── index.css
│   ├── types.ts
│   ├── App.tsx
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── GraphCanvas.tsx          # Custom Pan/Zoom Matrix canvas renderer
│   │   │   ├── CanvasGrid.tsx           # Premium dotted background grid
│   │   │   ├── NodeCard.tsx             # Beautifully-styled, interactable SVG/HTML nodes
│   │   │   └── ConnectionLine.tsx       # Smooth Cubic Bezier line drawing
│   │   ├── Sidebar/
│   │   │   ├── NodeLibrary.tsx          # Preset draggable triggers, delays, and actions
│   │   │   ├── NodeInspector.tsx        # High-fidelity code and property editors
│   │   │   └── VersionControl.tsx       # Branch creation, commit logs, and graph diffs
│   │   ├── Timeline/
│   │   │   └── TimeTravelScrubber.tsx   # Interactive player: pause, play, step-by-step scrub
│   │   └── Dashboard/
│   │       ├── PerformanceTelemetry.tsx # Canvas repaint time and Worker CPU monitoring graphs
│   │       └── SandboxConsole.tsx       # Interactive simulation log terminal
│   ├── hooks/
│   │   ├── useGraphState.ts             # Direct custom state hook with undo/redo Command Stack
│   │   └── useIndexedDB.ts              # Local database bindings
│   ├── workers/
│   │   ├── compiler.worker.ts           # Web Worker doing off-thread graph compilation
│   │   └── simulator.worker.ts          # Sandbox VM simulating flowchart executions
│   └── utils/
│       ├── quadtree.ts                  # Raw TypeScript spatial indexing engine
│       └── canvasMath.ts                # Coordinate space projection math helpers
```

---

## 6. The Master Agentic Coding Prompt
Copy, paste, or pipe the prompt below directly into an advanced AI coding agent or build assistant to generate this entire senior-level system with zero compromised features.

```text
================================================================================
AETHERFLOW SYSTEM ARCHITECTURE: MASTER AGENTIC COMPILER PROMPT
================================================================================
You are a Staff Software Engineer and Chief Frontend Architect with 20+ years of 
experience. Your goal is to build AetherFlow IDE—a high-performance, local-first
visual flowchart IDE and execution simulator with 100% functional completeness. 

You MUST build this entirely client-side, with zero paid database dependencies, 
making it instantly deployable to Vercel and fully functional. It is designed to
be an elite engineering portfolio piece, with absolutely no mock features.

Adhere to these key requirements:
1. STRICT TYPE SAFETY: Every data structure, coordinate system, worker message, and
   state event must have fully validated, strict TypeScript interfaces.
2. NO EXTERNAL CANVAS LIBRARIES: Build the node-graph renderer from scratch. Implement
   your own panning/zooming coordinate space matrix projection, quadtree pruning for
   viewport-only rendering, and SVG Cubic Bezier path routing.
3. OFF-MAIN-THREAD WORKERS: Implement real Web Workers (compiler.worker.ts and 
   simulator.worker.ts) using standard browser APIs to do high-performance lexical 
   analysis, ESM compilation, and VM execution simulation.
4. VERSION CONTROL ON INDEXEDDB: Create a local Git engine. Users must be able to branch,
   commit statechart structures, see visual diffs side-by-side, and merge conflicts.
5. FORENSIC DEBUGGER: Implement full Event Sourcing state management with Command pattern
   undo/redo, letting users record executions and scrub back and forth in real-time.

--------------------------------------------------------------------------------
PHASE 1: ENVIRONMENT & UTILITIES SETUP
--------------------------------------------------------------------------------
- Set up /src/types.ts containing strict schemas for GraphNode, GraphEdge, Commit, 
  Branch, SimulationState, and FrameTelemetry.
- Implement /src/utils/quadtree.ts: A complete, self-contained Quadtree class in TypeScript 
  that inserts bounds of elements and queries overlapping rects to handle viewport-based 
  node pruning at peak performance.
- Implement /src/utils/canvasMath.ts: Matrix translation and scale helpers to convert 
  screen coordinate space (MouseEvent clientX/Y) to Canvas coordinate space and vice-versa,
  accounting for translation offsets and scale thresholds.

--------------------------------------------------------------------------------
PHASE 2: THE MULTI-THREAD COMPILER & VM EXECUTION SIMULATOR
--------------------------------------------------------------------------------
- Implement compiler.worker.ts:
  - Takes visual GraphNode & GraphEdge arrays.
  - Builds an Adjacency Matrix representation.
  - Detects unreachable nodes, isolated connections, or syntax issues.
  - Compiles the node graph into an executable state machine ESM script that chains 
    callbacks using async/await and variable scopes.
- Implement simulator.worker.ts:
  - Sandboxes execution of compiled Javascript in a dedicated thread context.
  - Intercepts state changes, evaluates node transition delays, and tracks local memory variables.
  - Collects execution CPU time, memory stack state, and active transition steps.
  - Streams telemetry packet payloads back to the main thread via self.postMessage.

--------------------------------------------------------------------------------
PHASE 3: HIGH-PERFORMANCE CUSTOM RENDERING CANVAS
--------------------------------------------------------------------------------
- Implement /src/components/Canvas/GraphCanvas.tsx:
  - Intercept MouseDown/Move/Up to handle drag-to-pan, scroll-to-zoom (with smooth 
    exponential scale decay), and multi-select.
  - Utilize useMemo and the Quadtree script to query which nodes are within the viewport bounds.
  - Draw nodes with custom slate colors, active state glow indicators (when simulated execution
    passes through them), and configurable input/output connector ports.
  - Draw paths using custom-styled SVG curves. Add dynamic animations to connections (a glowing
    pulse running along the bezier curve when a transition event is fired).

--------------------------------------------------------------------------------
PHASE 4: LOCAL-FIRST VERSION CONTROL & COMMAND TIMELINE
--------------------------------------------------------------------------------
- Implement useIndexedDB.ts: Create robust DB tables to store workspaces, branches, 
  commits, and active project settings locally.
- Implement Sidebar/VersionControl.tsx:
  - Create visual git logs showing commit hashes, author/timestamp, and commit messages.
  - Build a side-by-side Graph Diff Viewer showing a color-coded viewport (Green for new nodes,
    Red for deleted nodes, Yellow for repositioned nodes) when contrasting branches.
- Implement Timeline/TimeTravelScrubber.tsx:
  - Create a physical VCR-style execution player with progress slider, Play, Pause, Single-Step, 
    and speed multiplier (0.5x, 1x, 2x, 5x).
  - Bind to a custom Command Pattern history hook (useGraphState.ts) that allows visual rollback 
    of statechart properties.

--------------------------------------------------------------------------------
PHASE 5: SYSTEM INTEGRATION & POLISHED USER INTERFACE
--------------------------------------------------------------------------------
- Build a dual-pane responsive layout:
  - Center: Interactive Graph Canvas with customizable Grid Overlay.
  - Left Panel: Presets toolbar to drag-and-drop Nodes, plus Git History/Branch view.
  - Right Panel: Inspector containing editable code snippet properties, logic evaluations,
    and a live telemetry profiling graph (showing frame rates, Web Worker compute delays, and
    memory state stack variables).
  - Bottom Panel: Sandboxed execution log terminal and time scrubbing controls.
- Style using Tailwind: deep dark graphite backgrounds, high-contrast text elements, 
  precise subtle borders, and smooth Framer-Motion transition layers.
================================================================================
```

---

## 7. Professional Git Repository & Production Build Guidelines

To elevate this project from a standard app into a pristine, production-grade repository that commands senior developer salaries:

1. **Strict ESLint and Prettier Setup**: Configure absolute rule guarantees. Disallow any implicit `any` bindings, unused imports, or loose formatting.
2. **Husky & Lint-Staged**: Block git commits that violate formatting rules or fail the TypeScript compiler.
3. **Advanced Playwright Visual Regression**: Configure tests in `.github/workflows/ci.yml` that run automated visual screenshot-matching on the Canvas workspace to ensure panning/zooming logic is mathematically sound across code branches.
4. **Rich README.md (Self-Documenting Codebase)**: Build an exquisite README file documenting technical decisions, Web Worker communication schemas, optimization benchmarks, and an explanation of the custom Quadtree spatial index.

---
*Created by the Google AI Studio Chief Architect Agent for Senior-Level Portfolio Engineering.*
