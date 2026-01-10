/**
 * Documenta - Factory Functions
 * @module factories
 */

import type { PdfEditorInterface, PdfEditorOptions } from './types.js'
import { PdfEditor } from './core/pdf/PdfEditor.js'

/**
 * Create a new PDF editor instance
 *
 * @param options - Configuration options for the PDF editor
 * @returns A new PDF editor instance
 *
 * @remarks
 * Properties on `options`:
 * - `container` — The HTML element to contain the PDF editor
 * - `initialZoom` — Initial zoom level (default: 1.0)
 * - `defaultAuthor` — Default author name for annotations
 * - `onLoad` — Callback for document load events
 * - `onPageChange` — Callback for page change events
 * - `onZoomChange` — Callback for zoom change events
 * - `onAnnotationAdd` — Callback for annotation add events
 * - `onAnnotationRemove` — Callback for annotation remove events
 * - `onSave` — Callback for save events
 * - `onError` — Callback for error events
 *
 * @example
 * ```ts
 * const container = document.getElementById('pdf-container')
 * const editor = createPdfEditor({
 *   container,
 *   initialZoom: 1.0,
 *   onLoad: (fileName, pageCount) => {
 *     console.log(`Loaded ${fileName} with ${pageCount} pages`)
 *   },
 *   onError: (error) => {
 *     console.error('PDF error:', error)
 *   },
 * })
 *
 * // Load a PDF file
 * const fileInput = document.querySelector('input[type="file"]')
 * fileInput.addEventListener('change', async (e) => {
 *   const file = e.target.files[0]
 *   if (file) {
 *     await editor.load(file)
 *   }
 * })
 *
 * // Render the current page
 * const canvas = document.querySelector('canvas')
 * editor.renderPage(editor.getCurrentPage(), canvas)
 *
 * // Clean up when done
 * editor.destroy()
 * ```
 */
export function createPdfEditor(options: PdfEditorOptions): PdfEditorInterface {
	return new PdfEditor(options)
}
