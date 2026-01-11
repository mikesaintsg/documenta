# Project Plan: Documenta

> **Status:** Phase 3 of 6 — Layer System Complete
> **Last Updated:** 2026-01-11
> **Next Milestone:** Text Layer (text extraction, selection, inline editing)

## Vision

Documenta is a mobile-first, browser-only PDF editor library built on mupdf. It provides a clean, type-safe API for loading, viewing, annotating, and saving PDF documents entirely in the browser with zero server dependencies.  The library emphasizes proper layer management to enable simultaneous text selection, drawing, and form filling without conflicts.

## Non-Goals

Explicit boundaries.  What we are NOT building: 

- ❌ Server-side PDF processing
- ❌ PDF creation from scratch (only editing existing PDFs)
- ❌ OCR for scanned documents (we use mupdf's text extraction)
- ❌ Digital signature verification
- ❌ PDF/A compliance validation
- ❌ Node.js support (browser-only)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PdfEditor (Facade)                     │
│  Coordinates all layers, exposes unified API, manages state │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   LayerStack    │  │   PdfDocument   │  │   FileManager   │
│  (Coordinator)  │  │   (mupdf wrap)  │  │  (Load/Save)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │
          │ Manages z-index, pointer routing, mode switching
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Layer Hierarchy                          │
│  (Bottom to Top)                                             │
│  ┌─────────────┐                                             │
│  │CanvasLayer  │ z: 0  - PDF page rendering                   │
│  ├─────────────┤                                             │
│  │ TextLayer   │ z:10 - Text selection & inline editing      │
│  ├─────────────┤                                             │
│  │DrawingLayer │ z:20 - Freehand pen/highlighter/eraser      │
│  ├─────────────┤                                             │
│  │ FormLayer   │ z:30 - Interactive form fields              │
│  ├─────────────┤                                             │
│  │AnnotLayer   │ z:40 - Annotation overlays (notes, shapes)  │
│  └─────────────┘                                             │
└─────────────────────────────────────────────────────────────┘
```

### Layer Coordination Strategy

Only ONE layer receives pointer events at a time based on the current **EditorMode**: 

| Mode         | Active Layer  | Other Layers           |
|--------------|---------------|------------------------|
| `pan`        | None          | All `pointer-events:  none` |
| `text`       | TextLayer     | Others pass-through    |
| `draw`       | DrawingLayer  | Others pass-through    |
| `form`       | FormLayer     | Others pass-through    |
| `annotate`   | AnnotLayer    | Others pass-through    |

The **LayerStack** enforces this by: 
1. Setting `pointer-events: auto` only on the active layer
2. Routing touch/pointer events to the appropriate handler
3. Preventing gesture conflicts (e.g., pinch-zoom vs drawing)

### Mobile-First Touch Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    TouchGestureRecognizer                   │
│  - Single tap → selection/click                             │
│  - Double tap → inline edit mode                            │
│  - Long press → context menu                                │
│  - Two-finger pinch → zoom (always available)               │
│  - Two-finger pan → scroll (always available)               │
│  - Single-finger pan → mode-dependent (draw OR scroll)      │
└─────────────────────────────────────────────────────────────┘
```

## Phases

| # | Phase | Status | Description |
|---|-------|--------|-------------|
| 1 | Foundation | ✅ Complete | Types, project structure, tooling |
| 2 | Core Document | ✅ Complete | PDF loading, rendering, navigation |
| 3 | Layer System | ✅ Complete | LayerStack, CanvasLayer, coordinate system |
| 4 | Text Layer | 🔄 Active | Text extraction, selection, inline editing |
| 5 | Drawing Layer | ⏳ Pending | Pen, highlighter, eraser with touch support |
| 6 | Advanced Features | ⏳ Pending | Forms, annotations, page management |

**Status Legend:**
- ✅ Complete
- 🔄 Active
- ⏳ Pending

## Decisions Log

### 2026-01-11:  Layer Coordination via Single Active Mode
**Decision:** Only one interactive layer receives pointer events at a time
**Rationale:** Prevents gesture conflicts between text selection and drawing; simplifies mobile touch handling; clear user mental model
**Alternatives rejected:** Multi-layer simultaneous interaction (too complex, gesture conflicts); per-touch-point routing (unreliable on mobile)

### 2026-01-11: Overlay Strategy for Text Layer
**Decision:** Use HTML overlay for text selection rather than canvas-only rendering
**Rationale:** Native browser text selection; accessibility support; character-level positioning from mupdf StructuredText API
**Alternatives rejected:** Canvas-only (no text selection, no accessibility); contenteditable (positioning sync issues)

### 2026-01-11: Separate Overlay Canvas for Drawing
**Decision:** DrawingLayer uses its own canvas overlay, not the PDF canvas
**Rationale:** Prevents coordinate conflicts with PDF rendering; allows independent redraw; simpler devicePixelRatio handling
**Alternatives rejected:** Draw directly on PDF canvas (coordinate issues, re-render conflicts)

### 2026-01-11: Mobile-First Design
**Decision:** Base styles target mobile; desktop features added via media queries
**Rationale:** PDF editing on tablets is a primary use case; touch gestures are first-class
**Alternatives rejected:** Desktop-first with mobile adaptations (leads to poor touch UX)

## Open Questions

- [ ] Should we support multi-page continuous scroll view, or single-page only?
- [ ] How to handle PDF password protection?
- [ ] Should annotations be stored in the PDF or as a separate sidecar file option? 

## References

- [mupdf. js Documentation](https://mupdf.readthedocs.io/en/latest/mupdf-js. html)
- [File System Access API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [Pointer Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [Touch Events Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)