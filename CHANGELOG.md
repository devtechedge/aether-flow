# Changelog

All notable changes to the **AetherFlow IDE** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-07-04
### Added
- **Visual Branch Diffing**: Added support for comparing the current branch side-by-side with any other branch baseline. Displays real-time visual statuses on the 2D Canvas:
  - `+ Added` (Emerald ring, soft shadows)
  - `Modified` (Amber ring, updated attributes or coordinates)
  - `- Deleted` (Ghost nodes styled with strike-through layout and reduced opacity)
- **Forensic Time-Travel Debugger Scrubber**: Integrated an event-sourcing snapshot ledger. Users can now halt or pause simulations and use a high-precision scrubber slider to rewind/fast-forward execution ticks, inspect variable registries, and view visual nodes.
- **HTML5 Drag and Drop Palette**: Upgraded the instruction sidebar palette to support native browser drag-and-drop mechanics. Nodes can be dragged onto the canvas and will automatically snap to the nearest 8px grid coordinate.
- **Automatic Off-Thread Compilation Diagnostics**: Built a compiler analysis step that evaluates topological validity inside a dedicated Web Worker context before execution.

### Changed
- Re-routed simulation exits: Reaching the end terminal now suspends the execution thread gracefully instead of clearing active highlighting immediately, facilitating forensic traceback debugging.
- Improved layout responsiveness of the Bottom Tray console telemetry panel.

### Fixed
- Fixed typescript namespace errors in `NodeInspector` and `VersionControl` related to JSX events.
- Prevented canvas connection links from snapping to invalid self-references.

---

## [1.0.0] - 2026-06-30
### Added
- **Interactive 2D Graphics Engine**: Built a custom pan/zoom matrix projection rendering engine with viewport clipping.
- **TypeScript Quadtree Partitioning**: Implemented a dynamic Quadtree spatial indexer to support buttery-smooth 120 FPS performance by skipping visual rendering for out-of-bounds node structures.
- **Integrated VCS Ledger**: Designed a local-first branching, checking out, and commit staging workspace persisted to browser client-side storage (localStorage / IndexedDB).
- **Gemini AI Core Nodes**: Full integration of server-side proxy routes for Gemini models, including support for custom prompts, Web Search Grounding, and Thinking Mode.
- **Google Workspace Nodes**: Built-in support for real-time and mock execution of Gmail (Inboxes, send, draft), Drive (folder creation, file writes), and Docs (batch append, parsing paragraph elements).
- **Interactive VCR Controls**: Forward stepping, speed throttling (0.5x, 1x, 2x, 5x), execution halting, and continuous logging.
- **System Diagnostics Profiler**: Hardware CPU cycles, memory heap usage metrics, and frame-rate (FPS) profiling meters.

---
*Changelog maintained with professional version-control discipline.*
