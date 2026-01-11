/**
 * Documenta - Factory Functions
 * @module factories
 *
 * Factory functions for creating library instances.
 */

import type { EditorOptions, EditorInterface } from './types.js'
import { PdfEditor } from './core/PdfEditor.js'

/**
 * Create a new PDF editor instance
 *
 * @param options - Editor configuration options
 * @returns Configured editor instance
 *
 * @example
 * ```ts
 * const editor = createPdfEditor({
 *   container: document.getElementById('editor'),
 *   initialZoom: 1.5,
 *   initialMode: 'pan',
 *   onLoad: (fileName, pageCount) => {
 *     console.log(`Loaded ${fileName} with ${pageCount} pages`)
 *   }
 * })
 *
 * await editor.load(pdfFile)
 * ```
 */
export function createPdfEditor(options: EditorOptions): EditorInterface {
	return new PdfEditor(options)
}
