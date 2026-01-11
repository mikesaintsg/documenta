# Phase 1: Foundation

> **Status:** â³ Pending
> **Started:** â€”
> **Target:** â€”
> **Depends on:** None

## Objective

Establish project structure, define all core types, and configure tooling.  By end of phase, the repository should have a working TypeScript build pipeline, ESLint/Prettier configuration, Vitest setup, and all core interfaces defined in `src/types.ts`.

## Deliverables

| # | Deliverable | Status | Assignee |
|---|-------------|--------|----------|
| 1.1 | Project configuration files | â³ Pending | â€” |
| 1.2 | Core type definitions | â³ Pending | â€” |
| 1.3 | Helper utilities | â³ Pending | â€” |
| 1.4 | Constants module | â³ Pending | â€” |
| 1.5 | Barrel exports | â³ Pending | â€” |
| 1.6 | Unit tests for helpers | â³ Pending | â€” |

**Status Legend:**
- âœ… Done
- ðŸ”„ Active
- â³ Pending

## Current Focus:  1.1 Project Configuration Files

### Requirements

1. `package.json` with mupdf as sole runtime dependency
2. `tsconfig.json` with strict settings per copilot-instructions. md
3. `vite.config.ts` for library build
4. `vitest.config. ts` with Playwright browser testing
5. `eslint.config.ts` with formatting rules
6. `.gitignore` for Node.js projects

### Implementation Checklist

- [ ] Create `package.json` with correct scripts
- [ ] Create `tsconfig.json` with strict mode
- [ ] Create `configs/tsconfig.build.json` for production
- [ ] Create `configs/tsconfig. showcase.json` for demo
- [ ] Create `vite.config.ts` for library output
- [ ] Create `configs/vite.showcase.config.ts` for demo build
- [ ] Create `vitest.config.ts` with browser testing
- [ ] Create `eslint.config.ts` with formatting rules
- [ ] Create `.gitignore`

### Acceptance Criteria

```powershell
npm install       # Installs without errors
npm run check     # TypeScript passes
npm run format    # ESLint passes with --fix
npm run test      # Vitest runs (even if no tests yet)
```

---

## Deliverable 1.2: Core Type Definitions

### Requirements

1. All interfaces defined before implementation (types-first)
2. No `any`, no non-null assertions, no unsafe casts
3. Use `readonly` for all public outputs
4. Centralized in `src/types.ts`

### Interface Contract

```typescript
// EditorMode controls which layer is active
export type EditorMode = 'pan' | 'text' | 'draw' | 'form' | 'annotate'

// Unsubscribe pattern for event cleanup
export type Unsubscribe = () => void

// Geometry primitives
export interface Point {
	readonly x: number
	readonly y: number
}

export interface Rectangle {
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
}

// Color representation (0-1 range for mupdf compatibility)
export interface Color {
	readonly r: number
	readonly g: number
	readonly b: number
}

// Page dimensions
export interface PageDimensions {
	readonly width: number
	readonly height: number
}

// Page rotation (degrees clockwise)
export type PageRotation = 0 | 90 | 180 | 270

// Document state snapshot (immutable)
export interface DocumentState {
	readonly isLoaded: boolean
	readonly fileName: string | undefined
	readonly pageCount: number
	readonly currentPage: number
	readonly zoom: number
	readonly mode: EditorMode
	readonly hasUnsavedChanges: boolean
}

// Viewport configuration
export interface Viewport {
	readonly scale: number
	readonly rotation: PageRotation
	readonly offsetX: number
	readonly offsetY: number
}

// Layer interface (common to all layers)
export interface Layer {
	readonly zIndex: number
	isActive(): boolean
	activate(): void
	deactivate(): void
	render(pageNumber: number, scale: number): void
	resize(width: number, height: number): void
	destroy(): void
}

// LayerStack coordinates all layers
export interface LayerStackInterface {
	setMode(mode: EditorMode): void
	getMode(): EditorMode
	getLayer<T extends Layer>(name: string): T | undefined
	render(pageNumber: number, scale: number): void
	resize(width: number, height: number): void
	destroy(): void
}

// Editor event callbacks
export type LoadCallback = (fileName: string, pageCount: number) => void
export type PageChangeCallback = (pageNumber: number) => void
export type ZoomChangeCallback = (zoom:  number) => void
export type ModeChangeCallback = (mode:  EditorMode) => void
export type SaveCallback = (success: boolean) => void
export type ErrorCallback = (error:  Error) => void

// Editor hooks interface
export interface EditorHooksInterface {
	onLoad(callback: LoadCallback): Unsubscribe
	onPageChange(callback: PageChangeCallback): Unsubscribe
	onZoomChange(callback: ZoomChangeCallback): Unsubscribe
	onModeChange(callback:  ModeChangeCallback): Unsubscribe
	onSave(callback: SaveCallback): Unsubscribe
	onError(callback: ErrorCallback): Unsubscribe
}

// Editor options
export interface EditorOptions {
	readonly container: HTMLElement
	readonly initialZoom?:  number
	readonly initialMode?: EditorMode
	readonly enableTextLayer?: boolean
	readonly enableDrawingLayer?: boolean
	readonly enableFormLayer?:  boolean
}

// Main editor interface
export interface EditorInterface extends EditorHooksInterface {
	// State accessors
	getState(): DocumentState
	isLoaded(): boolean
	getCurrentPage(): number
	getPageCount(): number
	getZoom(): number
	getMode(): EditorMode
	hasUnsavedChanges(): boolean
	getFileName(): string | undefined

	// Mode control
	setMode(mode: EditorMode): void

	// Document operations
	load(file: File): Promise<void>
	loadFromBuffer(buffer: ArrayBuffer, fileName?: string): Promise<void>

	// Page rendering
	renderPage(pageNumber:  number): void
	getPageDimensions(pageNumber: number): PageDimensions

	// Navigation
	goToPage(pageNumber: number): void
	goToPreviousPage(): void
	goToNextPage(): void

	// Zoom
	setZoom(zoom:  number): void
	zoomIn(): void
	zoomOut(): void
	resetZoom(): void
	fitToWidth(): void
	fitToPage(): void

	// Save/Export
	save(): Promise<void>
	saveAs(): Promise<void>
	download(fileName?:  string): void
	toArrayBuffer(): ArrayBuffer

	// Lifecycle
	destroy(): void
}
```

### Implementation Checklist

- [ ] Create `src/types.ts`
- [ ] Define geometry types (Point, Rectangle, Color)
- [ ] Define page types (PageDimensions, PageRotation)
- [ ] Define state types (DocumentState, Viewport)
- [ ] Define mode type (EditorMode)
- [ ] Define layer interfaces (Layer, LayerStackInterface)
- [ ] Define event callbacks and hooks
- [ ] Define editor options and interface
- [ ] Add TSDoc comments to all exports

### Acceptance Criteria

```powershell
npm run check  # Types compile without errors
```

---

## Deliverable 1.3: Helper Utilities

### Requirements

1. Pure utility functions with no side effects
2. Type guards for runtime validation
3. Coordinate and color conversion helpers
4. File system detection helpers

### Implementation Checklist

- [ ] Create `src/helpers.ts`
- [ ] Implement `clamp(value, min, max)`
- [ ] Implement `generateId()` using crypto. randomUUID
- [ ] Implement `isValidPdfFile(file)` type guard
- [ ] Implement `isNonEmptyArrayBuffer(buffer)` type guard
- [ ] Implement `clampPageNumber(page, max)`
- [ ] Implement `clampZoom(zoom, min, max)`
- [ ] Implement `computeScaledDimensions(width, height, scale)`
- [ ] Implement `colorToCss(color, opacity? )`
- [ ] Implement `cssToColor(cssString)`
- [ ] Implement `hasFileSystemAccess()` detection
- [ ] Implement `downloadBlob(data, fileName, mimeType)`

### Acceptance Criteria

```typescript
describe('helpers', () => {
	it('clamps values to range', () => {
		expect(clamp(5, 0, 10)).toBe(5)
		expect(clamp(-5, 0, 10)).toBe(0)
		expect(clamp(15, 0, 10)).toBe(10)
	})

	it('validates PDF files', () => {
		const pdf = new File([''], 'test.pdf', { type: 'application/pdf' })
		const txt = new File([''], 'test.txt', { type: 'text/plain' })
		expect(isValidPdfFile(pdf)).toBe(true)
		expect(isValidPdfFile(txt)).toBe(false)
	})

	it('converts colors to CSS', () => {
		expect(colorToCss({ r: 1, g: 0, b: 0 })).toBe('rgb(255, 0, 0)')
		expect(colorToCss({ r: 1, g: 0, b: 0 }, 0.5)).toBe('rgba(255, 0, 0, 0.5)')
	})
})
```

---

## Deliverable 1.4: Constants Module

### Requirements

1. All magic numbers extracted to named constants
2. Use `as const` for literal inference
3. Export color presets for annotations

### Implementation Checklist

- [ ] Create `src/constants.ts`
- [ ] Define zoom constants (DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP)
- [ ] Define page size constants (PAGE_SIZE_LETTER, PAGE_SIZE_A4)
- [ ] Define drawing constants (DEFAULT_PEN_WIDTH, DEFAULT_HIGHLIGHTER_WIDTH)
- [ ] Define color constants (COLOR_YELLOW, COLOR_RED, etc.)
- [ ] Define z-index constants for layer ordering
- [ ] Define touch constants (MIN_TOUCH_TARGET, GESTURE_THRESHOLD)

---

## Deliverable 1.5: Barrel Exports

### Requirements

1. Single entry point via `src/index.ts`
2. Export all public APIs
3. Re-export types with `export type`

### Implementation Checklist

- [ ] Create `src/index.ts`
- [ ] Export from helpers. ts
- [ ] Export from constants.ts
- [ ] Export types from types.ts

---

## Deliverable 1.6: Unit Tests for Helpers

### Requirements

1. Mirror source structure in tests folder
2. Use Vitest for testing
3. Fast, deterministic tests

### Implementation Checklist

- [ ] Create `tests/setup.ts` with test utilities
- [ ] Create `tests/helpers.test.ts`
- [ ] Test all clamp functions
- [ ] Test all type guards
- [ ] Test color conversion functions
- [ ] Test coordinate helpers

## Phase Completion Criteria

All of the following must be true: 

- [ ] All deliverables marked âœ… Done
- [ ] `npm run check` passes
- [ ] `npm run test` passes
- [ ] `npm run format` passes
- [ ] No `it. todo()` remaining in phase scope
- [ ] PLAN.md updated to show Phase 1 complete
