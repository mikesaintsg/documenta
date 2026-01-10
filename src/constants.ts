/**
 * Documenta - Constants
 * @module constants
 */

import type { AnnotationColor } from './types.js'

// ============================================================================
// Zoom Constants
// ============================================================================

/** Default zoom level */
export const DEFAULT_ZOOM = 1.0 as const

/** Minimum zoom level */
export const MIN_ZOOM = 0.25 as const

/** Maximum zoom level */
export const MAX_ZOOM = 5.0 as const

/** Zoom step for zoom in/out operations */
export const ZOOM_STEP = 0.25 as const

// ============================================================================
// Page Display Constants
// ============================================================================

/** Default gap between pages in pixels */
export const DEFAULT_PAGE_GAP = 20 as const

/** Default page padding in pixels */
export const DEFAULT_PAGE_PADDING = 10 as const

// ============================================================================
// Annotation Constants
// ============================================================================

/** Default annotation opacity */
export const DEFAULT_ANNOTATION_OPACITY = 1.0 as const

/** Default highlight opacity */
export const DEFAULT_HIGHLIGHT_OPACITY = 0.5 as const

/** Default stroke width for ink annotations */
export const DEFAULT_INK_STROKE_WIDTH = 2 as const

/** Default stroke width for shape annotations */
export const DEFAULT_SHAPE_STROKE_WIDTH = 1 as const

/** Default font size for free text annotations */
export const DEFAULT_FREETEXT_FONT_SIZE = 12 as const

// ============================================================================
// Annotation Colors
// ============================================================================

/** Yellow highlight color */
export const COLOR_YELLOW: AnnotationColor = { r: 1, g: 0.92, b: 0.23 } as const

/** Red annotation color */
export const COLOR_RED: AnnotationColor = { r: 1, g: 0, b: 0 } as const

/** Green annotation color */
export const COLOR_GREEN: AnnotationColor = { r: 0, g: 0.8, b: 0 } as const

/** Blue annotation color */
export const COLOR_BLUE: AnnotationColor = { r: 0, g: 0.4, b: 1 } as const

/** Orange annotation color */
export const COLOR_ORANGE: AnnotationColor = { r: 1, g: 0.6, b: 0 } as const

/** Purple annotation color */
export const COLOR_PURPLE: AnnotationColor = { r: 0.6, g: 0, b: 0.8 } as const

/** Pink annotation color */
export const COLOR_PINK: AnnotationColor = { r: 1, g: 0.4, b: 0.7 } as const

/** Black annotation color */
export const COLOR_BLACK: AnnotationColor = { r: 0, g: 0, b: 0 } as const

/** White annotation color */
export const COLOR_WHITE: AnnotationColor = { r: 1, g: 1, b: 1 } as const

/** All available annotation colors */
export const ANNOTATION_COLORS: readonly AnnotationColor[] = [
	COLOR_YELLOW,
	COLOR_RED,
	COLOR_GREEN,
	COLOR_BLUE,
	COLOR_ORANGE,
	COLOR_PURPLE,
	COLOR_PINK,
	COLOR_BLACK,
] as const

/** Default color for text annotations */
export const DEFAULT_TEXT_ANNOTATION_COLOR: AnnotationColor = COLOR_YELLOW

/** Default color for highlight annotations */
export const DEFAULT_HIGHLIGHT_COLOR: AnnotationColor = COLOR_YELLOW

/** Default color for ink annotations */
export const DEFAULT_INK_COLOR: AnnotationColor = COLOR_RED

/** Default color for shape annotations */
export const DEFAULT_SHAPE_COLOR: AnnotationColor = COLOR_BLUE

/** Default color for free text font */
export const DEFAULT_FREETEXT_FONT_COLOR: AnnotationColor = COLOR_BLACK

// ============================================================================
// File Constants
// ============================================================================

/** PDF MIME type */
export const PDF_MIME_TYPE = 'application/pdf' as const

/** PDF file extension */
export const PDF_EXTENSION = '.pdf' as const

/** File picker accept type for PDF files */
export const PDF_FILE_PICKER_ACCEPT = {
	description: 'PDF Files',
	accept: {
		'application/pdf': ['.pdf'],
	},
} as const

// ============================================================================
// Page Size Constants (Tier 3)
// ============================================================================

/** Letter page size in points (8.5 x 11 inches) */
export const PAGE_SIZE_LETTER = { width: 612, height: 792 } as const

/** A4 page size in points (210 x 297 mm) */
export const PAGE_SIZE_A4 = { width: 595, height: 842 } as const

/** Legal page size in points (8.5 x 14 inches) */
export const PAGE_SIZE_LEGAL = { width: 612, height: 1008 } as const

/** Default page size */
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_LETTER

// ============================================================================
// Drawing Constants (Tier 3)
// ============================================================================

/** Default pen stroke width */
export const DEFAULT_PEN_WIDTH = 2 as const

/** Default highlighter stroke width */
export const DEFAULT_HIGHLIGHTER_WIDTH = 12 as const

/** Default eraser stroke width */
export const DEFAULT_ERASER_WIDTH = 20 as const

/** Default pen color */
export const DEFAULT_PEN_COLOR = COLOR_BLACK

/** Default highlighter color */
export const DEFAULT_HIGHLIGHTER_COLOR = COLOR_YELLOW

/** Default highlighter opacity */
export const DEFAULT_HIGHLIGHTER_OPACITY = 0.4 as const

// ============================================================================
// Form Field Constants (Tier 3)
// ============================================================================

/** Default form field highlight color */
export const DEFAULT_FORM_HIGHLIGHT_COLOR = { r: 0.8, g: 0.9, b: 1.0 } as const

/** Default form field border color */
export const DEFAULT_FORM_BORDER_COLOR = { r: 0.2, g: 0.4, b: 0.8 } as const
