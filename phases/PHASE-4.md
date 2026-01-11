# Phase 4: Text Layer

> **Status:** ⏳ Pending
> **Started:** —
> **Target:** —
> **Depends on:** Phase 3 (Layer System) ⏳ Pending

## Objective

Implement text extraction, selection, and inline editing using an HTML overlay strategy. By end of phase, users can select and copy text, search for text, and perform inline text edits.

## Deliverables

| # | Deliverable | Status | Assignee |
|---|-------------|--------|----------|
| 4.1 | Text extraction | ⏳ Pending | — |
| 4.2 | Text selection overlay | ⏳ Pending | — |
| 4.3 | Text search | ⏳ Pending | — |
| 4.4 | Inline text editing | ⏳ Pending | — |
| 4.5 | Unit tests | ⏳ Pending | — |

**Status Legend:**
- ✅ Done
- 🔄 Active
- ⏳ Pending

## Current Focus: 4.1 Text Extraction

### Requirements

1. Extract structured text from mupdf StructuredText API
2. Character-level bounding boxes for overlay positioning
3. Line and block grouping

### Interface Contract

```typescript
export interface TextCharacter {
	readonly char: string
	readonly bounds: Rectangle
	readonly fontSize: number
	readonly fontName: string
	readonly color: Color
}

export interface TextLine {
	readonly id: string
	readonly bounds: Rectangle
	readonly characters: readonly TextCharacter[]
}

export interface TextBlock {
	readonly id: string
	readonly bounds: Rectangle
	readonly lines: readonly TextLine[]
}

export interface TextLayerData {
	readonly pageNumber: number
	readonly blocks: readonly TextBlock[]
}

export interface TextExtractorInterface {
	extractPage(pageNumber: number): TextLayerData
	getPlainText(pageNumber: number): string
}
```

### Implementation Checklist

- [ ] Create `src/core/text/TextExtractor.ts`
- [ ] Use mupdf StructuredText walker API
- [ ] Extract character quads/bounds
- [ ] Group into lines and blocks
- [ ] Cache extracted text per page

---

## Deliverable 4.2: Text Selection Overlay

### Requirements

1. Transparent HTML overlay positioned over canvas
2. Invisible text spans for native selection
3. Visual selection highlight
4. Copy to clipboard support

### Implementation Strategy

```
┌───────────────────────────────────────────┐
│ Text Overlay (pointer-events: auto in text mode)
│ ┌─────────────────────────────────────────┐
│ │ <span> invisible text matching PDF      │
│ │ Native browser selection works          │
│ │ Selection highlight via :: selection CSS │
│ └─────────────────────────────────────────┘
└───────────────────────────────────────────┘
```

### Interface Contract

```typescript
export interface TextSelection {
	readonly pageNumber: number
	readonly startIndex: number
	readonly endIndex: number
	readonly text: string
	readonly bounds: readonly Rectangle[]
}

export type TextSelectionCallback = (selection: TextSelection | null) => void

export interface TextLayerInterface extends Layer {
	// Text access
	getPlainText(pageNumber: number): string
	getTextBlocks(pageNumber:  number): readonly TextBlock[]

	// Selection
	getSelection(): TextSelection | null
	clearSelection(): void
	copySelection(): Promise<void>
	onSelectionChange(callback: TextSelectionCallback): Unsubscribe

	// Rendering
	setDocument(doc: PdfDocumentInterface): void
}
```

### Implementation Checklist

- [ ] Create `src/core/text/TextLayer.ts`
- [ ] Extend BaseLayer
- [ ] Create transparent overlay div
- [ ] Create invisible text spans matching PDF positions
- [ ] Handle Selection API for selection detection
- [ ] Implement copy to clipboard
- [ ] Style selection with :: selection CSS

### Mobile Considerations

- Use touch-action: none on overlay when in text mode
- Handle mobile text selection gestures
- Long-press to select word on mobile
- Show mobile selection handles

---

## Deliverable 4.3: Text Search

### Requirements

1. Search across all pages
2. Return match locations with bounds
3. Highlight matches

### Interface Contract

```typescript
export interface SearchMatch {
	readonly pageNumber: number
	readonly bounds: Rectangle
	readonly text: string
}

export interface TextSearchInterface {
	search(query: string): readonly SearchMatch[]
	searchPage(pageNumber:  number, query: string): readonly SearchMatch[]
}
```

### Implementation Checklist

- [ ] Create `src/core/text/TextSearch.ts`
- [ ] Implement page-level search
- [ ] Implement cross-page search
- [ ] Return precise bounds for highlights
- [ ] Support case-insensitive search

---

## Deliverable 4.4: Inline Text Editing

### Requirements

1. Double-tap/double-click to enter edit mode
2. Replace text with editable input
3. Apply edit as FreeText annotation
4. Undo/redo support

### Implementation Strategy

```
┌───────────────────────────────────────────┐
│ Edit Mode:                                  │
│ ┌─────────────────────────────────────────┐
│ │ <textarea> positioned over text region  │
│ │ Auto-sized to match original text       │
│ │ Enter to apply, Escape to cancel        │
│ └─────────────────────────────────────────┘
└───────────────────────────────────────────┘
```

### Interface Contract

```typescript
export interface TextEdit {
	readonly id: string
	readonly pageNumber: number
	readonly bounds: Rectangle
	readonly originalText: string
	readonly newText: string
	readonly timestamp: Date
}

export type TextEditCallback = (edit: TextEdit) => void

export interface TextEditorInterface {
	startEditing(pageNumber: number, point: Point): void
	applyEdit(): void
	cancelEdit(): void
	undoEdit(): void
	redoEdit(): void
	onEdit(callback: TextEditCallback): Unsubscribe
}
```

### Implementation Checklist

- [ ] Create `src/core/text/TextEditor.ts`
- [ ] Detect double-tap/click in text layer
- [ ] Find text block at point
- [ ] Show editable textarea overlay
- [ ] Apply edit as FreeText annotation
- [ ] Implement undo/redo stacks

---

## Deliverable 4.5: Unit Tests

### Implementation Checklist

- [ ] Create `tests/core/text/TextExtractor.test.ts`
- [ ] Create `tests/core/text/TextLayer.test.ts`
- [ ] Create `tests/core/text/TextSearch. test.ts`
- [ ] Create `tests/core/text/TextEditor.test.ts`
- [ ] Test text extraction produces valid bounds
- [ ] Test selection API integration
- [ ] Test search across pages

## Phase Completion Criteria

All of the following must be true: 

- [ ] All deliverables marked ✅ Done
- [ ] Text selection works with native browser selection
- [ ] Copy to clipboard works
- [ ] Text search returns correct results
- [ ] Inline editing creates FreeText annotations
- [ ] Mobile text selection works
- [ ] `npm run check` passes
- [ ] `npm run test` passes
- [ ] PLAN.md updated to show Phase 4 complete