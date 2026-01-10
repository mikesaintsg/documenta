/**
 * Documenta - Browser PDF Editor Types
 * @module types
 */

// ============================================================================
// Foundational Types
// ============================================================================

/** Cleanup function returned by event subscriptions */
export type Unsubscribe = () => void

/** Result type for operations that may fail */
export interface Result<T = void> {
	readonly ok: boolean
	readonly value?: T
	readonly error?: string
}

// ============================================================================
// PDF Document State
// ============================================================================

/** Readonly snapshot of the PDF editor state */
export interface PdfDocumentState {
	readonly isLoaded: boolean
	readonly fileName: string | undefined
	readonly pageCount: number
	readonly currentPage: number
	readonly zoom: number
	readonly hasUnsavedChanges: boolean
}

// ============================================================================
// Viewport and Rendering
// ============================================================================

/** Viewport configuration for rendering */
export interface Viewport {
	readonly width: number
	readonly height: number
	readonly scale: number
}

/** Page dimensions */
export interface PageDimensions {
	readonly width: number
	readonly height: number
}

/** Point in 2D space */
export interface Point {
	readonly x: number
	readonly y: number
}

/** Rectangle bounds */
export interface Rectangle {
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
}

// ============================================================================
// Annotation Types
// ============================================================================

/** Supported annotation types */
export type AnnotationType =
	| 'Text'
	| 'FreeText'
	| 'Highlight'
	| 'Underline'
	| 'StrikeOut'
	| 'Ink'
	| 'Square'
	| 'Circle'

/** RGB Color representation */
export interface AnnotationColor {
	readonly r: number
	readonly g: number
	readonly b: number
}

/** Base annotation interface */
export interface Annotation {
	readonly id: string
	readonly type: AnnotationType
	readonly pageNumber: number
	readonly bounds: Rectangle
	readonly color: AnnotationColor
	readonly opacity: number
	readonly contents: string
	readonly author: string
	readonly createdAt: Date
	readonly modifiedAt: Date
}

/** Text annotation (sticky note) */
export interface TextAnnotation extends Annotation {
	readonly type: 'Text'
	readonly isOpen: boolean
}

/** Free text annotation (text box) */
export interface FreeTextAnnotation extends Annotation {
	readonly type: 'FreeText'
	readonly fontSize: number
	readonly fontColor: AnnotationColor
}

/** Highlight annotation */
export interface HighlightAnnotation extends Annotation {
	readonly type: 'Highlight'
	readonly quadPoints: readonly Point[]
}

/** Ink annotation (freehand drawing) */
export interface InkAnnotation extends Annotation {
	readonly type: 'Ink'
	readonly inkList: readonly (readonly Point[])[]
	readonly strokeWidth: number
}

/** Shape annotation for Square and Circle */
export interface ShapeAnnotation extends Annotation {
	readonly type: 'Square' | 'Circle'
	readonly strokeWidth: number
	readonly fillColor: AnnotationColor | undefined
}

/** Union of all annotation types */
export type AnyAnnotation =
	| TextAnnotation
	| FreeTextAnnotation
	| HighlightAnnotation
	| InkAnnotation
	| ShapeAnnotation

// ============================================================================
// Annotation Creation Data
// ============================================================================

/** Data required to create a new annotation */
export interface CreateAnnotationData {
	readonly type: AnnotationType
	readonly pageNumber: number
	readonly bounds: Rectangle
	readonly color?: AnnotationColor
	readonly opacity?: number
	readonly contents?: string
	readonly author?: string
}

/** Data for creating text annotation */
export interface CreateTextAnnotationData extends CreateAnnotationData {
	readonly type: 'Text'
	readonly isOpen?: boolean
}

/** Data for creating free text annotation */
export interface CreateFreeTextAnnotationData extends CreateAnnotationData {
	readonly type: 'FreeText'
	readonly fontSize?: number
	readonly fontColor?: AnnotationColor
}

/** Data for creating highlight annotation */
export interface CreateHighlightAnnotationData extends CreateAnnotationData {
	readonly type: 'Highlight'
	readonly quadPoints: readonly Point[]
}

/** Data for creating ink annotation */
export interface CreateInkAnnotationData extends CreateAnnotationData {
	readonly type: 'Ink'
	readonly inkList: readonly (readonly Point[])[]
	readonly strokeWidth?: number
}

/** Data for creating shape annotation */
export interface CreateShapeAnnotationData extends CreateAnnotationData {
	readonly type: 'Square' | 'Circle'
	readonly strokeWidth?: number
	readonly fillColor?: AnnotationColor
}

/** Union of all annotation creation data types */
export type AnyCreateAnnotationData =
	| CreateTextAnnotationData
	| CreateFreeTextAnnotationData
	| CreateHighlightAnnotationData
	| CreateInkAnnotationData
	| CreateShapeAnnotationData

// ============================================================================
// Event Callbacks
// ============================================================================

/** Callback for document load events */
export type LoadCallback = (fileName: string, pageCount: number) => void

/** Callback for page change events */
export type PageChangeCallback = (pageNumber: number) => void

/** Callback for zoom change events */
export type ZoomChangeCallback = (zoom: number) => void

/** Callback for annotation add events */
export type AnnotationAddCallback = (annotation: AnyAnnotation) => void

/** Callback for annotation remove events */
export type AnnotationRemoveCallback = (annotationId: string) => void

/** Callback for save events */
export type SaveCallback = (success: boolean) => void

/** Callback for error events */
export type ErrorCallback = (error: Error) => void

// ============================================================================
// PDF Editor Hooks (Event Subscriptions)
// ============================================================================

/** Event subscription methods for the PDF editor */
export interface PdfEditorHooksInterface {
	/** Subscribe to document load events */
	onLoad(callback: LoadCallback): Unsubscribe

	/** Subscribe to page change events */
	onPageChange(callback: PageChangeCallback): Unsubscribe

	/** Subscribe to zoom change events */
	onZoomChange(callback: ZoomChangeCallback): Unsubscribe

	/** Subscribe to annotation add events */
	onAnnotationAdd(callback: AnnotationAddCallback): Unsubscribe

	/** Subscribe to annotation remove events */
	onAnnotationRemove(callback: AnnotationRemoveCallback): Unsubscribe

	/** Subscribe to save events */
	onSave(callback: SaveCallback): Unsubscribe

	/** Subscribe to error events */
	onError(callback: ErrorCallback): Unsubscribe
}

// ============================================================================
// PDF Editor Options
// ============================================================================

/** Options for creating a PDF editor instance */
export interface PdfEditorOptions {
	/** Container element for the PDF editor */
	readonly container: HTMLElement

	/** Initial zoom level (default: 1.0) */
	readonly initialZoom?: number

	/** Default author for annotations */
	readonly defaultAuthor?: string

	/** Initial callback for document load events */
	readonly onLoad?: LoadCallback

	/** Initial callback for page change events */
	readonly onPageChange?: PageChangeCallback

	/** Initial callback for zoom change events */
	readonly onZoomChange?: ZoomChangeCallback

	/** Initial callback for annotation add events */
	readonly onAnnotationAdd?: AnnotationAddCallback

	/** Initial callback for annotation remove events */
	readonly onAnnotationRemove?: AnnotationRemoveCallback

	/** Initial callback for save events */
	readonly onSave?: SaveCallback

	/** Initial callback for error events */
	readonly onError?: ErrorCallback
}

// ============================================================================
// PDF Editor Interface
// ============================================================================

/**
 * Main PDF editor interface
 *
 * @remarks
 * This interface defines the complete API for the browser PDF editor.
 * Use the `createPdfEditor` factory function to create instances.
 */
export interface PdfEditorInterface extends PdfEditorHooksInterface {
	// -------------------------------------------------------------------------
	// Property Accessors
	// -------------------------------------------------------------------------

	/** Get the current state snapshot */
	getState(): PdfDocumentState

	/** Check if a document is loaded */
	isLoaded(): boolean

	/** Get the current page number (1-indexed) */
	getCurrentPage(): number

	/** Get the total page count */
	getPageCount(): number

	/** Get the current zoom level */
	getZoom(): number

	/** Check if there are unsaved changes */
	hasUnsavedChanges(): boolean

	/** Get the file name of the loaded document */
	getFileName(): string | undefined

	/** Get all annotations on a specific page */
	getAnnotations(pageNumber: number): readonly AnyAnnotation[]

	/** Get annotation by ID */
	getAnnotationById(id: string): AnyAnnotation | undefined

	// -------------------------------------------------------------------------
	// Property Mutators
	// -------------------------------------------------------------------------

	/** Set the zoom level */
	setZoom(zoom: number): void

	// -------------------------------------------------------------------------
	// Document Operations
	// -------------------------------------------------------------------------

	/**
	 * Load a PDF from a File object
	 *
	 * @param file - The PDF file to load
	 * @returns Promise that resolves when loading is complete
	 */
	load(file: File): Promise<void>

	/**
	 * Load a PDF from an ArrayBuffer
	 *
	 * @param buffer - The PDF data as ArrayBuffer
	 * @param fileName - Optional file name for the document
	 * @returns Promise that resolves when loading is complete
	 */
	loadFromBuffer(buffer: ArrayBuffer, fileName?: string): Promise<void>

	/**
	 * Render a specific page to a canvas element
	 *
	 * @param pageNumber - The page number to render (1-indexed)
	 * @param canvas - The canvas element to render to
	 */
	renderPage(pageNumber: number, canvas: HTMLCanvasElement): void

	/**
	 * Get the dimensions of a specific page
	 *
	 * @param pageNumber - The page number (1-indexed)
	 * @returns The page dimensions
	 */
	getPageDimensions(pageNumber: number): PageDimensions

	// -------------------------------------------------------------------------
	// Navigation
	// -------------------------------------------------------------------------

	/**
	 * Navigate to a specific page
	 *
	 * @param pageNumber - The page number to navigate to (1-indexed)
	 */
	goToPage(pageNumber: number): void

	/** Navigate to the previous page */
	goToPreviousPage(): void

	/** Navigate to the next page */
	goToNextPage(): void

	// -------------------------------------------------------------------------
	// Zoom Controls
	// -------------------------------------------------------------------------

	/** Zoom in by one step */
	zoomIn(): void

	/** Zoom out by one step */
	zoomOut(): void

	/** Reset zoom to default (1.0) */
	resetZoom(): void

	/** Fit the page to the container width */
	fitToWidth(): void

	/** Fit the entire page in the container */
	fitToPage(): void

	// -------------------------------------------------------------------------
	// Annotation Management
	// -------------------------------------------------------------------------

	/**
	 * Add an annotation to the document
	 *
	 * @param data - The annotation creation data
	 * @returns The created annotation
	 */
	addAnnotation(data: AnyCreateAnnotationData): AnyAnnotation

	/**
	 * Update an existing annotation
	 *
	 * @param id - The annotation ID
	 * @param updates - Partial annotation data to update
	 */
	updateAnnotation(id: string, updates: Partial<Annotation>): void

	/**
	 * Remove an annotation from the document
	 *
	 * @param id - The annotation ID to remove
	 */
	removeAnnotation(id: string): void

	// -------------------------------------------------------------------------
	// Save Operations
	// -------------------------------------------------------------------------

	/**
	 * Save the document to a file using File System Access API
	 *
	 * @returns Promise that resolves when save is complete
	 */
	save(): Promise<void>

	/**
	 * Save the document to a new file using File System Access API
	 *
	 * @returns Promise that resolves when save is complete
	 */
	saveAs(): Promise<void>

	/**
	 * Download the document as a file
	 *
	 * @param fileName - Optional custom file name
	 */
	download(fileName?: string): void

	/**
	 * Get the document as an ArrayBuffer
	 *
	 * @returns The PDF data as ArrayBuffer
	 */
	toArrayBuffer(): ArrayBuffer

	// -------------------------------------------------------------------------
	// Text Layer (OCR and Inline Editing)
	// -------------------------------------------------------------------------

	/**
	 * Get the text layer interface for OCR and inline editing
	 *
	 * @returns The text layer interface, or null if no document is loaded
	 */
	getTextLayer(): TextLayerInterface | null

	/**
	 * Enable or disable the text layer overlay
	 *
	 * @param enabled - Whether to enable the text layer
	 */
	setTextLayerEnabled(enabled: boolean): void

	/**
	 * Check if the text layer is enabled
	 *
	 * @returns Whether the text layer is enabled
	 */
	isTextLayerEnabled(): boolean

	/**
	 * Extract text from a specific page
	 *
	 * @param pageNumber - The page number (1-indexed)
	 * @returns Plain text content of the page
	 */
	getPageText(pageNumber: number): string

	/**
	 * Search for text across all pages
	 *
	 * @param query - The search query
	 * @returns Array of search results with page and bounds
	 */
	searchText(query: string): readonly { pageNumber: number; bounds: Rectangle }[]

	// -------------------------------------------------------------------------
	// Lifecycle
	// -------------------------------------------------------------------------

	/** Destroy the editor and release resources */
	destroy(): void
}

// ============================================================================
// File System Access API Types (for browsers that support it)
// ============================================================================

/** File picker options for opening PDFs */
export interface OpenFilePickerOptions {
	readonly types?: readonly FilePickerAcceptType[]
	readonly multiple?: boolean
}

/** File picker accept type */
export interface FilePickerAcceptType {
	readonly description: string
	readonly accept: Record<string, readonly string[]>
}

/** File save picker options */
export interface SaveFilePickerOptions {
	readonly suggestedName?: string
	readonly types?: readonly FilePickerAcceptType[]
}

// ============================================================================
// Text Layer and OCR Types
// ============================================================================

/** Text character with position and font information */
export interface TextCharacter {
	readonly char: string
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
	readonly fontSize: number
	readonly fontName: string
	readonly color: AnnotationColor
	readonly quad: readonly [number, number, number, number, number, number, number, number]
}

/** Text line containing multiple characters */
export interface TextLine {
	readonly id: string
	readonly chars: readonly TextCharacter[]
	readonly bounds: Rectangle
	readonly baseline: number
	readonly direction: Point
	readonly wmode: number
}

/** Text block containing multiple lines */
export interface TextBlock {
	readonly id: string
	readonly lines: readonly TextLine[]
	readonly bounds: Rectangle
}

/** Text layer for a page containing all text blocks */
export interface TextLayer {
	readonly pageNumber: number
	readonly blocks: readonly TextBlock[]
	readonly width: number
	readonly height: number
}

/** Text selection range */
export interface TextSelection {
	readonly startBlockId: string
	readonly startLineId: string
	readonly startCharIndex: number
	readonly endBlockId: string
	readonly endLineId: string
	readonly endCharIndex: number
	readonly selectedText: string
	readonly bounds: readonly Rectangle[]
}

/** Text edit operation */
export interface TextEdit {
	readonly id: string
	readonly pageNumber: number
	readonly originalText: string
	readonly newText: string
	readonly bounds: Rectangle
	readonly fontSize: number
	readonly fontName: string
	readonly color: AnnotationColor
	readonly timestamp: Date
}

/** Text editing mode */
export type TextEditMode = 'select' | 'edit' | 'none'

/** Callback for text selection events */
export type TextSelectionCallback = (selection: TextSelection | null) => void

/** Callback for text edit events */
export type TextEditCallback = (edit: TextEdit) => void

// ============================================================================
// Text Layer Hooks (Event Subscriptions)
// ============================================================================

/** Event subscription methods for the text layer */
export interface TextLayerHooksInterface {
	/** Subscribe to text selection events */
	onTextSelect(callback: TextSelectionCallback): Unsubscribe

	/** Subscribe to text edit events */
	onTextEdit(callback: TextEditCallback): Unsubscribe
}

// ============================================================================
// Text Layer Options
// ============================================================================

/** Options for the text layer overlay */
export interface TextLayerOptions {
	/** Enable text selection (default: true) */
	readonly enableSelection?: boolean

	/** Enable inline text editing (default: true) */
	readonly enableEditing?: boolean

	/** Highlight color for selection */
	readonly selectionColor?: AnnotationColor

	/** Initial callback for text selection */
	readonly onTextSelect?: TextSelectionCallback

	/** Initial callback for text edit */
	readonly onTextEdit?: TextEditCallback
}

// ============================================================================
// Text Layer Interface
// ============================================================================

/**
 * Text layer interface for OCR and inline editing
 *
 * @remarks
 * This interface provides text extraction, selection, and inline editing
 * capabilities using an overlay strategy on top of the PDF canvas.
 */
export interface TextLayerInterface extends TextLayerHooksInterface {
	// -------------------------------------------------------------------------
	// Property Accessors
	// -------------------------------------------------------------------------

	/** Get the current edit mode */
	getEditMode(): TextEditMode

	/** Get the current text selection */
	getSelection(): TextSelection | null

	/** Get all text edits for a page */
	getEdits(pageNumber: number): readonly TextEdit[]

	/** Check if text layer is visible */
	isVisible(): boolean

	// -------------------------------------------------------------------------
	// Property Mutators
	// -------------------------------------------------------------------------

	/** Set the edit mode */
	setEditMode(mode: TextEditMode): void

	/** Show or hide the text layer */
	setVisible(visible: boolean): void

	// -------------------------------------------------------------------------
	// Text Extraction
	// -------------------------------------------------------------------------

	/**
	 * Extract text layer from a page
	 *
	 * @param pageNumber - The page number (1-indexed)
	 * @returns The extracted text layer
	 */
	extractTextLayer(pageNumber: number): TextLayer

	/**
	 * Get plain text content of a page
	 *
	 * @param pageNumber - The page number (1-indexed)
	 * @returns Plain text content
	 */
	getPageText(pageNumber: number): string

	/**
	 * Search for text on a page
	 *
	 * @param pageNumber - The page number (1-indexed)
	 * @param query - The search query
	 * @returns Array of matching bounds
	 */
	searchText(pageNumber: number, query: string): readonly Rectangle[]

	// -------------------------------------------------------------------------
	// Text Selection
	// -------------------------------------------------------------------------

	/**
	 * Select text at a point
	 *
	 * @param pageNumber - The page number
	 * @param point - The point to start selection
	 */
	startSelection(pageNumber: number, point: Point): void

	/**
	 * Extend selection to a point
	 *
	 * @param point - The point to extend selection to
	 */
	extendSelection(point: Point): void

	/**
	 * End the current selection
	 */
	endSelection(): void

	/**
	 * Clear the current selection
	 */
	clearSelection(): void

	/**
	 * Copy selected text to clipboard
	 */
	copySelection(): Promise<void>

	// -------------------------------------------------------------------------
	// Inline Editing
	// -------------------------------------------------------------------------

	/**
	 * Start editing text at a point
	 *
	 * @param pageNumber - The page number
	 * @param point - The point to start editing
	 */
	startEditing(pageNumber: number, point: Point): void

	/**
	 * Apply the current edit
	 */
	applyEdit(): void

	/**
	 * Cancel the current edit
	 */
	cancelEdit(): void

	/**
	 * Undo the last edit
	 */
	undoEdit(): void

	/**
	 * Redo the last undone edit
	 */
	redoEdit(): void

	// -------------------------------------------------------------------------
	// Rendering
	// -------------------------------------------------------------------------

	/**
	 * Render the text layer overlay
	 *
	 * @param pageNumber - The page number
	 * @param container - The container element
	 * @param scale - The current zoom scale
	 */
	render(pageNumber: number, container: HTMLElement, scale: number): void

	/**
	 * Update the text layer for zoom/scroll changes
	 *
	 * @param scale - The new scale
	 */
	update(scale: number): void

	// -------------------------------------------------------------------------
	// Lifecycle
	// -------------------------------------------------------------------------

	/** Destroy the text layer and release resources */
	destroy(): void
}
