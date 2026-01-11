/**
 * Documenta - Browser-only PDF editor library
 * @module documenta
 *
 * @example
 * ```ts
 * import { createPdfEditor, clamp, colorToCss, isValidPdfFile } from 'documenta'
 * import type { EditorInterface, Point, Color } from 'documenta'
 *
 * const editor = createPdfEditor({
 *   container: document.getElementById('editor')!,
 *   onLoad: (fileName, pageCount) => {
 *     console.log(`Loaded ${fileName} with ${pageCount} pages`)
 *   }
 * })
 * ```
 */

// Export factory functions
export * from './factories.js'

// Export helper functions
export * from './helpers.js'

// Export constants
export * from './constants.js'

// Export all types
export type * from './types.js'
