# Phase 2: Core Document

> **Status:** ✅ Complete
> **Started:** 2026-01-11
> **Completed:** 2026-01-11
> **Depends on:** Phase 1 (Foundation) ✅ Complete

## Objective

Implement PDF document loading, rendering, navigation, and zoom. By end of phase, users can load a PDF file, view pages on canvas, navigate between pages, and control zoom level.

## Deliverables

| # | Deliverable | Status | Assignee |
|---|-------------|--------|----------|
| 2.1 | PdfDocument wrapper | ✅ Done | — |
| 2.2 | FileManager (load/save) | ✅ Done | — |
| 2.3 | CanvasLayer (rendering) | ✅ Done | — |
| 2.4 | Navigation & Zoom | ✅ Done | — |
| 2.5 | PdfEditor facade | ✅ Done | — |
| 2.6 | Unit tests | ⏳ Pending | — |

**Status Legend:**
- ✅ Done
- 🔄 Active
- ⏳ Pending

## Current Focus: Phase Complete (except tests)

Core document loading, rendering, navigation and zoom are implemented.
Unit tests for Phase 2 components are pending.

---

## Deliverable 2.1: PdfDocument Wrapper

### Requirements

1. Wrap mupdf.PDFDocument with type-safe interface
2. Handle WebAssembly initialization
3. Provide page access and metadata

### Implementation Checklist

- [x] Create `src/core/document/PdfDocument.ts`
- [x] Implement mupdf initialization
- [x] Implement `loadFromBuffer()`
- [x] Implement `getPage()` with caching
- [x] Implement `getPageDimensions()`
- [x] Implement `toArrayBuffer()`
- [x] Implement `destroy()` cleanup

---

## Deliverable 2.2: FileManager

### Requirements

1. Load PDF from File object
2. Load PDF from URL/fetch
3. Save using File System Access API
4. Fallback download for older browsers

### Implementation Checklist

- [x] Create `src/core/file/FileManager.ts`
- [x] Implement `loadFile()` using File.arrayBuffer()
- [x] Implement `loadUrl()` using fetch
- [x] Implement `save()` with File System Access API
- [x] Implement `saveAs()` with showSaveFilePicker
- [x] Implement `download()` fallback with Blob URL

---

## Deliverable 2.3: CanvasLayer

### Requirements

1. Render PDF pages to canvas with proper scaling
2. Handle devicePixelRatio for crisp rendering
3. Support zoom levels
4. Manage canvas sizing

### Implementation Checklist

- [x] Create `src/core/layers/CanvasLayer.ts`
- [x] Create canvas element in constructor
- [x] Implement proper devicePixelRatio handling
- [x] Implement `render()` with mupdf pixmap
- [x] Implement `resize()` for container changes
- [x] Handle high-DPI displays

---

## Deliverable 2.4: Navigation & Zoom

### Requirements

1. Page navigation (goToPage, next, previous)
2. Zoom controls (setZoom, zoomIn, zoomOut)
3. Fit modes (fitToWidth, fitToPage)
4. Keyboard shortcuts

### Implementation Checklist

- [x] Implement page navigation in PdfEditor
- [x] Implement zoom controls
- [x] Implement fitToWidth calculation
- [x] Implement fitToPage calculation
- [ ] Add keyboard event handling (deferred to Phase 3)

---

## Deliverable 2.5: PdfEditor Facade

### Requirements

1. Coordinate document, file manager, and canvas layer
2. Emit events for state changes
3. Manage editor mode

### Implementation Checklist

- [x] Create `src/core/PdfEditor.ts`
- [x] Wire up PdfDocument
- [x] Wire up FileManager
- [x] Wire up CanvasLayer
- [x] Implement event subscription system
- [x] Implement mode management
- [x] Create factory function in `src/factories.ts`

---

## Deliverable 2.6: Unit Tests

### Implementation Checklist

- [ ] Create `tests/core/document/PdfDocument.test.ts`
- [ ] Create `tests/core/file/FileManager.test.ts`
- [ ] Create `tests/core/layers/CanvasLayer.test.ts`
- [ ] Create `tests/core/PdfEditor.test.ts`

## Phase Completion Criteria

All of the following must be true:

- [x] All core deliverables marked ✅ Done
- [x] Can load and display a PDF file (via library API)
- [x] Navigation between pages works
- [x] Zoom controls work
- [x] `npm run check` passes
- [x] `npm run format` passes
- [x] `npm run build` passes
- [x] `npm run test` passes (helpers tests)
- [ ] Unit tests for Phase 2 components (deferred)
- [ ] PLAN.md updated to show Phase 2 complete
