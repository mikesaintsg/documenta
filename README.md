# Documenta

A browser-only PDF editor built with [mupdf](https://www.npmjs.com/package/mupdf) and native browser APIs.

![Documenta PDF Editor](https://github.com/user-attachments/assets/06e01559-3a72-4b63-a297-20b6b7c32d66)

## Features

- 📄 **PDF Loading** - Open PDF files via File API or File System Access API
- 🖼️ **PDF Rendering** - High-quality page rendering to canvas
- 🔍 **Zoom Controls** - Zoom in/out, fit to width, fit to page
- 📑 **Navigation** - Page navigation with keyboard shortcuts
- 💾 **Save/Download** - Save changes using File System Access API or download
- ✏️ **Annotations** - Add text, highlight, ink, and shape annotations

## Installation

```bash
npm install documenta
```

## Quick Start

```typescript
import { createPdfEditor } from 'documenta'

// Create the editor
const container = document.getElementById('pdf-container')
const editor = createPdfEditor({
  container,
  initialZoom: 1.0,
  onLoad: (fileName, pageCount) => {
    console.log(`Loaded ${fileName} with ${pageCount} pages`)
  },
  onError: (error) => {
    console.error('Error:', error)
  },
})

// Load a PDF file
const fileInput = document.querySelector('input[type="file"]')
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (file) {
    await editor.load(file)
  }
})

// Render the current page
const canvas = document.querySelector('canvas')
editor.renderPage(editor.getCurrentPage(), canvas)

// Navigate pages
editor.goToNextPage()
editor.goToPreviousPage()
editor.goToPage(5)

// Zoom
editor.zoomIn()
editor.zoomOut()
editor.setZoom(1.5)

// Save
await editor.save()     // Using File System Access API
editor.download()       // Fallback download

// Clean up
editor.destroy()
```

## API Reference

### `createPdfEditor(options)`

Creates a new PDF editor instance.

**Options:**

| Property | Type | Description |
|----------|------|-------------|
| `container` | `HTMLElement` | Required. Container element for the PDF editor |
| `initialZoom` | `number` | Optional. Initial zoom level (default: 1.0) |
| `defaultAuthor` | `string` | Optional. Default author for annotations |
| `onLoad` | `function` | Optional. Callback when document loads |
| `onPageChange` | `function` | Optional. Callback when page changes |
| `onZoomChange` | `function` | Optional. Callback when zoom changes |
| `onSave` | `function` | Optional. Callback when save completes |
| `onError` | `function` | Optional. Callback on error |

### Editor Methods

#### Document Operations
- `load(file: File): Promise<void>` - Load PDF from File object
- `loadFromBuffer(buffer: ArrayBuffer, fileName?: string): Promise<void>` - Load PDF from buffer
- `renderPage(pageNumber: number, canvas: HTMLCanvasElement): void` - Render page to canvas
- `getPageDimensions(pageNumber: number): PageDimensions` - Get page dimensions

#### Navigation
- `goToPage(pageNumber: number): void` - Go to specific page
- `goToPreviousPage(): void` - Go to previous page
- `goToNextPage(): void` - Go to next page

#### Zoom
- `setZoom(zoom: number): void` - Set zoom level
- `zoomIn(): void` - Zoom in by one step
- `zoomOut(): void` - Zoom out by one step
- `resetZoom(): void` - Reset to default zoom
- `fitToWidth(): void` - Fit page to container width
- `fitToPage(): void` - Fit entire page in container

#### Annotations
- `addAnnotation(data): AnyAnnotation` - Add annotation
- `updateAnnotation(id, updates): void` - Update annotation
- `removeAnnotation(id): void` - Remove annotation
- `getAnnotations(pageNumber): readonly AnyAnnotation[]` - Get page annotations

#### Save/Export
- `save(): Promise<void>` - Save using File System Access API
- `saveAs(): Promise<void>` - Save to new file
- `download(fileName?: string): void` - Download as file
- `toArrayBuffer(): ArrayBuffer` - Get PDF as ArrayBuffer

#### State
- `getState(): PdfDocumentState` - Get current state
- `isLoaded(): boolean` - Check if document is loaded
- `getCurrentPage(): number` - Get current page number
- `getPageCount(): number` - Get total pages
- `getZoom(): number` - Get current zoom
- `hasUnsavedChanges(): boolean` - Check for unsaved changes

#### Lifecycle
- `destroy(): void` - Clean up resources

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `PageUp` | Previous page |
| `→` / `PageDown` | Next page |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom |

## Browser Support

Requires a modern browser with support for:
- ES2020+ features
- Top-level await
- Canvas API
- File API
- WebAssembly

For the best experience, use a browser that supports the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) (Chrome, Edge).

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build library
npm run build

# Run tests
npm test

# Type check
npm run check

# Lint and format
npm run format

# Build showcase demo
npm run show
```

## License

MIT
