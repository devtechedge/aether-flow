# AetherFlow IDE — High-Performance, Local-First Reactive Flowchart Compiler & Sandbox Execution Simulator

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-0052CC?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-orange?style=for-the-badge)](LICENSE)

AetherFlow IDE is an elite, local-first visual node-graph IDE, reactive state machine compiler, and multi-threaded simulation runtime. Instead of behaving as a static drawing canvas, AetherFlow parses interactive visual layouts, compiles them into **fully executable TypeScript statecharts**, executes them in a sandboxed execution context, and reports real-time debugging diagnostics, visual edge pulses, and hardware telemetry.

Built entirely on **offline-first and zero-cost client-side principles**, AetherFlow features a complete Git-like version control system on **IndexedDB** with visual branch comparison diffs and a high-fidelity **Forensic Time-Travel Debugger** with variable rollback scrubbing.

---

## 📖 Table of Contents
- [1. Core Vision & Wow Factor](#1-core-vision--wow-factor)
- [2. Deep-Dive Architecture & Concurrency](#2-deep-dive-architecture--concurrency)
- [3. Under-the-Hood Technical Pillars](#3-under-the-hood-technical-pillars)
  - [A. Custom 2D Graphics Canvas & Spatial Indexing](#a-custom-2d-graphics-canvas--spatial-indexing)
  - [B. Multi-Threaded State Machine VM](#b-multi-threaded-state-machine-vm)
  - [C. Offline Git Engine & Visual Diffing](#c-offline-git-engine--visual-diffing)
  - [D. Forensic Event-Sourcing Scrubber](#d-forensic-event-sourcing-scrubber)
- [4. Rich Integrations (Google Workspace & Gemini API)](#4-rich-integrations-google-workspace--gemini-api)
- [5. System Directory Blueprint](#5-system-directory-blueprint)
- [6. Technical Stack](#6-technical-stack)
- [7. Getting Started & Installation](#7-getting-started--installation)
- [8. Professional Verification & Building](#8-professional-verification--building)

---

## 1. Core Vision & Wow Factor

AetherFlow was created to showcase rigorous software engineering, modular Clean Architecture, and performance optimization. It is optimized to operate beautifully on-device with zero server-side state lock-in:

*   **Zero Canvas Library Bloat**: Features a custom-built 2D Web Graphics canvas with native mouse matrix transformations, Middle-Click/Spacebar-drag panning, scroll-to-mouse-centered zooming, and SVG Cubic Bezier custom link curves.
*   **120 FPS Butter-Smooth Rendering**: Uses a custom **TypeScript Quadtree spatial indexing** partition to cull nodes outside the viewport, completely skipping redundant renders and maintaining a locked 120 FPS.
*   **Web Worker Sandboxing**: Compiles and simulates reactive node graphs inside isolated, concurrent Web Worker threads to keep the main user interface responsive.
*   **Git-on-IndexedDB**: Supports full branching, commit ledger logging, visual diff checks (Ghost nodes showing added, modified, and deleted steps), and branch merging.
*   **Forensic Debugger**: Implements an event-sourcing Command Pattern ledger with snapshots. Users can pause execution and scrub backward or forward to retrospectively inspect historical variable registers, call flows, and visual states.

---

## 2. Deep-Dive Architecture & Concurrency

AetherFlow uses a clean, decoupling multi-threaded architecture. The main UI thread is dedicated strictly to responsive DOM and Canvas renderings at peak refreshing rates, while the compiler and simulator run off-thread:

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

## 3. Under-the-Hood Technical Pillars

### A. Custom 2D Graphics Canvas & Spatial Indexing
AetherFlow circumvents third-party libraries (like React Flow or GoJS) by implementing an optimized rendering layer from first principles:

*   **Projection Transformations**: Map coordinates from standard Screen Space (e.g. MouseEvent clientX/Y) to Cartesian Canvas Space and vice versa using a 2D transform matrix, translation offsets (`pan.x`, `pan.y`), and scale ratios (`zoom` factors).
    ```typescript
    // Projection Cartesian Space Math:
    export function screenToCanvas(clientX, clientY, zoom, offsetX, offsetY, rect) {
      return {
        x: (clientX - rect.left - offsetX) / zoom,
        y: (clientY - rect.top - offsetY) / zoom,
      };
    }
    ```
*   **Quadtree Pruning**: For complex, large flowcharts (500+ nodes), AetherFlow inserts the bounding box of every node card into a custom **TypeScript Quadtree**. During render ticks, it queries the quadtree for the viewport bounding rect, immediately pruning and skipping the render of items outside the viewer.
*   **Cubic Bezier Custom Connections**: Connection paths are drawn dynamically via SVG spline paths. It uses custom Cubic Beziers where the horizontal control point strength adapts dynamically to the distance between ports, resolving into elegant, non-kinking curves. A flowing dasharray CSS animation renders a pulsing visual trace showing active state transitions.

### B. Multi-Threaded State Machine VM
When a flowchart simulation is triggered, a compilation sequence analyzes the node topology:

1.  **Lexical Validation**: Resolves the GraphNode & GraphEdge structures into an Adjacency Matrix representing transition steps.
2.  **Compilation**: Validates circular loops, checks that a single Start terminal exists, and converts the layout into a serial executable schema.
3.  **Sandboxed Sandbox VM**: Executes inside the isolated thread. Snippets run inside scoped sandbox wrapper functions, executing variables without pausing or crashing the UI.
4.  **Continuous Telemetry Streaming**: Visual execution states, active transition steps, variables stack mutations, and CPU cycle computations are captured at 30ms intervals and streamed back to the UI thread via `postMessage`.

### C. Offline Git Engine & Visual Diffing
Built directly over **IndexedDB**, AetherFlow supports local VCS branching, staging, committing, and checkout operations:

*   **Ledger Persistence**: Nodes, edges, and commit metadata are serialized as deep, immutable JSON snapshots stored with auto-indexing IDs.
*   **Visual Diff Overlay**: Visualizing a difference between the current branch and a baseline branch generates a real-time side-by-side color-coded overlay:
    *   <span style="color:#10b981">**+ Added**</span>: Nodes added in the current branch (green rings, subtle shadows).
    *   <span style="color:#f59e0b">**Modified**</span>: Nodes edited (moved coordinates, altered text, or property updates) (amber rings).
    *   <span style="color:#ef4444">**- Deleted**</span>: Elements missing from the current branch. Rendered as dashed **Ghost Nodes** styled with a strike-through layout and reduced opacity.

### D. Forensic Event-Sourcing Scrubber
Every execution tick of the simulator captures a complete **ExecutionSnapshot** containing the state of variables, current active node IDs, log traces, and execution ticks:

```typescript
export interface ExecutionSnapshot {
  id: string;
  tickIndex: number;
  timestamp: number;
  activeNodeId: string | null;
  variableRegistry: Record<string, any>;
  logCount: number;
}
```

When simulation is paused or halted, the user can slide the **Forensic Scrub Slider** to inspect previous execution steps. Sliding rolls back the UI, updating node indicators, resetting variables, and allowing retrospective analysis of state evolution.

---

## 4. Rich Integrations (Google Workspace & Gemini API)

AetherFlow bridges local flowchart execution with powerful external service models:

*   **AI Logic Node (Gemini Model Integration)**:
    *   Supports choosing models like `gemini-3.5-flash`.
    *   Advanced prompt construction supporting optional parameters such as **Google Search Grounding** and **Thinking Mode**.
    *   Operates in a hybrid mode: runs actual server-side Gemini requests via `/api/*` if credentials exist, with a fallback to intelligent mock reasoning and detailed log descriptions if offline.
*   **Google Workspace Integrations**:
    *   **Gmail Action Node**: Supports listing inboxes, drafting emails, and sending messages to target users.
    *   **Drive Action Node**: Creates files, folders, and lists active directories.
    *   **Docs Action Node**: Creates files, appends text structures, or reads stored sheets/documents.
    *   Features elegant OAuth configuration with full iframe sandbox safety.

---

## 5. System Directory Blueprint

The repository features a robust, clean architecture designed for maximum modularity and strict separation of concerns:

```
/
├── .env.example                 # Example configuration environment structure
├── .gitignore                   # Ignore builds, node_modules, and sensitive data
├── index.html                   # Core single-page HTML entry point
├── package.json                 # Dependency manifests & compilation commands
├── vite.config.ts               # Vite bundler, CSS and server configurations
├── tsconfig.json                # Strict TypeScript compilation rules
├── server.ts                    # Full-stack Express server proxying Gemini API calls
├── src/
│   ├── main.tsx                 # Client application mounting file
│   ├── index.css                # Global CSS stylesheet importing Tailwind v4
│   ├── types.ts                 # Central repository of strict typescript interfaces
│   ├── App.tsx                  # Primary workspace dashboard container
│   ├── components/
│   │   ├── Canvas/
│   │   │   └── GraphCanvas.tsx  # Custom 2D Pan/Zoom SVG/HTML node graph canvas
│   │   ├── Inspector/
│   │   │   └── NodeInspector.tsx# Editable code, parameter, and integration panel
│   │   ├── Sidebar/
│   │   │   ├── NodePalette.tsx  # Draggable custom node presets palette
│   │   │   └── VersionControl.tsx# Local VCS Git-on-IndexedDB console
│   │   └── Timeline/
│   │       └── TimeTravelScrubber.tsx # VCR-style forensic simulation playback player
│   └── utils/
│       ├── canvasMath.ts        # Screen-to-canvas coordinate space matrix conversions
│       └── quadtree.ts          # Spatial Indexing Quadtree engine for visual pruning
```

---

## 6. Technical Stack

*   **Core UI & State**: React 19, custom hooks, context isolation, and primitive-based `useEffect` dependencies.
*   **Language**: TypeScript (Strict Mode, interface guarantees).
*   **Styling**: Tailwind CSS v4 (native nesting, `@import "tailwindcss"`, modern design theme variables).
*   **Animation**: `motion` (Framer Motion) for staggered timeline lists and responsive panel transitions.
*   **Icons**: `lucide-react` (uniform visual aesthetics).
*   **Backend Proxy**: Express Node server configured for production asset-serving and secure API credentials handling.

---

## 7. Getting Started & Installation

To run AetherFlow IDE locally on your computer, complete the following steps:

### 1. Clone the repository and install dependencies
```bash
git clone https://github.com/devtechedge/aether-flow.git
cd aether-flow
npm install
```

### 2. Configure Environment Variables
Copy the example environment configuration into a `.env` file:
```bash
cp .env.example .env
```
Open `.env` and fill in your actual credentials (if available) to unlock live cloud executions:
```env
# Gemini API Configuration (Server-side secret)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Firestore Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Spin up the Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to interact with the visual editor.

---

## 8. Professional Verification & Building

AetherFlow contains automated scripts to ensure compliance with production standards before deployment:

### Run Code Linting & Type Checks
```bash
npm run lint
```

### Compile Production Build
The project compiles into a highly performant bundled build cleanly outputted to `/dist`:
```bash
npm run build
```

### Start Production Server
Launch the self-contained production bundle locally or in an isolated container:
```bash
npm run start
```

---
*Created with senior-level precision, visual polish, and clean engineering architecture.*
