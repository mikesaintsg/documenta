/**
 * Documenta - Constants
 * @module constants
 *
 * Centralized constants for the PDF editor library.
 * All magic numbers are extracted here for maintainability.
 */

import type { Color, PageSize } from './types.js'

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
// Page Size Constants
// ============================================================================

/**
 * Letter page size in points (8.5 x 11 inches)
 *
 * @remarks
 * @preserve Used by page management in Phase 6 for addBlankPage default
 */
export const PAGE_SIZE_LETTER:  PageSize = {
	width: 612,
	height:  792,
} as const

/**
 * A4 page size in points (210 x 297 mm)
 *
 * @remarks
 * @preserve Used by page management in Phase 6 for international default
 */
export const PAGE_SIZE_A4: PageSize = {
	width: 595,
	height:  842,
} as const

/**
 * Legal page size in points (8.5 x 14 inches)
 *
 * @remarks
 * @preserve Used by page management in Phase 6
 */
export const PAGE_SIZE_LEGAL: PageSize = {
	width:  612,
	height: 1008,
} as const

/** Default page size (Letter) */
export const DEFAULT_PAGE_SIZE:  PageSize = PAGE_SIZE_LETTER

// ============================================================================
// Layer Z-Index Constants
// ============================================================================

/**
 * Z-index for the canvas layer (PDF rendering)
 *
 * @remarks
 * @preserve Used by LayerStack in Phase 3
 */
export const Z_INDEX_CANVAS = 0 as const

/**
 * Z-index for the text layer (selection/editing overlay)
 *
 * @remarks
 * @preserve Used by LayerStack in Phase 3, TextLayer in Phase 4
 */
export const Z_INDEX_TEXT = 10 as const

/**
 * Z-index for the drawing layer (freehand canvas)
 *
 * @remarks
 * @preserve Used by LayerStack in Phase 3, DrawingLayer in Phase 5
 */
export const Z_INDEX_DRAWING = 20 as const

/**
 * Z-index for the form layer (input overlays)
 *
 * @remarks
 * @preserve Used by LayerStack in Phase 3, FormLayer in Phase 6
 */
export const Z_INDEX_FORM = 30 as const

/**
 * Z-index for the annotation layer (notes, shapes)
 *
 * @remarks
 * @preserve Used by LayerStack in Phase 3, AnnotationLayer in Phase 6
 */
export const Z_INDEX_ANNOTATION = 40 as const

/**
 * All layer z-indices for reference
 *
 * @remarks
 * @preserve Used by LayerStack in Phase 3 for layer ordering
 */
export const LAYER_Z_INDICES = {
	canvas: Z_INDEX_CANVAS,
	text: Z_INDEX_TEXT,
	drawing: Z_INDEX_DRAWING,
	form: Z_INDEX_FORM,
	annotation: Z_INDEX_ANNOTATION,
} as const

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

/** Default font size for free text annotations (in points) */
export const DEFAULT_FREETEXT_FONT_SIZE = 12 as const

// ============================================================================
// Drawing Tool Constants
// ============================================================================

/**
 * Default pen stroke width
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5
 */
export const DEFAULT_PEN_WIDTH = 2 as const

/**
 * Default highlighter stroke width
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5
 */
export const DEFAULT_HIGHLIGHTER_WIDTH = 12 as const

/**
 * Default eraser stroke width
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5
 */
export const DEFAULT_ERASER_WIDTH = 20 as const

/**
 * Default highlighter opacity
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5
 */
export const DEFAULT_HIGHLIGHTER_OPACITY = 0.4 as const

/**
 * Minimum distance between stroke points (for optimization)
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5 to reduce point count
 */
export const MIN_STROKE_POINT_DISTANCE = 4 as const

/**
 * Minimum number of points for a valid stroke
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5 to filter accidental taps
 */
export const MIN_STROKE_POINTS = 2 as const

// ============================================================================
// Color Constants
// ============================================================================

/** Yellow color (default for highlights) */
export const COLOR_YELLOW:  Color = { r: 1, g: 0.92, b: 0.23 } as const

/** Red color */
export const COLOR_RED: Color = { r: 1, g: 0, b: 0 } as const

/** Green color */
export const COLOR_GREEN: Color = { r: 0, g: 0.8, b: 0 } as const

/** Blue color */
export const COLOR_BLUE: Color = { r: 0, g: 0.4, b: 1 } as const

/** Orange color */
export const COLOR_ORANGE:  Color = { r:  1, g:  0.6, b: 0 } as const

/** Purple color */
export const COLOR_PURPLE: Color = { r: 0.6, g: 0, b: 0.8 } as const

/** Pink color */
export const COLOR_PINK:  Color = { r:  1, g:  0.4, b: 0.7 } as const

/** Black color */
export const COLOR_BLACK: Color = { r: 0, g: 0, b: 0 } as const

/** White color */
export const COLOR_WHITE: Color = { r: 1, g: 1, b: 1 } as const

/** Gray color */
export const COLOR_GRAY: Color = { r: 0.5, g: 0.5, b: 0.5 } as const

/** All available annotation colors */
export const ANNOTATION_COLORS:  readonly Color[] = [
	COLOR_YELLOW,
	COLOR_RED,
	COLOR_GREEN,
	COLOR_BLUE,
	COLOR_ORANGE,
	COLOR_PURPLE,
	COLOR_PINK,
	COLOR_BLACK,
] as const

/** Default color for text annotations (sticky notes) */
export const DEFAULT_TEXT_ANNOTATION_COLOR: Color = COLOR_YELLOW

/** Default color for highlight annotations */
export const DEFAULT_HIGHLIGHT_COLOR: Color = COLOR_YELLOW

/** Default color for ink/pen annotations */
export const DEFAULT_INK_COLOR: Color = COLOR_BLACK

/** Default color for shape annotations */
export const DEFAULT_SHAPE_COLOR: Color = COLOR_BLUE

/** Default color for free text font */
export const DEFAULT_FREETEXT_FONT_COLOR: Color = COLOR_BLACK

/**
 * Default pen color
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5
 */
export const DEFAULT_PEN_COLOR:  Color = COLOR_BLACK

/**
 * Default highlighter color
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5
 */
export const DEFAULT_HIGHLIGHTER_COLOR:  Color = COLOR_YELLOW

// ============================================================================
// Form Field Constants
// ============================================================================

/**
 * Default form field highlight color
 *
 * @remarks
 * @preserve Used by FormLayer in Phase 6
 */
export const DEFAULT_FORM_HIGHLIGHT_COLOR: Color = {
	r: 0.8,
	g: 0.9,
	b: 1.0,
} as const

/**
 * Default form field border color
 *
 * @remarks
 * @preserve Used by FormLayer in Phase 6
 */
export const DEFAULT_FORM_BORDER_COLOR: Color = {
	r:  0.2,
	g:  0.4,
	b:  0.8,
} as const

/**
 * Form field highlight opacity
 *
 * @remarks
 * @preserve Used by FormLayer in Phase 6
 */
export const FORM_HIGHLIGHT_OPACITY = 0.3 as const

// ============================================================================
// File Constants
// ============================================================================

/** PDF MIME type */
export const PDF_MIME_TYPE = 'application/pdf' as const

/** PDF file extension */
export const PDF_EXTENSION = '.pdf' as const

/**
 * File picker accept type for PDF files
 *
 * @remarks
 * @preserve Used by FileManager in Phase 2 for file dialogs
 */
export const PDF_FILE_PICKER_ACCEPT = {
	description:  'PDF Files',
	accept: {
		'application/pdf': ['.pdf'],
	},
} as const

// ============================================================================
// Gesture/Touch Constants
// ============================================================================

/**
 * Maximum duration for a tap gesture (milliseconds)
 *
 * @remarks
 * @preserve Used by GestureRecognizer in Phase 3
 */
export const TAP_MAX_DURATION = 200 as const

/**
 * Maximum gap between taps for double-tap (milliseconds)
 *
 * @remarks
 * @preserve Used by GestureRecognizer in Phase 3
 */
export const DOUBLETAP_MAX_GAP = 300 as const

/**
 * Duration for long-press gesture (milliseconds)
 *
 * @remarks
 * @preserve Used by GestureRecognizer in Phase 3
 */
export const LONGPRESS_DURATION = 500 as const

/**
 * Maximum distance for a tap gesture (pixels)
 *
 * @remarks
 * @preserve Used by GestureRecognizer in Phase 3
 * Movement beyond this cancels the tap
 */
export const TAP_MAX_DISTANCE = 10 as const

/**
 * Minimum distance to start a pan gesture (pixels)
 *
 * @remarks
 * @preserve Used by GestureRecognizer in Phase 3
 */
export const PAN_MIN_DISTANCE = 5 as const

/**
 * Minimum touch target size (pixels) - iOS/Android guidelines
 *
 * @remarks
 * @preserve Used by UI components for accessibility
 */
export const MIN_TOUCH_TARGET = 44 as const

/**
 * Pinch gesture threshold for zoom change
 *
 * @remarks
 * @preserve Used by GestureRecognizer in Phase 3
 * Scale must change by this factor to trigger zoom
 */
export const PINCH_THRESHOLD = 0.05 as const

// ============================================================================
// Text Layer Constants
// ============================================================================

/**
 * Selection highlight color for text layer
 *
 * @remarks
 * @preserve Used by TextLayer in Phase 4
 */
export const TEXT_SELECTION_COLOR: Color = {
	r: 0.2,
	g:  0.5,
	b: 1.0,
} as const

/**
 * Selection highlight opacity
 *
 * @remarks
 * @preserve Used by TextLayer in Phase 4
 */
export const TEXT_SELECTION_OPACITY = 0.3 as const

/**
 * Cursor style for text selection mode
 *
 * @remarks
 * @preserve Used by TextLayer in Phase 4
 */
export const TEXT_CURSOR_SELECT = 'text' as const

/**
 * Cursor style for text editing mode
 *
 * @remarks
 * @preserve Used by TextLayer in Phase 4
 */
export const TEXT_CURSOR_EDIT = 'text' as const

// ============================================================================
// Rendering Constants
// ============================================================================

/**
 * Debounce delay for resize events (milliseconds)
 *
 * @remarks
 * @preserve Used by PdfEditor in Phase 2
 */
export const RESIZE_DEBOUNCE_DELAY = 150 as const

/**
 * Throttle limit for pointer move events (milliseconds)
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5 for ~60fps
 */
export const POINTER_MOVE_THROTTLE = 16 as const

/**
 * Maximum canvas dimension (pixels)
 *
 * @remarks
 * @preserve Used by CanvasLayer in Phase 2 to prevent GPU limits
 * Mobile GPUs typically support 4096x4096 max
 */
export const MAX_CANVAS_DIMENSION = 4096 as const

/**
 * Render quality for PDF to canvas (higher = better quality, slower)
 *
 * @remarks
 * @preserve Used by CanvasLayer in Phase 2
 */
export const DEFAULT_RENDER_SCALE = 1.5 as const

// ============================================================================
// Animation Constants
// ============================================================================

/**
 * Duration for UI transitions (milliseconds)
 *
 * @remarks
 * @preserve Used by UI components for consistent animations
 */
export const TRANSITION_DURATION = 150 as const

/**
 * Duration for toast notifications (milliseconds)
 *
 * @remarks
 * @preserve Used by showcase demo
 */
export const TOAST_DURATION = 3000 as const

// ============================================================================
// Undo/Redo Constants
// ============================================================================

/**
 * Maximum number of undo steps to keep
 *
 * @remarks
 * @preserve Used by DrawingLayer in Phase 5, TextLayer in Phase 4
 */
export const MAX_UNDO_STEPS = 50 as const

// ============================================================================
// Keyboard Constants
// ============================================================================

/**
 * Key codes for keyboard shortcuts
 *
 * @remarks
 * @preserve Used by keyboard event handling in Phase 2+
 */
export const KEYS = {
	ESCAPE: 'Escape',
	ENTER: 'Enter',
	BACKSPACE: 'Backspace',
	DELETE: 'Delete',
	TAB:  'Tab',
	ARROW_LEFT: 'ArrowLeft',
	ARROW_RIGHT: 'ArrowRight',
	ARROW_UP: 'ArrowUp',
	ARROW_DOWN: 'ArrowDown',
	PAGE_UP: 'PageUp',
	PAGE_DOWN:  'PageDown',
	HOME: 'Home',
	END: 'End',
	PLUS: '+',
	MINUS: '-',
	EQUAL: '=',
	ZERO: '0',
} as const

// ============================================================================
// CSS Class Names
// ============================================================================

/**
 * CSS class prefix for all Documenta elements
 *
 * @remarks
 * @preserve Used by all layers for namespaced CSS classes
 */
export const CSS_PREFIX = 'documenta' as const

/**
 * CSS class names for layers
 *
 * @remarks
 * @preserve Used by layer implementations for DOM element classes
 */
export const CSS_CLASSES = {
	CONTAINER: `${CSS_PREFIX}-container`,
	CANVAS_LAYER: `${CSS_PREFIX}-canvas-layer`,
	TEXT_LAYER: `${CSS_PREFIX}-text-layer`,
	DRAWING_LAYER: `${CSS_PREFIX}-drawing-layer`,
	FORM_LAYER:  `${CSS_PREFIX}-form-layer`,
	ANNOTATION_LAYER: `${CSS_PREFIX}-annotation-layer`,
	PAGE_WRAPPER: `${CSS_PREFIX}-page-wrapper`,
	TEXT_SPAN: `${CSS_PREFIX}-text-span`,
	TEXT_LINE: `${CSS_PREFIX}-text-line`,
	TEXT_BLOCK: `${CSS_PREFIX}-text-block`,
	SELECTION_HIGHLIGHT: `${CSS_PREFIX}-selection-highlight`,
	EDIT_INPUT: `${CSS_PREFIX}-edit-input`,
	FORM_FIELD: `${CSS_PREFIX}-form-field`,
	ANNOTATION:  `${CSS_PREFIX}-annotation`,
	ANNOTATION_SELECTED: `${CSS_PREFIX}-annotation-selected`,
} as const

// ============================================================================
// Data Attributes
// ============================================================================

/**
 * Data attribute names for DOM elements
 *
 * @remarks
 * @preserve Used by layers for element identification and state
 */
export const DATA_ATTRIBUTES = {
	PAGE_NUMBER: 'data-page-number',
	BLOCK_ID: 'data-block-id',
	LINE_ID: 'data-line-id',
	CHAR_INDEX: 'data-char-index',
	FIELD_ID: 'data-field-id',
	FIELD_TYPE: 'data-field-type',
	ANNOTATION_ID: 'data-annotation-id',
	ANNOTATION_TYPE: 'data-annotation-type',
	STROKE_ID: 'data-stroke-id',
} as const

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Error messages for consistent error reporting
 *
 * @remarks
 * @preserve Used throughout the library for error handling
 */
export const ERROR_MESSAGES = {
	NO_DOCUMENT: 'No document is loaded',
	INVALID_PAGE:  'Invalid page number',
	INVALID_ZOOM: 'Invalid zoom level',
	INVALID_FILE:  'Invalid PDF file',
	LOAD_FAILED: 'Failed to load PDF document',
	SAVE_FAILED:  'Failed to save PDF document',
	RENDER_FAILED: 'Failed to render page',
	NO_CONTAINER: 'Container element is required',
	LAYER_NOT_FOUND: 'Layer not found',
	ANNOTATION_NOT_FOUND: 'Annotation not found',
	FIELD_NOT_FOUND: 'Form field not found',
	FILE_SYSTEM_NOT_SUPPORTED: 'File System Access API is not supported',
} as const

// ============================================================================
// Default Editor Options
// ============================================================================

/**
 * Default editor configuration values
 *
 * @remarks
 * @preserve Used by PdfEditor constructor in Phase 2
 */
export const DEFAULT_EDITOR_OPTIONS = {
	initialZoom: DEFAULT_ZOOM,
	initialMode: 'pan',
	enableTextLayer: true,
	enableDrawingLayer: true,
	enableFormLayer: true,
	enableAnnotationLayer: true,
} as const
