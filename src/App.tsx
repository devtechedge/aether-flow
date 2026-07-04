/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Terminal, 
  Cpu, 
  Layers, 
  Database, 
  Sparkles, 
  GitBranch, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  ShieldCheck, 
  Workflow, 
  Gauge, 
  Eye, 
  Sliders, 
  Compass,
  ArrowRight,
  RefreshCw,
  Search,
  Video,
  Network
} from 'lucide-react';

// Design System Constants
type TabId = 'blueprint' | 'customizer' | 'prompt' | 'guidelines';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('blueprint');
  const [copied, setCopied] = useState(false);
  
  // Customization Options
  const [projectTitle, setProjectTitle] = useState('AetherFlow IDE');
  const [canvasType, setCanvasType] = useState<'canvas2d' | 'svg' | 'webgl'>('canvas2d');
  const [storageStrategy, setStorageStrategy] = useState<'indexeddb' | 'opfs' | 'localstorage'>('indexeddb');
  const [hasGeminiSearch, setHasGeminiSearch] = useState(true);
  const [hasGeminiImage, setHasGeminiImage] = useState(true);
  const [hasThinkingMode, setHasThinkingMode] = useState(true);
  const [hasVeoVideo, setHasVeoVideo] = useState(false);
  const [performanceOptimized, setPerformanceOptimized] = useState(true);
  const [unitTesting, setUnitTesting] = useState(true);

  // Compile Customized Prompt
  const compiledPrompt = useMemo(() => {
    return `================================================================================
${projectTitle.toUpperCase()} SYSTEM ARCHITECTURE: CUSTOM AGENTIC COMPILER PROMPT
================================================================================
You are a Staff Software Engineer and Chief Frontend Architect with 20+ years of 
experience. Your goal is to build ${projectTitle}—a high-performance, local-first
visual flowchart IDE and execution simulator with 100% functional completeness. 

You MUST build this entirely client-side, with zero paid database dependencies, 
making it instantly deployable to Vercel and fully functional. It is designed to
be an elite engineering portfolio piece, with absolutely no mock features.

Adhere to these key requirements:
1. STRICT TYPE SAFETY: Every data structure, coordinate system, worker message, and
   state event must have fully validated, strict TypeScript interfaces.
2. NO EXTERNAL CANVAS LIBRARIES: Build the node-graph renderer from scratch. Implement
   your own ${canvasType === 'canvas2d' ? 'HTML5 Canvas 2D' : canvasType === 'webgl' ? 'WebGL' : 'SVG'} panning/zooming coordinate space matrix projection${performanceOptimized ? ', quadtree spatial indexing for viewport-only rendering' : ''}, and custom curves.
3. OFF-MAIN-THREAD WORKERS: Implement real Web Workers (compiler.worker.ts and 
   simulator.worker.ts) using standard browser APIs to do high-performance lexical 
   analysis, ESM compilation, and VM execution simulation.
4. VERSION CONTROL ON LOCAL STORAGE: Create a local Git engine on top of ${storageStrategy === 'indexeddb' ? 'IndexedDB (Dexie.js)' : storageStrategy === 'opfs' ? 'Origin Private File System (OPFS)' : 'localStorage'}. 
   Users must be able to branch, commit statechart structures, see visual diffs side-by-side, and merge conflicts.
5. FORENSIC DEBUGGER: Implement full Event Sourcing state management with Command pattern
   undo/redo, letting users record executions and scrub back and forth in real-time.

${hasGeminiSearch || hasGeminiImage || hasThinkingMode || hasVeoVideo ? `--------------------------------------------------------------------------------
GEMINI AI INTELLIGENCE & MULTIMODAL CAPABILITIES (SERVER-SIDE API PROXY)
--------------------------------------------------------------------------------` : ''}
${hasGeminiSearch ? `- SEARCH GROUNDING: Integrate models/gemini-3.5-flash with Google Search Grounding to let the agent retrieve live, up-to-date web-driven information to guide visual workflow node configurations automatically.` : ''}
${hasGeminiImage ? `- IMAGE GENERATION: Integrate models/gemini-3-pro-image-preview to let users generate beautiful, custom illustrative assets for workflow states directly on the canvas, providing standard resolution selections (1K, 2K, and 4K).` : ''}
${hasThinkingMode ? `- DEEP THINKING REASONING: Utilize models/gemini-3.1-pro-preview with high thinking capabilities (ThinkingLevel.HIGH, maxOutputTokens omitted) to auto-refine complex flowchart states and generate bug-free, optimized custom ESM code blocks inside nodes.` : ''}
${hasVeoVideo ? `- VIDEO SYNTHESIS: Integrate models/veo-3.1-fast-generate-preview to let users synthesize 16:9 landscape or 9:16 portrait illustrative background video textures for active nodes, simulating rich interactive contextual tutorials.` : ''}

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
- Implement storage system: Create robust tables to store workspaces, branches, 
  commits, and active project settings locally.
- Implement Sidebar/VersionControl.tsx:
  - Create visual git logs showing commit hashes, author/timestamp, and commit messages.
  - Build a side-by-side Graph Diff Viewer showing a color-coded viewport (Green for new nodes,
    Red for deleted nodes, Yellow for repositioned nodes) when contrasting branches.
- Implement Timeline/TimeTravelScrubber.tsx:
  - Create a physical VCR-style execution player with progress slider, Play, Pause, Single-Step 
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
================================================================================`;
  }, [projectTitle, canvasType, storageStrategy, hasGeminiSearch, hasGeminiImage, hasThinkingMode, hasVeoVideo, performanceOptimized, unitTesting]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBlueprint = () => {
    const markdownContent = `# ARCHITECTURAL BLUEPRINT & AGENT PROMPT
## Project: ${projectTitle}

This masterclass blueprint is authored to showcase 20+ years of engineering craftsmanship, design leadership, and platform optimization. It is optimized to run completely in-browser, making it 100% deployable to **Vercel** with **zero paid database or server dependencies**.

---

## 1. Technical Stack Configuration
- **Rendering Engine**: ${canvasType === 'canvas2d' ? 'HTML5 Canvas 2D Core' : canvasType === 'webgl' ? 'WebGL Core' : 'Direct SVG Vector Node layout'}
- **Storage Strategy**: ${storageStrategy === 'indexeddb' ? 'IndexedDB with transactional Dexie.js query indexes' : storageStrategy === 'opfs' ? 'Origin Private File System (OPFS)' : 'High-density client localStorage'}
- **Performance Optimizations**: ${performanceOptimized ? 'Quadtree-based viewport spatial partitioning, canvas layer pruning, off-thread worker compiles' : 'Standard virtual canvas mapping'}
- **Multimodal AI Integrations**:
  ${hasGeminiSearch ? '- models/gemini-3.5-flash with Google Search Grounding for live context integration\n' : ''}  ${hasGeminiImage ? '- models/gemini-3-pro-image-preview for asset and visual context compilation with resolution constraints\n' : ''}  ${hasThinkingMode ? '- models/gemini-3.1-pro-preview with ThinkingLevel.HIGH for autonomous ESM code optimization inside states\n' : ''}  ${hasVeoVideo ? '- models/veo-3.1-fast-generate-preview for cinematic UI tutorial backgrounds\n' : ''}

---

## 2. Compilation System Prompt For AI Agents
\`\`\`text
${compiledPrompt}
\`\`\`

---
*Generated via AetherFlow Architect Hub on ${new Date().toISOString().split('T')[0]}.*`;

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.toLowerCase().replace(/\s+/g, '_')}_blueprint.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#fdfcfb] text-[#1a1a1a] flex flex-col font-sans selection:bg-[#1a1a1a] selection:text-white">
      
      {/* Top Architectural Header / Status Bar */}
      <header id="header-bar" className="border-b border-[#1a1a1a]/10 bg-[#fdfcfb]/90 backdrop-blur-md sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[#1a1a1a]/5 border border-[#1a1a1a]/10 rounded-md text-[#1a1a1a]">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-[#1a1a1a]/60">CHIEF ARCHITECT SERIES</span>
              <span className="px-2 py-0.5 bg-[#1a1a1a] text-[9px] font-mono font-bold text-white uppercase tracking-wider rounded">Local-First</span>
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]">
              {projectTitle} Hub
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-[#1a1a1a]/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff3b00] animate-pulse"></span>
              <span className="font-bold italic text-[#ff3b00]">120 FPS Execution Ready</span>
            </div>
            <div className="text-[#1a1a1a]/20">|</div>
            <div>UTC: {new Date().toISOString().split('T')[1].slice(0, 5)}</div>
          </div>
          <button 
            onClick={handleDownloadBlueprint}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-xs text-white font-serif italic font-medium rounded transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Download Blueprint (.md)
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar & Controls - 4 Columns */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Quick Concept Summary Card */}
          <div className="bg-[#f8f6f2] border border-[#1a1a1a]/10 rounded-xl p-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] select-none pointer-events-none">
              <Compass className="w-24 h-24 text-[#1a1a1a]" />
            </div>
            <h3 className="text-[10px] uppercase font-extrabold tracking-[0.2em] text-[#1a1a1a]/50 mb-2">PROPOSED PORTFOLIO MASTERWORK</h3>
            <p className="text-3xl font-serif italic text-[#1a1a1a] mb-3">{projectTitle}</p>
            <p className="text-sm text-[#1a1a1a]/70 leading-relaxed font-serif">
              An offline-resilient visual state machine IDE that compiles logic off-thread and simulates active virtual machine executions directly on-device. Crafted to demonstrate ultimate engineering maturity.
            </p>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-2 py-0.5 bg-white text-[#1a1a1a] text-[9px] font-mono font-bold rounded border border-[#1a1a1a]/10 uppercase">0$ Hosting</span>
              <span className="px-2 py-0.5 bg-white text-[#1a1a1a] text-[9px] font-mono font-bold rounded border border-[#1a1a1a]/10 uppercase">IndexedDB Core</span>
              <span className="px-2 py-0.5 bg-white text-[#1a1a1a] text-[9px] font-mono font-bold rounded border border-[#1a1a1a]/10 uppercase">Web Workers</span>
            </div>
          </div>

          {/* Interactive Customizer Sidebar Block */}
          <div className="bg-white border border-[#1a1a1a]/10 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#1a1a1a]/10">
              <Sliders className="w-4 h-4 text-[#ff3b00]" />
              <h2 className="font-mono text-xs uppercase tracking-[0.15em] font-extrabold text-[#1a1a1a]">PROMPT PARAMETERS</h2>
            </div>

            <div className="flex flex-col gap-5">
              {/* Project Name */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#1a1a1a]/60 mb-1.5">Project Title</label>
                <input 
                  type="text" 
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full bg-[#f8f6f2] text-sm px-3 py-2 rounded border border-[#1a1a1a]/10 focus:border-[#1a1a1a] outline-none text-[#1a1a1a] transition-all font-mono"
                  placeholder="e.g. AetherFlow IDE"
                />
              </div>

              {/* Canvas Renderer Choice */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#1a1a1a]/60 mb-1.5">Canvas Renderer Strategy</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['canvas2d', 'svg', 'webgl'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setCanvasType(mode)}
                      className={`text-[9px] font-mono py-1.5 rounded transition-all uppercase border ${
                        canvasType === mode 
                          ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] font-bold' 
                          : 'bg-[#f8f6f2] text-[#1a1a1a]/50 border-[#1a1a1a]/5 hover:bg-[#1a1a1a]/5'
                      }`}
                    >
                      {mode === 'canvas2d' ? 'Canvas 2D' : mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offline Storage Engine */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#1a1a1a]/60 mb-1.5">Local Storage Backing</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['indexeddb', 'opfs', 'localstorage'] as const).map((engine) => (
                    <button
                      key={engine}
                      onClick={() => setStorageStrategy(engine)}
                      className={`text-[9px] font-mono py-1.5 rounded transition-all uppercase border ${
                        storageStrategy === engine 
                          ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] font-bold' 
                          : 'bg-[#f8f6f2] text-[#1a1a1a]/50 border-[#1a1a1a]/5 hover:bg-[#1a1a1a]/5'
                      }`}
                    >
                      {engine === 'localstorage' ? 'Local' : engine}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gemini AI Integrations */}
              <div className="space-y-3">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#1a1a1a]/60">Generative AI Core Services</label>
                
                {/* Gemini Search Grounding */}
                <div className="flex items-center justify-between p-2.5 bg-[#f8f6f2] rounded border border-[#1a1a1a]/5">
                  <div className="flex items-center gap-2.5">
                    <Search className="w-3.5 h-3.5 text-[#1a1a1a]" />
                    <div>
                      <span className="text-xs font-bold text-[#1a1a1a] block leading-tight">Search Grounding</span>
                      <span className="text-[9px] text-[#1a1a1a]/40 font-mono">gemini-3.5-flash</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={hasGeminiSearch}
                    onChange={(e) => setHasGeminiSearch(e.target.checked)}
                    className="rounded border-[#1a1a1a]/20 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                  />
                </div>

                {/* Gemini Image Gen */}
                <div className="flex items-center justify-between p-2.5 bg-[#f8f6f2] rounded border border-[#1a1a1a]/5">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1a1a1a]" />
                    <div>
                      <span className="text-xs font-bold text-[#1a1a1a] block leading-tight">Asset Generation</span>
                      <span className="text-[9px] text-[#1a1a1a]/40 font-mono">gemini-3-pro-image</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={hasGeminiImage}
                    onChange={(e) => setHasGeminiImage(e.target.checked)}
                    className="rounded border-[#1a1a1a]/20 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                  />
                </div>

                {/* Thinking Mode */}
                <div className="flex items-center justify-between p-2.5 bg-[#f8f6f2] rounded border border-[#1a1a1a]/5">
                  <div className="flex items-center gap-2.5">
                    <Network className="w-3.5 h-3.5 text-[#1a1a1a]" />
                    <div>
                      <span className="text-xs font-bold text-[#1a1a1a] block leading-tight">High Thinking Mode</span>
                      <span className="text-[9px] text-[#1a1a1a]/40 font-mono">gemini-3.1-pro</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={hasThinkingMode}
                    onChange={(e) => setHasThinkingMode(e.target.checked)}
                    className="rounded border-[#1a1a1a]/20 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                  />
                </div>

                {/* Veo 3 Video Gen */}
                <div className="flex items-center justify-between p-2.5 bg-[#f8f6f2] rounded border border-[#1a1a1a]/5">
                  <div className="flex items-center gap-2.5">
                    <Video className="w-3.5 h-3.5 text-[#1a1a1a]" />
                    <div>
                      <span className="text-xs font-bold text-[#1a1a1a] block leading-tight">Veo 3.1 Video Gen</span>
                      <span className="text-[9px] text-[#1a1a1a]/40 font-mono">veo-3.1-fast</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={hasVeoVideo}
                    onChange={(e) => setHasVeoVideo(e.target.checked)}
                    className="rounded border-[#1a1a1a]/20 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                  />
                </div>
              </div>

              {/* Performance & Quality Options */}
              <div className="space-y-2 pt-2 border-t border-[#1a1a1a]/5">
                <div className="flex items-center justify-between text-xs font-serif italic text-[#1a1a1a]/80">
                  <span>Quadtree Spatial Partitioning</span>
                  <input 
                    type="checkbox" 
                    checked={performanceOptimized} 
                    onChange={(e) => setPerformanceOptimized(e.target.checked)}
                    className="rounded text-[#1a1a1a] focus:ring-[#1a1a1a] border-[#1a1a1a]/20"
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-serif italic text-[#1a1a1a]/80">
                  <span>Pre-configured Vitest Suite</span>
                  <input 
                    type="checkbox" 
                    checked={unitTesting} 
                    onChange={(e) => setUnitTesting(e.target.checked)}
                    className="rounded text-[#1a1a1a] focus:ring-[#1a1a1a] border-[#1a1a1a]/20"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Quick Copy Action Panel */}
          <div className="bg-[#f8f6f2] border border-[#1a1a1a]/10 rounded-xl p-6 text-center shadow-sm">
            <h4 className="text-sm font-semibold text-[#1a1a1a] mb-2 flex items-center justify-center gap-2">
              <Terminal className="w-4 h-4" /> Get Your System Prompt
            </h4>
            <p className="text-xs text-[#1a1a1a]/60 leading-relaxed font-serif mb-4">
              Once configured, copy this blueprint prompt and feed it to your repository builder or AI coding agent to compile the codebase instantly.
            </p>
            <div className="flex items-center gap-2 justify-center">
              <button 
                onClick={handleCopyPrompt}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 active:scale-95 text-xs text-white font-serif italic font-bold rounded shadow-sm transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied System Prompt!' : 'Copy Master Prompt'}
              </button>
            </div>
          </div>

        </div>

        {/* Display Content Hub - 8 Columns */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Tabs header */}
          <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-px">
            <div className="flex items-center">
              {(['blueprint', 'customizer', 'prompt', 'guidelines'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-mono tracking-wider transition-all border-b-2 ${
                    activeTab === tab 
                      ? 'border-[#1a1a1a] text-[#1a1a1a] font-serif italic font-black' 
                      : 'border-transparent text-[#1a1a1a]/40 hover:text-[#1a1a1a]'
                  }`}
                >
                  {tab === 'blueprint' && 'Architectural Blueprint'}
                  {tab === 'customizer' && 'Playground Customizer'}
                  {tab === 'prompt' && 'AI Compiler Prompt'}
                  {tab === 'guidelines' && 'Recruiter Strategy'}
                </button>
              ))}
            </div>

            {/* Simulated telemetry badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-[#f8f6f2] border border-[#1a1a1a]/10 rounded-full text-[10px] font-mono text-[#1a1a1a]/60 font-bold uppercase">
              <Cpu className="w-3 h-3 text-[#ff3b00] animate-spin" style={{ animationDuration: '4s' }} />
              <span>Sandbox Status: IDLE</span>
            </div>
          </div>

          {/* Tab 1: Architectural Blueprint Overview */}
          {activeTab === 'blueprint' && (
            <div className="bg-white border border-[#1a1a1a]/10 rounded-xl p-6 md:p-8 space-y-8 leading-relaxed shadow-sm">
              <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif italic text-5xl text-[#1a1a1a]/20">01</span>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-[#1a1a1a] leading-none">
                      The Orchestration Loop.
                    </h2>
                    <p className="text-xs font-serif italic text-[#1a1a1a]/60 mt-1">Multi-thread compilation, high-frequency caching, and spatial indexing.</p>
                  </div>
                </div>
                <button 
                  onClick={handleDownloadBlueprint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f6f2] hover:bg-[#1a1a1a]/5 text-[10px] uppercase font-mono tracking-wider text-[#1a1a1a] border border-[#1a1a1a]/10 rounded"
                >
                  <Download className="w-3.5 h-3.5" /> Download (.md)
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-[#f8f6f2] border border-[#1a1a1a]/5 rounded-lg flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-[#ff3b00] mb-3">
                    <Cpu className="w-4 h-4" />
                    <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold opacity-60">Execution</span>
                  </div>
                  <div>
                    <h4 className="font-serif italic text-lg text-[#1a1a1a] mb-1">Worker Sandboxing</h4>
                    <p className="text-xs text-[#1a1a1a]/70 leading-relaxed font-serif">
                      Executes state configurations off-thread inside parallelized Web Workers, bypassing browser event bottlenecks.
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-[#f8f6f2] border border-[#1a1a1a]/5 rounded-lg flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-[#1a1a1a] mb-3">
                    <Database className="w-4 h-4" />
                    <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold opacity-60">Storage</span>
                  </div>
                  <div>
                    <h4 className="font-serif italic text-lg text-[#1a1a1a] mb-1">Local Git Ledger</h4>
                    <p className="text-xs text-[#1a1a1a]/70 leading-relaxed font-serif">
                      Leverages IndexedDB for persistent, zero-latency branch operations, commit records, and graphical comparisons.
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-[#f8f6f2] border border-[#1a1a1a]/5 rounded-lg flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-[#1a1a1a] mb-3">
                    <Gauge className="w-4 h-4" />
                    <span className="text-[9px] font-mono uppercase tracking-widest font-extrabold opacity-60">Graphics</span>
                  </div>
                  <div>
                    <h4 className="font-serif italic text-lg text-[#1a1a1a] mb-1">Raw Canvas Projection</h4>
                    <p className="text-xs text-[#1a1a1a]/70 leading-relaxed font-serif">
                      Pure 2D affine matrices and cubic bezier splines draw node vectors at a locked 120 FPS refresh rate.
                    </p>
                  </div>
                </div>
              </div>

              {/* In-depth details */}
              <div className="space-y-4 pt-4 border-t border-[#1a1a1a]/10">
                <h3 className="text-lg font-serif italic text-[#1a1a1a] flex items-center gap-2">
                  <GitBranch className="w-4.5 h-4.5" />
                  Engineering Seniority & Design Highlights:
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#1a1a1a]/85 font-serif">
                  <li className="flex gap-2.5">
                    <ArrowRight className="w-4 h-4 text-[#ff3b00] shrink-0 mt-0.5" />
                    <span><strong>True Compiler Synthesis</strong>: Converts visual layout metadata into clean executable Javascript ESM models that run inside dynamic VM stacks.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <ArrowRight className="w-4 h-4 text-[#ff3b00] shrink-0 mt-0.5" />
                    <span><strong>Quadtree Subdivisions</strong>: Includes a custom spatial partitioning algorithm that skips painting out-of-viewport items, scaling to thousands of node connections.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <ArrowRight className="w-4 h-4 text-[#ff3b00] shrink-0 mt-0.5" />
                    <span><strong>Time-Travel Event Ledger</strong>: Built using standard Command patterns with structural snapshot trees, supporting forensic execution analysis.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <ArrowRight className="w-4 h-4 text-[#ff3b00] shrink-0 mt-0.5" />
                    <span><strong>100% Client-Side Architecture</strong>: Perfect for portfolios. No paid third-party dependencies, databases, or container servers required to host.</span>
                  </li>
                </ul>
              </div>

              {/* ASCII Diagram Visualizer */}
              <div className="pt-4 border-t border-[#1a1a1a]/10">
                <span className="text-[9px] font-mono text-[#1a1a1a]/50 uppercase tracking-widest block mb-2">Architectural Coordinate Mapping Process</span>
                <pre className="p-4 bg-[#f8f6f2] rounded border border-[#1a1a1a]/15 text-[10px] font-mono text-[#1a1a1a]/80 overflow-x-auto leading-relaxed">
{`Viewport Drag / Move Event -> Trackpad Zoom Multiplier -> Matrix Transform [A,B,C,D,E,F]
                                  │
                                  ▼
      Query Quadtree: { minX: scrollX, minY: scrollY, maxX, maxY }
                                  │
                                  ▼
           Compile Render Node Bounds & SVG Bezier Control Points
                                  │
                                  ▼
             HTML5 Context2D Paint / Draw (Skipping pruned nodes)
`}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 2: Interactive Customizer Workspace */}
          {activeTab === 'customizer' && (
            <div className="bg-white border border-[#1a1a1a]/10 rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="border-b border-[#1a1a1a]/10 pb-4">
                <h2 className="text-2xl font-serif italic text-[#1a1a1a]">
                  Architect Customizer Playground
                </h2>
                <p className="text-xs text-[#1a1a1a]/60 mt-1 font-serif">Configure the blueprint\'s complexity constraints. Updates are compiled instantly into the model configuration block below.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel left */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#1a1a1a]/50 border-b border-[#1a1a1a]/5 pb-2">Rendering & Persistence Config</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#1a1a1a]/60 block mb-1">Statechart Graphics Target</span>
                      <select 
                        value={canvasType} 
                        onChange={(e) => setCanvasType(e.target.value as any)}
                        className="w-full bg-[#f8f6f2] border border-[#1a1a1a]/10 px-3 py-2 rounded text-xs text-[#1a1a1a] focus:border-[#1a1a1a] outline-none font-serif italic"
                      >
                        <option value="canvas2d">HTML5 Canvas 2D Engine (Recommended for 120 FPS performance)</option>
                        <option value="svg">Direct SVG Node Layout (Optimized for responsive CSS theme integration)</option>
                        <option value="webgl">WebGL GPU-Accelerated Canvas (For complex, high-scale nodes)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#1a1a1a]/60 block mb-1">On-Device Cache System</span>
                      <select 
                        value={storageStrategy} 
                        onChange={(e) => setStorageStrategy(e.target.value as any)}
                        className="w-full bg-[#f8f6f2] border border-[#1a1a1a]/10 px-3 py-2 rounded text-xs text-[#1a1a1a] focus:border-[#1a1a1a] outline-none font-serif italic"
                      >
                        <option value="indexeddb">IndexedDB with local transactional tree queries</option>
                        <option value="opfs">Origin Private File System (OPFS file handles)</option>
                        <option value="localstorage">Standard client-side localStorage</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Panel right */}
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#1a1a1a]/50 border-b border-[#1a1a1a]/5 pb-2">Multimodal AI Grounding</h3>
                  
                  <div className="space-y-3 text-xs text-[#1a1a1a]/70 leading-relaxed font-serif">
                    <p>
                      Key Gemini AI and Veo Multimodal patterns are mapped natively into your generated prompt to cover complex, real-world services that recruiters and engineering panels actively look for:
                    </p>
                    <ul className="space-y-2 font-mono text-[10px] uppercase tracking-wider text-[#1a1a1a]/80 pt-2">
                      <li className={`flex items-center gap-2 ${hasGeminiSearch ? 'text-[#ff3b00]' : 'opacity-40'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasGeminiSearch ? 'bg-[#ff3b00]' : 'bg-[#1a1a1a]/40'}`}></span>
                        Google Search Integration (gemini-3.5-flash)
                      </li>
                      <li className={`flex items-center gap-2 ${hasGeminiImage ? 'text-[#ff3b00]' : 'opacity-40'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasGeminiImage ? 'bg-[#ff3b00]' : 'bg-[#1a1a1a]/40'}`}></span>
                        Dynamic Asset compilation (gemini-3-pro-image)
                      </li>
                      <li className={`flex items-center gap-2 ${hasThinkingMode ? 'text-[#ff3b00]' : 'opacity-40'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasThinkingMode ? 'bg-[#ff3b00]' : 'bg-[#1a1a1a]/40'}`}></span>
                        Deep Code Optimization (ThinkingLevel.HIGH)
                      </li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Interactive preview box */}
              <div className="p-4 bg-[#f8f6f2] rounded border border-[#1a1a1a]/10">
                <span className="text-[9px] font-mono text-[#1a1a1a]/40 uppercase tracking-widest block mb-1">Dynamically Generated Prompt Header Preview</span>
                <div className="font-mono text-xs text-[#1a1a1a]/95 leading-relaxed">
                  {`export interface ${projectTitle.replace(/\s+/g, '')}State {`} <br />
                  &nbsp;&nbsp;{`id: string;`}<br />
                  &nbsp;&nbsp;{`renderingMode: '${canvasType}';`}<br />
                  &nbsp;&nbsp;{`storageBacking: '${storageStrategy}';`}<br />
                  &nbsp;&nbsp;{`hasSearchGrounding: ${hasGeminiSearch};`}<br />
                  &nbsp;&nbsp;{`hasCustomThinking: ${hasThinkingMode};`}<br />
                  {`}`}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Compiled System Prompt */}
          {activeTab === 'prompt' && (
            <div className="bg-white border border-[#1a1a1a]/10 rounded-xl p-6 md:p-8 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-4">
                <div>
                  <h2 className="text-2xl font-serif italic text-[#1a1a1a]">
                    AI Systems Architect Prompt
                  </h2>
                  <p className="text-xs font-serif text-[#1a1a1a]/60 mt-1">Provide this complete block directly to an advanced AI workspace to generate the full system files.</p>
                </div>
                <button 
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f6f2] hover:bg-[#1a1a1a]/5 text-[10px] uppercase font-mono tracking-wider text-[#1a1a1a] border border-[#1a1a1a]/10 rounded"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#ff3b00]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <div className="relative">
                <textarea 
                  readOnly 
                  value={compiledPrompt}
                  className="w-full h-96 bg-[#f8f6f2] text-[#1a1a1a] font-mono text-xs p-4 rounded border border-[#1a1a1a]/15 outline-none resize-y focus:border-[#1a1a1a] transition-all"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Recruiter Presentation Guide */}
          {activeTab === 'guidelines' && (
            <div className="bg-white border border-[#1a1a1a]/10 rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
              <div className="border-b border-[#1a1a1a]/10 pb-4">
                <h2 className="text-2xl font-serif italic text-[#1a1a1a]">
                  Recruiter Presentation Strategy
                </h2>
                <p className="text-xs font-serif text-[#1a1a1a]/60 mt-1">Meticulously targeted talking points to excel during engineering review rounds and system architecture panels.</p>
              </div>

              <div className="space-y-6 text-sm text-[#1a1a1a]/85 leading-relaxed font-serif">
                <div>
                  <h4 className="font-serif italic font-bold text-[#1a1a1a] text-lg mb-1">1. Frame-rate Optimization Proof</h4>
                  <p className="text-[#1a1a1a]/70">
                    Explain to reviewers how plotting dynamic statechart configurations typically triggers extensive layout reflows (bringing frame-rates to a grinding crawl). Highlight that AetherFlow addresses this off the shelf by building an internal **Quadtree Spatial Subdivision** system that maps only nodes overlapping the viewport bounds.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif italic font-bold text-[#1a1a1a] text-lg mb-1">2. Local-First Branching Architecture</h4>
                  <p className="text-[#1a1a1a]/70">
                    Discuss your intentional avoidance of high-maintenance remote databases (like Supabase or Render) in favor of **IndexedDB**. Emphasize how local transactions secure 100% data ownership, preserve offline capability, and illustrate deep client-side database optimization.
                  </p>
                </div>

                <div>
                  <h4 className="font-serif italic font-bold text-[#1a1a1a] text-lg mb-1">3. Time-Travel Ledgers and snapshots</h4>
                  <p className="text-[#1a1a1a]/70">
                    Hiring panels heavily value modular state patterns. Articulate how your design relies on a structured **Command pattern history** tracking model, allowing users to replay visual transitions, pause at specific ticks, and compare state structures across commits.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-[#1a1a1a]/10 bg-[#f8f6f2] py-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]/60">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 AetherFlow Architect Systems. Crafted for Chief-level portfolio development.</p>
          <div className="flex gap-4 font-mono text-[9px]">
            <span className="text-[#ff3b00] italic font-extrabold">Deployable: Vercel Free Tier</span>
            <span>|</span>
            <span className="text-[#1a1a1a]/60">Database: 100% On-Device</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
