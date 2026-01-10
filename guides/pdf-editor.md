# PDF Editor Guide

This guide covers the core features and usage patterns for the Documenta PDF editor.

## Overview

Documenta is a browser-only PDF editor built on top of [mupdf.js](https://mupdf.com/mupdf-js), the official JavaScript/WebAssembly bindings for the MuPDF library. It provides a clean, type-safe API for:

- Loading and rendering PDF documents
- Navigation and zoom controls
- Adding and managing annotations
- **Text extraction and inline editing (via overlay strategy)**
- Saving and exporting documents

## Architecture

The library follows a types-first development approach:

```
src/
├── types.ts         # All interfaces and types
├── helpers.ts       # Utility functions and type guards
├── constants.ts     # Default values and colors
├── factories.ts     # Factory function for creating editors
├── core/
│   ├── pdf/
│   │   └── PdfEditor.ts  # Core PDF implementation
│   └── text/
│       └── TextLayer.ts  # Text layer for OCR and inline editing
└── index.ts         # Barrel exports
```

## Loading Documents

### From File Input

```typescript
const fileInput = document.querySelector('input[type="file"]')
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (file) {
    await editor.load(file)
  }
})
```

### From ArrayBuffer

```typescript
const response = await fetch('/sample.pdf')
const buffer = await response.arrayBuffer()
await editor.loadFromBuffer(buffer, 'sample.pdf')
```

## Rendering Pages

PDF pages are rendered to HTML canvas elements:

```typescript
const canvas = document.createElement('canvas')
container.appendChild(canvas)

// Render current page
editor.renderPage(editor.getCurrentPage(), canvas)

// Re-render when page or zoom changes
editor.onPageChange(() => {
  editor.renderPage(editor.getCurrentPage(), canvas)
})

editor.onZoomChange(() => {
  editor.renderPage(editor.getCurrentPage(), canvas)
})
```

The canvas is automatically sized based on the page dimensions and current zoom level, accounting for device pixel ratio for crisp rendering on high-DPI displays.

## Navigation

```typescript
// Go to specific page (1-indexed)
editor.goToPage(5)

// Navigate relatively
editor.goToNextPage()
editor.goToPreviousPage()

// Get current position
const current = editor.getCurrentPage()  // e.g., 5
const total = editor.getPageCount()      // e.g., 10
```

## Zoom Controls

```typescript
// Set exact zoom level (0.25 to 5.0)
editor.setZoom(1.5)

// Zoom by steps (0.25 increments)
editor.zoomIn()   // 1.0 → 1.25
editor.zoomOut()  // 1.0 → 0.75

// Fit modes
editor.fitToWidth()  // Scale to container width
editor.fitToPage()   // Scale to fit entire page

// Reset to default
editor.resetZoom()   // Back to 1.0
```

## Annotations

### Adding Annotations

```typescript
import type { CreateTextAnnotationData } from 'documenta'

// Add a text annotation (sticky note)
const annotation = editor.addAnnotation({
  type: 'Text',
  pageNumber: 1,
  bounds: { x: 100, y: 100, width: 20, height: 20 },
  contents: 'This is a note',
  color: { r: 1, g: 0.92, b: 0.23 },  // Yellow
})

// Add a highlight annotation
editor.addAnnotation({
  type: 'Highlight',
  pageNumber: 1,
  bounds: { x: 50, y: 700, width: 200, height: 20 },
  quadPoints: [
    { x: 50, y: 700 },
    { x: 250, y: 700 },
    { x: 50, y: 720 },
    { x: 250, y: 720 },
  ],
})

// Add an ink annotation (freehand drawing)
editor.addAnnotation({
  type: 'Ink',
  pageNumber: 1,
  bounds: { x: 100, y: 400, width: 200, height: 100 },
  inkList: [
    [{ x: 100, y: 400 }, { x: 150, y: 450 }, { x: 200, y: 400 }],
    [{ x: 150, y: 420 }, { x: 180, y: 480 }],
  ],
  strokeWidth: 2,
  color: { r: 1, g: 0, b: 0 },  // Red
})
```

### Managing Annotations

```typescript
// Get all annotations on a page
const annotations = editor.getAnnotations(1)

// Get annotation by ID
const annotation = editor.getAnnotationById('annot-123')

// Update annotation
editor.updateAnnotation('annot-123', {
  contents: 'Updated note content',
})

// Remove annotation
editor.removeAnnotation('annot-123')
```

## Saving Documents

### Using File System Access API

When available (Chrome, Edge), the File System Access API provides a native save dialog:

```typescript
// Save to existing file (or prompt for new)
await editor.save()

// Always prompt for new file
await editor.saveAs()
```

### Fallback Download

For browsers without File System Access API:

```typescript
// Download with automatic filename
editor.download()

// Download with custom filename
editor.download('my-document.pdf')
```

### Export to ArrayBuffer

```typescript
const buffer = editor.toArrayBuffer()
// Use buffer for upload, storage, etc.
```

## Event Handling

The editor uses a subscription pattern for events:

```typescript
// Subscribe to events
const unsubscribeLoad = editor.onLoad((fileName, pageCount) => {
  console.log(`Loaded: ${fileName} (${pageCount} pages)`)
})

const unsubscribePage = editor.onPageChange((pageNumber) => {
  console.log(`Page: ${pageNumber}`)
})

const unsubscribeZoom = editor.onZoomChange((zoom) => {
  console.log(`Zoom: ${Math.round(zoom * 100)}%`)
})

const unsubscribeSave = editor.onSave((success) => {
  console.log(success ? 'Saved!' : 'Save failed')
})

const unsubscribeError = editor.onError((error) => {
  console.error('Error:', error.message)
})

// Unsubscribe when done
unsubscribeLoad()
unsubscribePage()
unsubscribeZoom()
unsubscribeSave()
unsubscribeError()
```

## State Management

```typescript
// Get complete state snapshot
const state = editor.getState()
// {
//   isLoaded: true,
//   fileName: 'document.pdf',
//   pageCount: 10,
//   currentPage: 1,
//   zoom: 1.0,
//   hasUnsavedChanges: false
// }

// Individual state checks
if (editor.isLoaded()) {
  const page = editor.getCurrentPage()
  const zoom = editor.getZoom()
  const unsaved = editor.hasUnsavedChanges()
}
```

## Cleanup

Always destroy the editor when done to release resources:

```typescript
// Clean up when component unmounts or page closes
editor.destroy()
```

## Constants

The library exports useful constants:

```typescript
import {
  DEFAULT_ZOOM,        // 1.0
  MIN_ZOOM,            // 0.25
  MAX_ZOOM,            // 5.0
  ZOOM_STEP,           // 0.25
  COLOR_YELLOW,        // Default highlight color
  COLOR_RED,           // Default ink color
  COLOR_BLUE,          // Default shape color
  ANNOTATION_COLORS,   // All available colors
} from 'documenta'
```

## Helper Functions

```typescript
import {
  isValidPdfFile,      // Check if File is a PDF
  hasFileSystemAccess, // Check for File System Access API
  colorToCss,          // Convert annotation color to CSS
  cssToColor,          // Parse CSS color to annotation color
} from 'documenta'

// Validate file before loading
if (isValidPdfFile(file)) {
  await editor.load(file)
}

// Check API availability
if (hasFileSystemAccess()) {
  await editor.save()
} else {
  editor.download()
}
```

## Text Layer (OCR and Inline Editing)

The Text Layer provides text extraction, selection, and inline editing using an overlay strategy.

### Strategy: HTML Overlay

The text layer uses a transparent HTML overlay on top of the PDF canvas:

- **Canvas Layer**: High-quality PDF rendering via mupdf
- **Overlay Layer**: Handles text selection and editing with native browser behavior

This approach provides:
- Native browser text selection
- Accessibility support
- Precise character positioning from mupdf's StructuredText API
- Edits persist as standard PDF FreeText annotations

### Getting the Text Layer

```typescript
const textLayer = editor.getTextLayer()
if (textLayer) {
  // Text layer is available after document loads
}
```

### Text Extraction

```typescript
// Get plain text from a page
const text = editor.getPageText(1)
console.log(text)

// Get structured text layer with character positions
const layer = textLayer.extractTextLayer(1)
// {
//   pageNumber: 1,
//   blocks: [
//     {
//       id: 'block-1',
//       bounds: { x, y, width, height },
//       lines: [
//         {
//           id: 'line-1',
//           chars: [{ char: 'H', x, y, width, height, fontSize, fontName, color }]
//         }
//       ]
//     }
//   ]
// }
```

### Text Search

```typescript
// Search across all pages
const results = editor.searchText('keyword')
// [{ pageNumber: 1, bounds: { x, y, width, height } }, ...]

if (results.length > 0) {
  // Navigate to first result
  editor.goToPage(results[0].pageNumber)
}
```

### Text Selection Mode

```typescript
// Enable selection mode
textLayer.setEditMode('select')

// Listen for selection changes
textLayer.onTextSelect((selection) => {
  if (selection) {
    console.log('Selected:', selection.selectedText)
  }
})

// Copy selection to clipboard
await textLayer.copySelection()

// Clear selection
textLayer.clearSelection()
```

### Inline Text Editing Mode

```typescript
// Enable edit mode
textLayer.setEditMode('edit')

// Listen for edits
textLayer.onTextEdit((edit) => {
  console.log(`Changed "${edit.originalText}" to "${edit.newText}"`)
})

// Double-click on text to start editing
// Press Enter to apply, Escape to cancel

// Undo/Redo
textLayer.undoEdit()
textLayer.redoEdit()
```

### Rendering the Text Layer

```typescript
// Render text layer overlay on a container
const pageWrapper = document.getElementById('page-wrapper')
textLayer.render(pageNumber, pageWrapper, editor.getZoom())

// Update when zoom changes
editor.onZoomChange((zoom) => {
  textLayer.update(zoom)
})
```

### Text Layer Options

```typescript
const textLayer = new TextLayerImpl(document, {
  enableSelection: true,      // Enable text selection
  enableEditing: true,        // Enable inline editing
  selectionColor: { r: 0.2, g: 0.5, b: 1.0 },  // Selection highlight color
  onTextSelect: (selection) => { ... },
  onTextEdit: (edit) => { ... },
})
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl/Cmd + C` | Copy selected text |
| `Ctrl/Cmd + F` | Search text |
| `Enter` | Apply edit |
| `Escape` | Cancel edit |
| `Ctrl/Cmd + Z` | Undo edit |
| `Ctrl/Cmd + Shift + Z` | Redo edit |
