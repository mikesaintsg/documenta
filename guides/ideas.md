# Documenta - Browser PDF Editor

**Last Updated:** 2026-01-10
**Status:** Planning → Implementation
**Runtime Dependency:** mupdf (latest - v1.26.4)

---

## Progress Tracking

| Phase | Description | Status | Completion | Deliverables |
|-------|-------------|--------|------------|--------------|
| 1 | Project Setup | ⬜ Not Started | 0% | package.json, tsconfig.json, vite.config.ts, eslint.config.ts |
| 2 | Types Definition | ⬜ Not Started | 0% | src/types.ts |
| 3 | Helpers & Utilities | ⬜ Not Started | 0% | src/helpers.ts |
| 4 | Constants | ⬜ Not Started | 0% | src/constants.ts |
| 5 | Core Implementation | ⬜ Not Started | 0% | src/core/pdf/ |
| 6 | Factory Functions | ⬜ Not Started | 0% | src/factories.ts |
| 7 | Barrel Exports | ⬜ Not Started | 0% | src/index.ts |
| 8 | Unit Tests | ⬜ Not Started | 0% | tests/ |
| 9 | Showcase Demo | ⬜ Not Started | 0% | showcase/ |
| 10 | Documentation | ⬜ Not Started | 0% | README.md, guides/ |

---

## Executive Summary

### Goals

1. Create a browser-only PDF editor using the mupdf npm package as the sole runtime dependency
2. Leverage native browser File and Filesystem APIs for file operations
3. Follow strict TypeScript patterns as defined in copilot-instructions.md
4. Provide a clean, type-safe API for PDF manipulation
5. Build a showcase demo demonstrating all features

### Methodology

- **Types-first development**: Define all interfaces before implementation
- **Zero extra dependencies**: Only mupdf as runtime dependency, use native browser APIs
- **Strict typing**: No `any`, no `!`, no unsafe `as` casts
- **ESM-only**: Modern module system with .js extensions
- **Vitest + Playwright**: Browser-based testing

### Core Features

1. **PDF Loading**: Open PDF files via File API or File System Access API
2. **PDF Viewing**: Render PDF pages to canvas
3. **PDF Navigation**: Navigate between pages
4. **PDF Editing**: Add/edit annotations, text, and highlights
5. **PDF Saving**: Save modified PDFs using File System Access API
6. **Page Management**: Add, remove, rotate, and reorder pages

---

## Tier 1: High Reward / Low Complexity ⭐⭐⭐⭐⭐

### 1.1 PDF Document Loading

**Description:** Load PDF documents from local files using File API

**Implementation:**
- Use `<input type="file">` for file selection
- Use File System Access API (`showOpenFilePicker`) for modern browsers
- Load PDF bytes into mupdf Document

**Acceptance Criteria:**
- [ ] Can load PDF from file input
- [ ] Can load PDF using File System Access API
- [ ] Handles loading errors gracefully
- [ ] Validates file type before processing

### 1.2 PDF Page Rendering

**Description:** Render PDF pages to HTML canvas elements

**Implementation:**
- Use mupdf to render pages as images
- Display on canvas with proper scaling
- Support different zoom levels

**Acceptance Criteria:**
- [ ] Renders PDF page to canvas
- [ ] Supports zoom in/out
- [ ] Maintains aspect ratio
- [ ] Handles multi-page documents

### 1.3 PDF Navigation

**Description:** Navigate between pages in a multi-page document

**Implementation:**
- Previous/next page navigation
- Jump to specific page
- Page thumbnails sidebar

**Acceptance Criteria:**
- [ ] Previous/next page buttons work
- [ ] Can jump to any page by number
- [ ] Current page indicator
- [ ] Keyboard navigation support

---

## Tier 2: Medium Reward / Medium Complexity ⭐⭐⭐⭐

### 2.1 PDF Saving

**Description:** Save modified PDF documents

**Implementation:**
- Use File System Access API for saving
- Fallback to download for older browsers
- Support "Save As" functionality

**Acceptance Criteria:**
- [ ] Can save PDF to local file system
- [ ] Fallback download works in older browsers
- [ ] Preserves all modifications
- [ ] Shows save confirmation

### 2.2 Text Annotations

**Description:** Add text annotations to PDF pages

**Implementation:**
- Click to add text annotation
- Edit annotation content
- Move and resize annotations
- Delete annotations

**Acceptance Criteria:**
- [ ] Can add text annotations
- [ ] Can edit existing annotations
- [ ] Can move annotations
- [ ] Can delete annotations
- [ ] Annotations persist after save

### 2.3 Highlight Annotations

**Description:** Highlight text in PDF documents

**Implementation:**
- Select text to highlight
- Choose highlight color
- Remove highlights

**Acceptance Criteria:**
- [ ] Can highlight selected text
- [ ] Multiple color options
- [ ] Can remove highlights
- [ ] Highlights persist after save

---

## Tier 3: Medium Reward / Higher Complexity ⭐⭐⭐

### 3.1 Page Management

**Description:** Add, remove, rotate, and reorder pages

**Implementation:**
- Add blank pages
- Delete existing pages
- Rotate pages (90°, 180°, 270°)
- Drag and drop to reorder

**Acceptance Criteria:**
- [ ] Can add blank pages
- [ ] Can delete pages
- [ ] Can rotate pages
- [ ] Can reorder pages via drag/drop

### 3.2 Drawing Annotations

**Description:** Freehand drawing on PDF pages

**Implementation:**
- Pen tool for drawing
- Configurable stroke width and color
- Eraser functionality

**Acceptance Criteria:**
- [ ] Can draw freehand
- [ ] Configurable pen settings
- [ ] Eraser works correctly
- [ ] Drawings persist after save

### 3.3 Form Filling

**Description:** Fill interactive PDF forms

**Implementation:**
- Detect form fields
- Allow input for text fields
- Support checkboxes and radio buttons
- Flatten forms on save

**Acceptance Criteria:**
- [ ] Detects form fields
- [ ] Can fill text fields
- [ ] Can toggle checkboxes/radios
- [ ] Forms flatten correctly on save

---

## Implementation Phases

### Phase 1: Project Setup

**Tasks:**
- [ ] Create package.json with mupdf dependency and dev dependencies
- [ ] Create tsconfig.json following copilot-instructions.md
- [ ] Create configs/tsconfig.build.json for production builds
- [ ] Create vite.config.ts for development and building
- [ ] Create configs/vite.showcase.config.ts for showcase build
- [ ] Create eslint.config.ts following copilot-instructions.md
- [ ] Create vitest.config.ts with Playwright browser testing
- [ ] Update .gitignore if needed

**Validation:**
```powershell
npm install
npm run check
npm run format
```

### Phase 2: Types Definition (src/types.ts)

**Tasks:**
- [ ] Define `Unsubscribe` type
- [ ] Define `PdfDocumentState` interface (readonly snapshot)
- [ ] Define `PdfEditorHooksInterface` (event subscriptions)
- [ ] Define `PdfEditorOptionsInterface` (extends Partial<Hooks>)
- [ ] Define `PdfEditorInterface` (extends Hooks)
- [ ] Define `PdfPageInterface` for page data
- [ ] Define `AnnotationInterface` and variants
- [ ] Define `ViewportInterface` for rendering configuration
- [ ] Define `FileOperationResult` result type

**Validation:**
```powershell
npm run check
```

### Phase 3: Helpers & Utilities (src/helpers.ts)

**Tasks:**
- [ ] Create `isValidPdfFile` type guard
- [ ] Create `isNonEmptyArrayBuffer` type guard
- [ ] Create `clampPageNumber` helper
- [ ] Create `computeScaledDimensions` helper
- [ ] Create `generatePageId` helper

**Validation:**
```powershell
npm run check
npm test tests/helpers.test.ts
```

### Phase 4: Constants (src/constants.ts)

**Tasks:**
- [ ] Define `DEFAULT_ZOOM` constant
- [ ] Define `MIN_ZOOM` and `MAX_ZOOM` constants
- [ ] Define `ZOOM_STEP` constant
- [ ] Define `DEFAULT_PAGE_GAP` constant
- [ ] Define `ANNOTATION_COLORS` constant

**Validation:**
```powershell
npm run check
```

### Phase 5: Core Implementation

**Tasks:**
- [ ] Create `src/core/pdf/PdfEditor.ts` implementing `PdfEditorInterface`
- [ ] Implement document loading with mupdf
- [ ] Implement page rendering to canvas
- [ ] Implement navigation methods
- [ ] Implement zoom controls
- [ ] Implement annotation management
- [ ] Implement save functionality
- [ ] Create event subscription system

**Validation:**
```powershell
npm run check
npm test
```

### Phase 6: Factory Functions (src/factories.ts)

**Tasks:**
- [ ] Create `createPdfEditor` factory function
- [ ] Document with TSDoc

**Validation:**
```powershell
npm run check
```

### Phase 7: Barrel Exports (src/index.ts)

**Tasks:**
- [ ] Export from factories.ts
- [ ] Export from helpers.ts
- [ ] Export from constants.ts
- [ ] Export types from types.ts

**Validation:**
```powershell
npm run check
npm run build
```

### Phase 8: Unit Tests (tests/)

**Tasks:**
- [ ] Create tests/setup.ts with test utilities
- [ ] Create tests/helpers.test.ts
- [ ] Create tests/core/pdf/PdfEditor.test.ts
- [ ] Create tests/integration/showcase.test.ts

**Validation:**
```powershell
npm test
```

### Phase 9: Showcase Demo (showcase/)

**Tasks:**
- [ ] Create showcase/index.html (minimal)
- [ ] Create showcase/main.ts (entry point)
- [ ] Create showcase/styles.css
- [ ] Build UI for PDF viewing and editing
- [ ] Demonstrate all features from src/

**Validation:**
```powershell
npm run dev
npm run show
```

### Phase 10: Documentation

**Tasks:**
- [ ] Create/update README.md with installation and usage
- [ ] Create guides/pdf-editor.md feature documentation
- [ ] Ensure all public APIs have TSDoc

**Validation:**
- Review documentation for completeness
- Verify all examples are copy-pasteable

---

## Technical Specifications

### Browser APIs Used

- **File API**: `File`, `FileReader`, `Blob`
- **File System Access API**: `showOpenFilePicker`, `showSaveFilePicker`, `FileSystemFileHandle`
- **Canvas API**: Rendering PDF pages
- **DOM API**: UI components

### mupdf Integration

```typescript
// Load document
import * as mupdf from 'mupdf'

const data = await file.arrayBuffer()
const doc = mupdf.Document.openDocument(data, 'application/pdf')
const pageCount = doc.countPages()

// Render page
const page = doc.loadPage(pageNumber)
const pixmap = page.toPixmap(matrix, colorspace)
const imageData = new ImageData(pixmap.getPixels(), pixmap.getWidth(), pixmap.getHeight())

// Save document
const output = doc.saveToBuffer('pdf')
const blob = new Blob([output], { type: 'application/pdf' })
```

### Type Hierarchy

```
PdfDocumentState (readonly snapshot)
├── isLoaded: boolean
├── pageCount: number
├── currentPage: number
├── zoom: number
└── hasUnsavedChanges: boolean

PdfEditorHooksInterface (event subscriptions)
├── onLoad(callback): Unsubscribe
├── onPageChange(callback): Unsubscribe
├── onZoomChange(callback): Unsubscribe
├── onAnnotationAdd(callback): Unsubscribe
├── onAnnotationRemove(callback): Unsubscribe
└── onSave(callback): Unsubscribe

PdfEditorOptionsInterface extends Partial<PdfEditorHooksInterface>
├── container: HTMLElement
└── readonly initialZoom?: number

PdfEditorInterface extends PdfEditorHooksInterface
├── getState(): PdfDocumentState
├── isLoaded(): boolean
├── getCurrentPage(): number
├── getPageCount(): number
├── getZoom(): number
├── setZoom(zoom: number): void
├── load(file: File): Promise<void>
├── loadFromUrl(url: string): Promise<void>
├── renderPage(pageNumber: number, canvas: HTMLCanvasElement): void
├── goToPage(pageNumber: number): void
├── goToPreviousPage(): void
├── goToNextPage(): void
├── zoomIn(): void
├── zoomOut(): void
├── addAnnotation(annotation: AnnotationInterface): void
├── removeAnnotation(id: string): void
├── save(): Promise<void>
├── saveAs(): Promise<void>
└── destroy(): void
```

---

## Notes

- **No additional runtime dependencies**: Only mupdf is allowed
- **Browser-only**: No Node.js code in src/
- **File System Access API**: May not be available in all browsers, provide fallbacks
- **mupdf WebAssembly**: May require specific Vite configuration for WASM loading
- **Showcase**: Must demonstrate ALL features from src/

---

**End of Ideas Document**
