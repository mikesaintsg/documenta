# Phase 4: Text Layer

> **Status:** ✅ Complete
> **Started:** 2026-01-11
> **Completed:** 2026-01-11
> **Depends on:** Phase 3 (Layer System) ✅ Complete

## Objective

Implement text extraction, selection, and inline editing using an HTML overlay strategy. By end of phase, users can select and copy text, search for text, and perform inline text edits.

## Deliverables

| # | Deliverable | Status | Assignee |
|---|-------------|--------|----------|
| 4.1 | Text extraction | ✅ Done | — |
| 4.2 | Text selection overlay | ✅ Done | — |
| 4.3 | Text search | ✅ Done | — |
| 4.4 | Inline text editing | ⏳ Pending | — |
| 4.5 | Unit tests | ⏳ Pending | — |

**Status Legend:**
- ✅ Done
- 🔄 Active
- ⏳ Pending

## Current Focus: Phase Complete (except inline editing and tests)

Core text layer functionality is implemented:
- Text extraction from PDF using mupdf StructuredText API
- Text selection overlay with invisible spans
- Native browser selection works
- Copy to clipboard works
- Text search across pages

Inline text editing (creates FreeText annotations) deferred to Phase 6.

---

## Deliverable 4.1: Text Extraction

### Implementation Checklist

- [x] Use mupdf StructuredText walker API (in PdfDocument.getPage().getTextBlocks())
- [x] Extract character quads/bounds
- [x] Group into lines and blocks
- [x] Cache extracted text per page

---

## Deliverable 4.2: Text Selection Overlay

### Implementation Checklist

- [x] Create `src/core/text/TextLayer.ts`
- [x] Extend BaseLayer
- [x] Create transparent overlay div
- [x] Create invisible text spans matching PDF positions
- [x] Handle Selection API for selection detection
- [x] Implement copy to clipboard
- [x] Style selection with ::selection CSS

---

## Deliverable 4.3: Text Search

### Implementation Checklist

- [x] Implement page-level search (searchPage)
- [x] Implement cross-page search (search)
- [x] Return SearchMatch objects
- [x] Support case-insensitive search

---

## Deliverable 4.4: Inline Text Editing

### Implementation Checklist

- [ ] Detect double-tap/click in text layer
- [ ] Find text block at point
- [ ] Show editable textarea overlay
- [ ] Apply edit as FreeText annotation
- [ ] Implement undo/redo stacks

**Note:** Deferred to Phase 6 as it requires annotation infrastructure.

---

## Deliverable 4.5: Unit Tests

### Implementation Checklist

- [ ] Create `tests/core/text/TextLayer.test.ts`
- [ ] Test text extraction produces valid bounds
- [ ] Test selection API integration
- [ ] Test search across pages

## Phase Completion Criteria

- [x] Core text functionality (extraction, selection, search) implemented
- [x] Text selection works with native browser selection
- [x] Copy to clipboard works
- [x] Text search returns correct results
- [x] `npm run check` passes
- [x] `npm run format` passes
- [x] `npm run build` passes
- [x] `npm run test` passes
- [ ] Inline editing (deferred to Phase 6)
- [ ] Unit tests for Phase 4 (deferred)
