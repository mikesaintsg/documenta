# Phase 2: Core Document

> **Status:** ⏳ Pending
> **Started:** —
> **Target:** —
> **Depends on:** Phase 1 (Foundation) ⏳ Pending

## Objective

Implement PDF document loading, rendering, navigation, and zoom.  By end of phase, users can load a PDF file, view pages on canvas, navigate between pages, and control zoom level.

## Deliverables

| # | Deliverable | Status | Assignee |
|---|-------------|--------|----------|
| 2.1 | PdfDocument wrapper | ⏳ Pending | — |
| 2.2 | FileManager (load/save) | ⏳ Pending | — |
| 2.3 | CanvasLayer (rendering) | ⏳ Pending | — |
| 2.4 | Navigation & Zoom | ⏳ Pending | — |
| 2.5 | PdfEditor facade | ⏳ Pending | — |
| 2.6 | Unit tests | ⏳ Pending | — |

**Status Legend:**
- ✅ Done
- 🔄 Active
- ⏳ Pending

## Current Focus: 2.1 PdfDocument Wrapper

### Requirements

1. Wrap mupdf. PDFDocument with type-safe interface
2. Handle WebAssembly initialization
3. Provide page access and metadata

### Interface Contract

```typescript
// From src/types.ts
export interface PdfDocumentInterface {
	// State
	isLoaded(): boolean
	getPageCount(): number
	getFileName(): string | undefined

	// Loading
	loadFromBuffer(buffer:  ArrayBuffer, fileName?:  string): Promise<void>

	// Page access
	getPage(pageNumber: number): PdfPageInterface
	getPageDimensions(pageNumber:  number): PageDimensions
	getPageRotation(pageNumber: number): PageRotation

	// Export
	toArrayBuffer(): ArrayBuffer

	// Cleanup
	destroy(): void
}

export interface PdfPageInterface {
	readonly pageNumber: number
	readonly width: number
	readonly height: number
	readonly rotation: PageRotation

	render(ctx: CanvasRenderingContext2D, scale: number): void
	getText(): string
	getTextBlocks(): readonly TextBlock[]
	destroy(): void
}
```

### Implementation Checklist

- [ ] Create `src/core/document/PdfDocument.ts`
- [ ] Implement mupdf initialization
- [ ] Implement `loadFromBuffer()`
- [ ] Implement `getPage()` with caching
- [ ] Implement `getPageDimensions()`
- [ ] Implement `toArrayBuffer()`
- [ ] Implement `destroy()` cleanup

### Acceptance Criteria

```typescript
describe('PdfDocument', () => {
	it('loads PDF from ArrayBuffer', async () => {
		const doc = new PdfDocument()
		await doc.loadFromBuffer(samplePdfBuffer, 'test.pdf')

		expect(doc. isLoaded()).toBe(true)
		expect(doc. getPageCount()).toBeGreaterThan(0)
		expect(doc.getFileName()).toBe('test.pdf')
	})

	it('provides page dimensions', async () => {
		const doc = new PdfDocument()
		await doc.loadFromBuffer(samplePdfBuffer)

		const dims = doc.getPageDimensions(1)
		expect(dims.width).toBeGreaterThan(0)
		expect(dims.height).toBeGreaterThan(0)
	})
})
```

---

## Deliverable 2.2: FileManager

### Requirements

1. Load PDF from File object
2. Load PDF from URL/fetch
3. Save using File System Access API
4. Fallback download for older browsers

### Interface Contract

```typescript
export interface FileManagerInterface {
	loadFile(file: File): Promise<ArrayBuffer>
	loadUrl(url: string): Promise<ArrayBuffer>
	save(data: ArrayBuffer, handle?:  FileSystemFileHandle): Promise<FileSystemFileHandle | undefined>
	saveAs(data: ArrayBuffer, suggestedName:  string): Promise<FileSystemFileHandle | undefined>
	download(data: ArrayBuffer, fileName: string): void
}
```

### Implementation Checklist

- [ ] Create `src/core/file/FileManager.ts`
- [ ] Implement `loadFile()` using File. arrayBuffer()
- [ ] Implement `loadUrl()` using fetch
- [ ] Implement `save()` with File System Access API
- [ ] Implement `saveAs()` with showSaveFilePicker
- [ ] Implement `download()` fallback with Blob URL

---

## Deliverable 2.3: CanvasLayer

### Requirements

1. Render PDF pages to canvas with proper scaling
2. Handle devicePixelRatio for crisp rendering
3. Support zoom levels
4. Manage canvas sizing

### Interface Contract

```typescript
export interface CanvasLayerInterface extends Layer {
	getCanvas(): HTMLCanvasElement
	setDocument(doc: PdfDocumentInterface): void
	render(pageNumber: number, scale: number): void
}
```

### Implementation Checklist

- [ ] Create `src/core/layers/CanvasLayer.ts`
- [ ] Create canvas element in constructor
- [ ] Implement proper devicePixelRatio handling
- [ ] Implement `render()` with mupdf pixmap
- [ ] Implement `resize()` for container changes
- [ ] Handle high-DPI displays

### Mobile Considerations

- Canvas size must account for devicePixelRatio
- Use CSS sizing separate from canvas resolution
- Avoid canvas sizes that exceed mobile GPU limits

---

## Deliverable 2.4: Navigation & Zoom

### Requirements

1. Page navigation (goToPage, next, previous)
2. Zoom controls (setZoom, zoomIn, zoomOut)
3. Fit modes (fitToWidth, fitToPage)
4. Keyboard shortcuts

### Implementation Checklist

- [ ] Implement page navigation in PdfEditor
- [ ] Implement zoom controls
- [ ] Implement fitToWidth calculation
- [ ] Implement fitToPage calculation
- [ ] Add keyboard event handling

---

## Deliverable 2.5: PdfEditor Facade

### Requirements

1. Coordinate document, file manager, and canvas layer
2. Emit events for state changes
3. Manage editor mode

### Implementation Checklist

- [ ] Create `src/core/PdfEditor.ts`
- [ ] Wire up PdfDocument
- [ ] Wire up FileManager
- [ ] Wire up CanvasLayer
- [ ] Implement event subscription system
- [ ] Implement mode management
- [ ] Create factory function in `src/factories. ts`

---

## Deliverable 2.6: Unit Tests

### Implementation Checklist

- [ ] Create `tests/core/document/PdfDocument. test.ts`
- [ ] Create `tests/core/file/FileManager.test.ts`
- [ ] Create `tests/core/layers/CanvasLayer. test.ts`
- [ ] Create `tests/core/PdfEditor.test. ts`

## Phase Completion Criteria

All of the following must be true: 

- [ ] All deliverables marked ✅ Done
- [ ] Can load and display a PDF file
- [ ] Navigation between pages works
- [ ] Zoom controls work
- [ ] `npm run check` passes
- [ ] `npm run test` passes
- [ ] PLAN.md updated to show Phase 2 complete