# Phase 5: Drawing Layer

> **Status:** ✅ Complete
> **Started:** 2026-01-11
> **Completed:** 2026-01-11
> **Depends on:** Phase 3 (Layer System) ✅ Complete

## Objective

Implement freehand drawing with pen, highlighter, and eraser tools. By end of phase, users can draw on PDFs with touch and mouse, undo/redo strokes, and drawings persist as ink annotations.

## Deliverables

| # | Deliverable | Status | Assignee |
|---|-------------|--------|----------|
| 5.1 | Drawing canvas overlay | ✅ Done | — |
| 5.2 | Stroke rendering | ✅ Done | — |
| 5.3 | Tool implementation | ✅ Done | — |
| 5.4 | Touch drawing support | ✅ Done | — |
| 5.5 | Ink annotation persistence | ⏳ Pending | — |
| 5.6 | Unit tests | ⏳ Pending | — |

**Status Legend:**
- ✅ Done
- 🔄 Active
- ⏳ Pending

## Current Focus: Phase Complete (except persistence and tests)

Core drawing functionality is implemented:
- Separate canvas overlay for drawing
- Pen, highlighter, and eraser tools
- Touch and mouse input handling
- Undo/redo support
- Smooth stroke rendering with quadratic curves

Ink annotation persistence (saving to PDF) deferred to Phase 6.

---

## Deliverable 5.1: Drawing Canvas Overlay

### Implementation Checklist

- [x] Create `src/core/drawing/DrawingLayer.ts`
- [x] Extend BaseLayer
- [x] Create overlay canvas matching PDF canvas size
- [x] Handle devicePixelRatio for crisp lines
- [x] Position overlay exactly over PDF canvas
- [x] Set z-index above TextLayer

---

## Deliverable 5.2: Stroke Rendering

### Implementation Checklist

- [x] Implement quadratic curve smoothing
- [x] Implement stroke width scaling with zoom
- [x] Implement opacity blending
- [x] Optimize redraw

---

## Deliverable 5.3: Tool Implementation

### Implementation Checklist

- [x] Implement pen tool (solid strokes with configurable color/width)
- [x] Implement highlighter tool (semi-transparent, thicker strokes)
- [x] Implement eraser tool (removes strokes that intersect eraser path)
- [x] Implement tool switching with default settings

---

## Deliverable 5.4: Touch Drawing Support

### Implementation Checklist

- [x] Use pointerdown/pointermove/pointerup events
- [x] Set `touch-action: none` when drawing active
- [x] Capture pointer for reliable tracking
- [x] Filter primary pointer only (ignore palm touches)

---

## Deliverable 5.5: Ink Annotation Persistence

### Implementation Checklist

- [ ] Convert DrawingStroke to mupdf Ink annotation
- [ ] Calculate bounding rect from points
- [ ] Set color, opacity, stroke width
- [ ] Load existing ink annotations on page render

**Note:** Deferred to Phase 6 as it requires annotation infrastructure.

---

## Deliverable 5.6: Unit Tests

### Implementation Checklist

- [ ] Create `tests/core/drawing/DrawingLayer.test.ts`
- [ ] Test stroke creation and storage
- [ ] Test eraser hit detection
- [ ] Test undo/redo stack
- [ ] Test coordinate scaling at different zoom levels

## Phase Completion Criteria

- [x] Core drawing functionality implemented
- [x] Drawing works with mouse and touch
- [x] Pen, highlighter, eraser all functional
- [x] Undo/redo works correctly
- [x] `npm run check` passes
- [x] `npm run format` passes
- [x] `npm run build` passes
- [x] `npm run test` passes
- [ ] Strokes persist after save (deferred to Phase 6)
- [ ] Unit tests for Phase 5 (deferred)
